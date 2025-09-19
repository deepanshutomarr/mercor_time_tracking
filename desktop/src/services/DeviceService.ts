import os from 'os'
import { networkInterfaces } from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface DeviceInfo {
  ipAddress: string
  macAddress: string
  userAgent: string
  platform: string
  os: string
  osVersion: string
  browser?: string
  browserVersion?: string
  screenResolution: string
  timezone: string
  language: string
  cpu: string
  memory: string
  uptime: number
}

export class DeviceService {
  private deviceInfo: DeviceInfo | null = null
  private isInitialized = false

  constructor() {}

  async initialize() {
    if (this.isInitialized) {
      console.log('Device Service already initialized, skipping');
      return;
    }

    try {
      this.deviceInfo = await this.getDeviceInfo();
      this.isInitialized = true;
      console.log('Device Service initialized');
    } catch (error) {
      console.error('Failed to initialize Device Service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    try {
      const [macAddress, screenResolution] = await Promise.all([
        this.getMacAddress(),
        this.getScreenResolution()
      ])

      const deviceInfo: DeviceInfo = {
        ipAddress: this.getLocalIPAddress(),
        macAddress,
        userAgent: 'Mercor Time Tracking Desktop App',
        platform: os.platform(),
        os: os.type(),
        osVersion: os.release(),
        screenResolution,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: Intl.DateTimeFormat().resolvedOptions().locale,
        cpu: os.cpus()[0]?.model || 'Unknown',
        memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        uptime: os.uptime()
      }

      this.deviceInfo = deviceInfo
      return deviceInfo
    } catch (error) {
      console.error('Failed to get device info:', error)
      return this.getDefaultDeviceInfo()
    }
  }

  private async getMacAddress(): Promise<string> {
    try {
      const platform = os.platform()
      
      if (platform === 'win32') {
        // Windows
        const { stdout } = await execAsync('getmac /v /fo csv | findstr "Physical"')
        const lines = stdout.split('\n')
        for (const line of lines) {
          if (line.includes('Physical')) {
            const match = line.match(/"([^"]+)"/)
            if (match && match[1]) {
              return match[1].replace(/-/g, ':')
            }
          }
        }
      } else if (platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('ifconfig en0 | grep ether')
        const match = stdout.match(/ether\s+([a-fA-F0-9:]{17})/)
        if (match && match[1]) {
          return match[1]
        }
      } else {
        // Linux
        const { stdout } = await execAsync('cat /sys/class/net/eth0/address')
        if (stdout.trim()) {
          return stdout.trim()
        }
      }

      // Fallback: get first available MAC address
      const interfaces = networkInterfaces()
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName]
        if (networkInterface) {
          for (const network of networkInterface) {
            if (network.mac && network.mac !== '00:00:00:00:00:00') {
              return network.mac
            }
          }
        }
      }

      return 'unknown'
    } catch (error) {
      console.warn('Failed to get MAC address:', error)
      return 'unknown'
    }
  }

  private getLocalIPAddress(): string {
    try {
      const interfaces = networkInterfaces()
      
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName]
        if (networkInterface) {
          for (const network of networkInterface) {
            if (network.family === 'IPv4' && !network.internal) {
              return network.address
            }
          }
        }
      }

      return '127.0.0.1'
    } catch (error) {
      console.warn('Failed to get IP address:', error)
      return '127.0.0.1'
    }
  }

  private async getScreenResolution(): Promise<string> {
    try {
      const platform = os.platform()
      
      if (platform === 'win32') {
        // Windows
        const { stdout } = await execAsync('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution /format:value')
        const lines = stdout.split('\n')
        let width = ''
        let height = ''
        
        for (const line of lines) {
          if (line.includes('CurrentHorizontalResolution=')) {
            width = line.split('=')[1].trim()
          } else if (line.includes('CurrentVerticalResolution=')) {
            height = line.split('=')[1].trim()
          }
        }
        
        if (width && height) {
          return `${width}x${height}`
        }
      } else if (platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('system_profiler SPDisplaysDataType | grep Resolution')
        const match = stdout.match(/(\d+) x (\d+)/)
        if (match && match[1] && match[2]) {
          return `${match[1]}x${match[2]}`
        }
      } else {
        // Linux
        const { stdout } = await execAsync('xrandr | grep "\\*" | head -1')
        const match = stdout.match(/(\d+)x(\d+)/)
        if (match && match[1] && match[2]) {
          return `${match[1]}x${match[2]}`
        }
      }

      return '1920x1080' // Default fallback
    } catch (error) {
      console.warn('Failed to get screen resolution:', error)
      return '1920x1080'
    }
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      ipAddress: '127.0.0.1',
      macAddress: 'unknown',
      userAgent: 'Mercor Time Tracking Desktop App',
      platform: os.platform(),
      os: os.type(),
      osVersion: os.release(),
      screenResolution: '1920x1080',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: Intl.DateTimeFormat().resolvedOptions().locale,
      cpu: 'Unknown',
      memory: 'Unknown',
      uptime: 0
    }
  }

  async validateDevice(): Promise<boolean> {
    try {
      const deviceInfo = await this.getDeviceInfo()
      
      // Basic validation
      if (!deviceInfo.ipAddress || deviceInfo.ipAddress === 'unknown') {
        return false
      }

      if (!deviceInfo.macAddress || deviceInfo.macAddress === 'unknown') {
        return false
      }

      if (!deviceInfo.platform || !deviceInfo.os) {
        return false
      }

      // Check if IP is valid
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (!ipRegex.test(deviceInfo.ipAddress)) {
        return false
      }

      // Check if MAC address is valid
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
      if (!macRegex.test(deviceInfo.macAddress)) {
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to validate device:', error)
      return false
    }
  }
}
