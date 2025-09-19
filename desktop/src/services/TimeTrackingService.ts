import { ApiService } from './ApiService'
import { ScreenshotService } from './ScreenshotService'
import { DeviceService } from './DeviceService'
import { StoreService } from './StoreService'

interface TimeEntry {
  _id: string
  projectId: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number
  isActive: boolean
  description?: string
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

export class TimeTrackingService {
  private apiService: ApiService
  private screenshotService: ScreenshotService
  private deviceService: DeviceService
  private storeService: StoreService
  private activeEntry: TimeEntry | null = null
  private screenshotInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor(
    apiService?: ApiService,
    screenshotService?: ScreenshotService,
    deviceService?: DeviceService,
    storeService?: StoreService
  ) {
    this.storeService = storeService || new StoreService()
    this.apiService = apiService || new ApiService(this.storeService)
    this.screenshotService = screenshotService || new ScreenshotService()
    this.deviceService = deviceService || new DeviceService()
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('Time Tracking Service already initialized, skipping');
      return;
    }

    try {
      // Only initialize if we have an auth token
      if (this.apiService.getStoredToken()) {
        // Load active entry from storage
        this.activeEntry = await this.storeService.get('activeTimeEntry')
        
        // If there's an active entry, resume screenshot capture
        if (this.activeEntry && this.activeEntry.isActive) {
          await this.startScreenshotCapture()
        }
      }

      this.isInitialized = true
      console.log('Time Tracking Service initialized')
    } catch (error) {
      console.error('Failed to initialize Time Tracking Service:', error)
      this.isInitialized = false
      throw error
    }
  }

  async startTracking(data: { projectId: string; taskId: string; description?: string }) {
    try {
      if (this.activeEntry) {
        throw new Error('Time tracking is already active')
      }

      // Get device info
      const deviceInfo = await this.deviceService.getDeviceInfo()

      // Start time tracking via API
      const response = await this.apiService.startTimeTracking(data)
      this.activeEntry = response.data

      // Store active entry
      await this.storeService.set('activeTimeEntry', this.activeEntry)

      // Start screenshot capture
      await this.startScreenshotCapture()

      // Emit update event
      this.emitTimeTrackingUpdate({
        type: 'started',
        entry: this.activeEntry
      })

      return { success: true, data: this.activeEntry }
    } catch (error: any) {
      console.error('Failed to start time tracking:', error)
      throw error
    }
  }

  async stopTracking(timeEntryId: string) {
    try {
      if (!this.activeEntry || this.activeEntry._id !== timeEntryId) {
        throw new Error('No active time entry found')
      }

      // Stop time tracking via API
      const response = await this.apiService.stopTimeTracking(timeEntryId)
      this.activeEntry = response.data

      // Stop screenshot capture
      await this.stopScreenshotCapture()

      // Clear stored active entry
      await this.storeService.delete('activeTimeEntry')

      // Emit update event
      this.emitTimeTrackingUpdate({
        type: 'stopped',
        entry: this.activeEntry
      })

      const stoppedEntry = this.activeEntry
      this.activeEntry = null

      return { success: true, data: stoppedEntry }
    } catch (error: any) {
      console.error('Failed to stop time tracking:', error)
      throw error
    }
  }

  async getActiveEntry() {
    try {
      if (this.activeEntry) {
        return { success: true, data: this.activeEntry }
      }

      // Check with API for active entry
      const response = await this.apiService.getActiveTimeEntry()
      this.activeEntry = response.data[0] || null

      return { success: true, data: this.activeEntry }
    } catch (error: any) {
      console.error('Failed to get active time entry:', error)
      throw error
    }
  }

  async getHistory(params: any) {
    try {
      const response = await this.apiService.getTimeTrackingHistory(params)
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Failed to get time tracking history:', error)
      throw error
    }
  }

  private async startScreenshotCapture() {
    if (this.screenshotInterval) {
      return // Already running
    }

    // Get screenshot interval from settings (default 5 minutes)
    const settings = this.storeService.get('settings');
    const interval = settings?.screenshotInterval ?? 300000;

    this.screenshotInterval = setInterval(async () => {
      try {
        if (this.activeEntry && this.activeEntry.isActive) {
          await this.captureScreenshot()
        }
      } catch (error) {
        console.error('Failed to capture screenshot:', error)
      }
    }, interval)

    console.log('Screenshot capture started')
  }

  private async stopScreenshotCapture() {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval)
      this.screenshotInterval = null
      console.log('Screenshot capture stopped')
    }
  }

  private async captureScreenshot() {
    try {
      if (!this.activeEntry) {
        return
      }

      const screenshot = await this.screenshotService.captureScreenshot()
      
      if (screenshot) {
        // Upload screenshot to API
        await this.apiService.uploadScreenshot({
          file: screenshot.file,
          timeEntryId: this.activeEntry._id,
          projectId: this.activeEntry.projectId,
          taskId: this.activeEntry.taskId
        })

        // Emit screenshot captured event
        this.emitScreenshotCaptured({
          screenshot,
          timeEntry: this.activeEntry
        })
      }
    } catch (error) {
      console.error('Failed to capture and upload screenshot:', error)
    }
  }

  private emitTimeTrackingUpdate(data: any) {
    // Emit event to renderer process
    // This would be implemented with IPC
    console.log('Time tracking update:', data)
  }

  private emitScreenshotCaptured(data: any) {
    // Emit event to renderer process
    // This would be implemented with IPC
    console.log('Screenshot captured:', data)
  }

  async cleanup() {
    try {
      await this.stopScreenshotCapture()
      console.log('Time Tracking Service cleaned up')
    } catch (error) {
      console.error('Failed to cleanup Time Tracking Service:', error)
    }
  }

  // Getters
  get isTracking(): boolean {
    return this.activeEntry?.isActive || false
  }

  get currentEntry(): TimeEntry | null {
    return this.activeEntry
  }

  get trackingDuration(): number {
    if (!this.activeEntry || !this.activeEntry.isActive) {
      return 0
    }
    return Date.now() - new Date(this.activeEntry.startTime).getTime()
  }
}
