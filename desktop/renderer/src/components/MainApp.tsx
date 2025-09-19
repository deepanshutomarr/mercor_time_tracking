import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTimeTracking } from '../contexts/TimeTrackingContext'

import { 
  Play, 
  Pause, 
  Clock, 
  User, 
  Settings, 
  Minimize2, 
  Maximize2, 
  X,
  LogOut
} from 'lucide-react'

const MainApp: React.FC = () => {
  const { user, logout } = useAuth()
  const { 
    activeEntry, 
    isTracking, 
    projects, 
    tasks, 
    startTracking, 
    stopTracking, 
    loadTasks,
    isLoading 
  } = useTimeTracking()

  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [showProjectSelector, setShowProjectSelector] = useState(false)

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const getCurrentDuration = () => {
    if (!activeEntry || !activeEntry.isActive) return '00:00'
    const duration = Date.now() - new Date(activeEntry.startTime).getTime()
    return formatDuration(duration)
  }

  const handleStartTracking = async () => {
    if (!selectedProject || !selectedTask) {
      alert('Please select a project and task')
      return
    }

    try {
      await startTracking(selectedProject, selectedTask, description)
      setShowProjectSelector(false)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleStopTracking = async () => {
    try {
      await stopTracking()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId)
    setSelectedTask('')
    if (projectId) {
      await loadTasks(projectId)
    }
  }

  const handleWindowAction = (action: string) => {
    switch (action) {
      case 'minimize':
        window.electronAPI.minimizeWindow()
        break
      case 'maximize':
        window.electronAPI.maximizeWindow()
        break
      case 'close':
        window.electronAPI.closeWindow()
        break
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Title Bar */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-gray-900">Mercor Time Tracking</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleWindowAction('minimize')}
            className="p-1 hover:bg-gray-100 rounded"
            title="Minimize window"
            aria-label="Minimize window"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleWindowAction('maximize')}
            className="p-1 hover:bg-gray-100 rounded"
            title="Maximize window"
            aria-label="Maximize window"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleWindowAction('close')}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close window"
            aria-label="Close window"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-full">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Welcome, {user?.name}!
                </h2>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Time Tracking Status */}
          {isTracking && activeEntry ? (
            <div className="card bg-primary-50 border-primary-200">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">
                      Currently Tracking
                    </h3>
                    <p className="text-primary-700">
                      {activeEntry.project?.name} - {activeEntry.task?.name}
                    </p>
                    <p className="text-sm text-primary-600">
                      Started at {new Date(activeEntry.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-900 mb-2">
                      {getCurrentDuration()}
                    </div>
                    <button
                      onClick={handleStopTracking}
                      className="btn btn-outline"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Tracking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content">
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to start tracking?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a project and task to begin time tracking
                  </p>
                  <button
                    onClick={() => setShowProjectSelector(true)}
                    className="btn btn-primary btn-lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Time Tracking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Project Selector Modal */}
          {showProjectSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Project and Task
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="input"
                        aria-label="Select project"
                        title="Select project"
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProject && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Task
                        </label>
                        <select
                          value={selectedTask}
                          onChange={(e) => setSelectedTask(e.target.value)}
                          className="input"
                          disabled={isLoading}
                          aria-label="Select task"
                          title="Select task"
                        >
                          <option value="">Select a task</option>
                          {tasks.map((task) => (
                            <option key={task._id} value={task._id}>
                              {task.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input min-h-[80px]"
                        placeholder="What are you working on?"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowProjectSelector(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartTracking}
                      disabled={!selectedProject || !selectedTask || isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Starting...' : 'Start Tracking'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-description">
                Your recent time tracking sessions
              </p>
            </div>
            <div className="card-content">
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start tracking time to see your activity here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainApp
