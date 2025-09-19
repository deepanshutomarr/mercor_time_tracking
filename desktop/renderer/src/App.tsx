import React, { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { TimeTrackingProvider } from './contexts/TimeTrackingContext'
import LoginScreen from './components/LoginScreen'
import MainApp from './components/MainApp'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await window.electronAPI.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const handleAuthStateChange = (data: { 
      isAuthenticated: boolean, 
      user?: { 
        _id: string;
        name: string;
        email: string;
        title?: string;
        teamId: string;
      }
    }) => {
      setIsAuthenticated(data.isAuthenticated)
    }

    window.electronAPI.onAuthStateChange(handleAuthStateChange)

    return () => {
      window.electronAPI.removeAllListeners('auth:state-change')
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <AuthProvider>
      <TimeTrackingProvider>
        {isAuthenticated ? <MainApp /> : <LoginScreen />}
      </TimeTrackingProvider>
    </AuthProvider>
  )
}

export default App
