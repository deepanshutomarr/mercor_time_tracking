import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  _id: string
  name: string
  email: string
  title?: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await window.electronAPI.getUser()
        if (response.success) {
          setUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const handleAuthStateChange = (data: any) => {
      setIsAuthenticated(data.isAuthenticated)
      setUser(data.user || null)
    }

    window.electronAPI.onAuthStateChange(handleAuthStateChange)

    return () => {
      window.electronAPI.removeAllListeners('auth:state-change')
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await window.electronAPI.login({ email, password })
      if (response.success) {
        setUser(response.data.employee)
        setIsAuthenticated(true)
      } else {
        throw new Error('Login failed')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      await window.electronAPI.logout()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
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
