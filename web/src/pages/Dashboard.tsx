import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApi } from '../contexts/ApiContext'
import { Clock, Play, Pause, BarChart3, Calendar, Download } from 'lucide-react'
import toast from 'react-hot-toast'

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

interface TimeEntry {
  _id: string
  projectId: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number
  isActive: boolean
  project: Project
  task: Task
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { api } = useApi()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [projectsRes, tasksRes, activeRes] = await Promise.all([
        api.get('/project'),
        api.get('/task'),
        api.get('/time-tracking/active')
      ])

      setProjects(projectsRes.data.data)
      setTasks(tasksRes.data.data)
      setActiveTimeEntry(activeRes.data.data[0] || null)
      setIsTracking(activeRes.data.data.length > 0)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const startTimeTracking = async (projectId: string, taskId: string) => {
    try {
      const response = await api.post('/time-tracking/start', {
        projectId,
        taskId
      })
      setActiveTimeEntry(response.data.data)
      setIsTracking(true)
      toast.success('Time tracking started')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start tracking')
    }
  }

  const stopTimeTracking = async () => {
    if (!activeTimeEntry) return

    try {
      const response = await api.post('/time-tracking/stop', {
        timeEntryId: activeTimeEntry._id
      })
      setActiveTimeEntry(null)
      setIsTracking(false)
      toast.success('Time tracking stopped')
      loadData() // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to stop tracking')
    }
  }

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Track your time and manage your tasks efficiently.
        </p>
      </div>

      {/* Active Time Tracking */}
      {isTracking && activeTimeEntry && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">
                Currently Tracking
              </h3>
              <p className="text-primary-700">
                {activeTimeEntry.project.name} - {activeTimeEntry.task.name}
              </p>
              <p className="text-sm text-primary-600">
                Started at {new Date(activeTimeEntry.startTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-900">
                {formatDuration(Date.now() - new Date(activeTimeEntry.startTime).getTime())}
              </p>
              <button
                onClick={stopTimeTracking}
                className="btn btn-outline mt-2"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Projects</h2>
            <p className="card-description">
              Select a project to start time tracking
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-500">{project.description}</p>
                    )}
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      project.billable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.billable ? 'Billable' : 'Non-billable'}
                    </span>
                  </div>
                  {!isTracking && (
                    <button
                      onClick={() => {
                        const projectTasks = tasks.filter(task => task.projectId === project._id)
                        if (projectTasks.length > 0) {
                          startTimeTracking(project._id, projectTasks[0]._id)
                        } else {
                          toast.error('No tasks available for this project')
                        }
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Tasks</h2>
            <p className="card-description">
              Your assigned tasks
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-500">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Download App CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">
          Download the Desktop App
        </h2>
        <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
          Get the full experience with our desktop application. Automatic screenshot capture, 
          offline support, and advanced features.
        </p>
        <a
          href="/download"
          className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg inline-flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Download Desktop App
        </a>
      </div>
    </div>
  )
}

export default Dashboard
