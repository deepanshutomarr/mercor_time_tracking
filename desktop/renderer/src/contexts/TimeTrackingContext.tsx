import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TimeEntry {
  _id: string
  projectId: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number
  isActive: boolean
  description?: string
  project?: {
    _id: string
    name: string
    description?: string
  }
  task?: {
    _id: string
    name: string
    description?: string
  }
}

interface Project {
  _id: string
  name: string
  description?: string
  billable: boolean
}

interface Task {
  _id: string
  name: string
  description?: string
  projectId: string
  priority: string
  status: string
}

interface TimeTrackingContextType {
  activeEntry: TimeEntry | null
  isTracking: boolean
  projects: Project[]
  tasks: Task[]
  startTracking: (projectId: string, taskId: string, description?: string) => Promise<void>
  stopTracking: () => Promise<void>
  loadProjects: () => Promise<void>
  loadTasks: (projectId: string) => Promise<void>
  isLoading: boolean
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined)

interface TimeTrackingProviderProps {
  children: ReactNode
}

export const TimeTrackingProvider: React.FC<TimeTrackingProviderProps> = ({ children }) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadProjects()
        await loadActiveEntry()
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()

    // Listen for time tracking updates
    const handleTimeTrackingUpdate = (data: any) => {
      if (data.type === 'started') {
        setActiveEntry(data.entry)
      } else if (data.type === 'stopped') {
        setActiveEntry(null)
      }
    }

    window.electronAPI.onTimeTrackingUpdate(handleTimeTrackingUpdate)

    return () => {
      window.electronAPI.removeAllListeners('time-tracking:update')
    }
  }, [])

  const loadActiveEntry = async () => {
    try {
      const response = await window.electronAPI.getActiveTimeEntry()
      if (response.success) {
        setActiveEntry(response.data)
      }
    } catch (error) {
      console.error('Failed to load active entry:', error)
    }
  }

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await window.electronAPI.getProjects()
      if (response.success) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTasks = async (projectId: string) => {
    try {
      setIsLoading(true)
      const response = await window.electronAPI.getProjectTasks(projectId)
      if (response.success) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTracking = async (projectId: string, taskId: string, description?: string) => {
    try {
      const response = await window.electronAPI.startTimeTracking({
        projectId,
        taskId,
        description
      })
      if (response.success) {
        setActiveEntry(response.data)
      } else {
        throw new Error('Failed to start tracking')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to start tracking')
    }
  }

  const stopTracking = async () => {
    if (!activeEntry) return

    try {
      const response = await window.electronAPI.stopTimeTracking(activeEntry._id)
      if (response.success) {
        setActiveEntry(null)
      } else {
        throw new Error('Failed to stop tracking')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to stop tracking')
    }
  }

  const value: TimeTrackingContextType = {
    activeEntry,
    isTracking: !!activeEntry?.isActive,
    projects,
    tasks,
    startTracking,
    stopTracking,
    loadProjects,
    loadTasks,
    isLoading
  }

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  )
}

export const useTimeTracking = (): TimeTrackingContextType => {
  const context = useContext(TimeTrackingContext)
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider')
  }
  return context
}
