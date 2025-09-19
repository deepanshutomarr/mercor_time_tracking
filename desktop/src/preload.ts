import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth methods
  login: (credentials: { email: string; password: string }) => 
    ipcRenderer.invoke('auth:login', credentials),
  
  logout: () => 
    ipcRenderer.invoke('auth:logout'),
  
  getUser: () => 
    ipcRenderer.invoke('auth:getUser'),

  // Time tracking methods
  startTimeTracking: (data: { projectId: string; taskId: string; description?: string }) => 
    ipcRenderer.invoke('time-tracking:start', data),
  
  stopTimeTracking: (timeEntryId: string) => 
    ipcRenderer.invoke('time-tracking:stop', timeEntryId),
  
  getActiveTimeEntry: () => 
    ipcRenderer.invoke('time-tracking:getActive'),
  
  getTimeTrackingHistory: (params: any) => 
    ipcRenderer.invoke('time-tracking:getHistory', params),

  // Project methods
  getProjects: () => 
    ipcRenderer.invoke('projects:getList'),
  
  getProjectTasks: (projectId: string) => 
    ipcRenderer.invoke('projects:getTasks', projectId),

  // Screenshot methods
  captureScreenshot: () => 
    ipcRenderer.invoke('screenshots:capture'),
  
  getScreenshots: (params: any) => 
    ipcRenderer.invoke('screenshots:getList', params),

  // Device methods
  getDeviceInfo: () => 
    ipcRenderer.invoke('device:getInfo'),

  // Settings methods
  getSetting: (key: string) => 
    ipcRenderer.invoke('settings:get', key),
  
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('settings:set', key, value),

  // Window methods
  minimizeWindow: () => 
    ipcRenderer.invoke('window:minimize'),
  
  maximizeWindow: () => 
    ipcRenderer.invoke('window:maximize'),
  
  closeWindow: () => 
    ipcRenderer.invoke('window:close'),
  
  hideWindow: () => 
    ipcRenderer.invoke('window:hide'),

  // Event listeners
  onTimeTrackingUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('time-tracking:update', (_, data) => callback(data))
  },

  onScreenshotCaptured: (callback: (data: any) => void) => {
    ipcRenderer.on('screenshot:captured', (_, data) => callback(data))
  },

  onAuthStateChange: (callback: (data: any) => void) => {
    ipcRenderer.on('auth:state-change', (_, data) => callback(data))
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Auth methods
      login: (credentials: { email: string; password: string }) => Promise<any>
      logout: () => Promise<void>
      getUser: () => Promise<any>

      // Time tracking methods
      startTimeTracking: (data: { projectId: string; taskId: string; description?: string }) => Promise<any>
      stopTimeTracking: (timeEntryId: string) => Promise<any>
      getActiveTimeEntry: () => Promise<any>
      getTimeTrackingHistory: (params: any) => Promise<any>

      // Project methods
      getProjects: () => Promise<any>
      getProjectTasks: (projectId: string) => Promise<any>

      // Screenshot methods
      captureScreenshot: () => Promise<any>
      getScreenshots: (params: any) => Promise<any>

      // Device methods
      getDeviceInfo: () => Promise<any>

      // Settings methods
      getSetting: (key: string) => Promise<any>
      setSetting: (key: string, value: any) => Promise<void>

      // Window methods
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      hideWindow: () => Promise<void>

      // Event listeners
      onTimeTrackingUpdate: (callback: (data: any) => void) => void
      onScreenshotCaptured: (callback: (data: any) => void) => void
      onAuthStateChange: (callback: (data: any) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
