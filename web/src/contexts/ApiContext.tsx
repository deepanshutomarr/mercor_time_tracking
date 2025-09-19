import React, { createContext, useContext, ReactNode } from 'react'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL?: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

interface ApiContextType {
  api: AxiosInstance
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

interface ApiProviderProps {
  children: ReactNode
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  )
}

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}
