import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage } from 'electron'
import { join } from 'path'
import { isDev } from './utils/environment'
import { TimeTrackingService } from './services/TimeTrackingService'
import { ScreenshotService } from './services/ScreenshotService'
import { DeviceService } from './services/DeviceService'
import { ApiService } from './services/ApiService'
import { StoreService } from './services/StoreService'

class Application {
  private mainWindow: BrowserWindow | null = null
  private tray: Tray | null = null
  private timeTrackingService: TimeTrackingService | null = null
  private screenshotService: ScreenshotService | null = null
  private deviceService: DeviceService | null = null
  private apiService: ApiService | null = null
  private storeService: StoreService | null = null

  constructor() {
    // Do not create services here. They rely on Electron app paths and should be
    // created after the app is ready to avoid duplicate initialization and
    // permission/cache issues on Windows.
  }

  async initialize() {
    try {
      // Defer creation and initialization of services until app is ready
      // to ensure Electron paths are available and services initialize only once.
      console.log('Application bootstrap complete; waiting for app ready')
    } catch (error) {
      console.error('Failed to initialize application:', error)
      throw error
    }

    // Handle app events
    app.whenReady().then(() => this.onReady())
    app.on('window-all-closed', () => this.onWindowAllClosed())
    app.on('activate', () => this.onActivate())
    app.on('before-quit', () => this.onBeforeQuit())

    // Setup IPC handlers
    this.setupIpcHandlers()
  }

  private async onReady() {
    // Set a safe userData path before creating electron-store to avoid cache access issues on Windows
    try {
      const userDataPath = join(app.getPath('appData'), 'mercor-time-tracking')
      app.setPath('userData', userDataPath)
    } catch (e) {
      console.warn('Failed to set userData path, proceeding with default:', e)
    }

    // Create services now that app paths are available
    this.createServices()

    // Log store initialization (now that store exists)
    if (this.storeService) {
      await this.storeService.logStoreInitialization()
      console.log('Store service initialized')
    }

    // Create main window
    await this.createMainWindow()

    // Create system tray
    this.createTray()

    // Initialize services (they have been created)
    await this.initializeServices()

    // Setup auto-launcher
    this.setupAutoLauncher()
  }

  private createServices() {
    if (this.storeService) {
      // already created
      return
    }
    this.storeService = new StoreService()
    this.apiService = new ApiService(this.storeService)
    this.deviceService = new DeviceService()
    this.screenshotService = new ScreenshotService()
    this.timeTrackingService = new TimeTrackingService(
      this.apiService,
      this.screenshotService,
      this.deviceService,
      this.storeService
    )
  }

  private async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // Remote Module is enabled by default in Electron >= 14
        preload: join(__dirname, 'preload.js')
      }
    })

    // Load the app
    if (isDev) {
      const rendererUrl = 'http://localhost:3002'

      // Wait for the renderer port to become available before attempting to load the URL.
      const waitForPort = (host: string, port: number, timeoutMs = 10000, intervalMs = 500) => {
        return new Promise<boolean>((resolve) => {
          const net = require('net')
          const start = Date.now()

          const tryConnect = () => {
            const socket = new net.Socket()
            socket.setTimeout(2000)
            socket.once('error', () => {
              socket.destroy()
              if (Date.now() - start >= timeoutMs) return resolve(false)
              setTimeout(tryConnect, intervalMs)
            })
            socket.once('timeout', () => {
              socket.destroy()
              if (Date.now() - start >= timeoutMs) return resolve(false)
              setTimeout(tryConnect, intervalMs)
            })
            socket.connect(port, host, () => {
              socket.end()
              resolve(true)
            })
          }

          tryConnect()
        })
      }

      const rendererReady = await waitForPort('127.0.0.1', 3002, 8000, 500)
      if (rendererReady) {
        try {
          await this.mainWindow.loadURL(rendererUrl)
          this.mainWindow.webContents.openDevTools()
        } catch (err) {
          console.error('Error loading renderer URL even though port reported open', err)
        }
      } else {
        // If renderer cannot be reached in time, load a local fallback (packaged renderer)
        try {
          const fallbackPath = join(__dirname, 'renderer/index.html')
          console.warn('Renderer dev server unreachable after wait, loading fallback:', fallbackPath)
          await this.mainWindow.loadFile(fallbackPath)
        } catch (fallbackErr) {
          console.error('Fallback renderer load failed', fallbackErr)
          dialog.showMessageBox({
            type: 'error',
            title: 'Renderer Unavailable',
            message: 'The renderer dev server (http://localhost:3002) is not available.',
            detail: 'Start the renderer with `npm run dev:renderer` (or run `npm run dev` from the desktop folder), then restart the app.',
            buttons: ['OK']
          })
        }
      }
    } else {
      await this.mainWindow.loadFile(join(__dirname, 'renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // Graceful handling when navigation fails
    this.mainWindow.webContents.on('did-fail-load', async (_event, errorCode, errorDescription, validatedURL) => {
      console.warn('did-fail-load:', { errorCode, errorDescription, validatedURL })
      // If it's the dev URL, try a few reloads
      if (isDev && validatedURL && validatedURL.startsWith('http://localhost')) {
        // attempt reloads
        let attempts = 0
        while (attempts < 5 && !this.mainWindow?.webContents || this.mainWindow?.webContents.isDestroyed()) {
          attempts++
          await new Promise((r) => setTimeout(r, 1000))
          try {
            this.mainWindow?.webContents.reload()
          } catch (e) {
            // ignore
          }
        }
      }
    })
  }

  private createTray() {
    const iconPath = isDev 
      ? join(__dirname, '../../assets/tray-icon.png')
      : join(__dirname, '../assets/tray-icon.png')
    
    this.tray = new Tray(nativeImage.createFromPath(iconPath))
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => this.showMainWindow()
      },
      {
        label: 'Start Tracking',
        click: () => this.startTimeTracking()
      },
      {
        label: 'Stop Tracking',
        click: () => this.stopTimeTracking()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ])
    
    this.tray.setContextMenu(contextMenu)
    this.tray.setToolTip('Mercor Time Tracking')
    
    // Double click to show window
    this.tray.on('double-click', () => this.showMainWindow())
  }

  private async initializeServices() {
    try {
      if (this.apiService) {
        await this.apiService.initialize()
      }
      if (this.deviceService) {
        await this.deviceService.initialize()
      }
      if (this.timeTrackingService) {
        await this.timeTrackingService.initialize()
      }
      if (this.screenshotService) {
        await this.screenshotService.initialize()
      }
    } catch (error) {
      console.error('Failed to initialize services:', error)
    }
  }

  private setupAutoLauncher() {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true
    })
  }

  private setupIpcHandlers() {
    // Auth handlers
    ipcMain.handle('auth:login', async (_, credentials) => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      return await this.apiService.login(credentials)
    })

    ipcMain.handle('auth:logout', async () => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      return await this.apiService.logout()
    })

    ipcMain.handle('auth:getUser', async () => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.apiService.getCurrentUser()
    })

    // Time tracking handlers
    ipcMain.handle('time-tracking:start', async (_, data) => {
      if (!this.apiService || !this.timeTrackingService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.timeTrackingService.startTracking(data)
    })

    ipcMain.handle('time-tracking:stop', async (_, timeEntryId) => {
      if (!this.apiService || !this.timeTrackingService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.timeTrackingService.stopTracking(timeEntryId)
    })

    ipcMain.handle('time-tracking:getActive', async () => {
      if (!this.apiService || !this.timeTrackingService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.timeTrackingService.getActiveEntry()
    })

    ipcMain.handle('time-tracking:getHistory', async (_, params) => {
      if (!this.apiService || !this.timeTrackingService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.timeTrackingService.getHistory(params)
    })

    // Project handlers
    ipcMain.handle('projects:getList', async () => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.apiService.getProjects()
    })

    ipcMain.handle('projects:getTasks', async (_, projectId) => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      if (!this.apiService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' }
      }
      return await this.apiService.getProjectTasks(projectId)
    })

    // Screenshot handlers
    ipcMain.handle('screenshots:capture', async () => {
      if (!this.screenshotService) return { success: false, error: 'Service unavailable' }
      return await this.screenshotService.captureScreenshot()
    })

    ipcMain.handle('screenshots:getList', async (_, params) => {
      if (!this.apiService) return { success: false, error: 'Service unavailable' }
      return await this.apiService.getScreenshots(params)
    })

    // Device handlers
    ipcMain.handle('device:getInfo', async () => {
      if (!this.deviceService) return { success: false, error: 'Service unavailable' }
      return await this.deviceService.getDeviceInfo()
    })

    // Settings handlers
    ipcMain.handle('settings:get', async (_, key) => {
      if (!this.storeService) return null
      return this.storeService.get(key)
    })

    ipcMain.handle('settings:set', async (_, key, value) => {
      if (!this.storeService) return null
      return this.storeService.set(key, value)
    })

    // Window handlers
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize()
    })

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize()
      } else {
        this.mainWindow?.maximize()
      }
    })

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close()
    })

    ipcMain.handle('window:hide', () => {
      this.mainWindow?.hide()
    })
  }

  private showMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.show()
      this.mainWindow.focus()
    }
  }

  private async startTimeTracking() {
    // Implementation for starting time tracking from tray
    console.log('Starting time tracking from tray')
  }

  private async stopTimeTracking() {
    // Implementation for stopping time tracking from tray
    console.log('Stopping time tracking from tray')
  }

  private getAppIcon() {
    const iconPath = isDev 
      ? join(__dirname, '../../assets/icon.png')
      : join(__dirname, '../assets/icon.png')
    return nativeImage.createFromPath(iconPath)
  }

  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }

  private onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow()
    }
  }

  private async onBeforeQuit() {
    // Cleanup before quitting
    if (this.timeTrackingService) await this.timeTrackingService.cleanup()
    if (this.screenshotService) await this.screenshotService.cleanup()
  }
}

// Initialize the application
const application = new Application()
application.initialize()

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
