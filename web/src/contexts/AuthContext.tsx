import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useApi } from './ApiContext'

interface User {
  _id: string
  name: string
  email: string
  title?: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  activateAccount: (token: string) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { api } = useApi()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/employee/login', { email, password })
      // Debug: log the full response for troubleshooting
      console.debug('Login API response:', response.data)
      if (!response.data?.data?.token || !response.data?.data?.employee) {
        throw new Error('Invalid login response from server')
      }
      const { token: newToken, employee } = response.data.data

      setToken(newToken)
      setUser(employee)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(employee))
    } catch (error: any) {
      // Debug: log the error for troubleshooting
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Login failed')
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const activateAccount = async (activationToken: string) => {
    try {
      const response = await api.post('/employee/activate-account', { 
        token: activationToken 
      })
      const { employee } = response.data.data
      setUser(employee)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Account activation failed')
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    activateAccount,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
