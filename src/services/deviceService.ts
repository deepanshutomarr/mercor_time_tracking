import os from 'os';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DeviceInfo } from '../types';
import { logger } from '../config/logger';

const execAsync = promisify(exec);

class DeviceService {
  async getDeviceInfo(userAgent?: string): Promise<DeviceInfo> {
    try {
      const [macAddress, screenResolution] = await Promise.all([
        this.getMacAddress(),
        this.getScreenResolution()
      ]);

      const deviceInfo: DeviceInfo = {
        ipAddress: this.getLocalIPAddress(),
        macAddress,
        userAgent: userAgent || 'Unknown',
        platform: os.platform(),
        os: os.type(),
        osVersion: os.release(),
        browser: this.getBrowserInfo(userAgent),
        browserVersion: this.getBrowserVersion(userAgent),
        screenResolution,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: Intl.DateTimeFormat().resolvedOptions().locale
      };

      return deviceInfo;
    } catch (error) {
      logger.error('Failed to get device info:', error);
      return this.getDefaultDeviceInfo(userAgent);
    }
  }

  private async getMacAddress(): Promise<string> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows
        const { stdout } = await execAsync('getmac /v /fo csv | findstr "Physical"');
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('Physical')) {
            const match = line.match(/"([^"]+)"/);
            if (match && match[1]) {
              return match[1].replace(/-/g, ':');
            }
          }
        }
      } else if (platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('ifconfig en0 | grep ether');
        const match = stdout.match(/ether\s+([a-fA-F0-9:]{17})/);
        if (match && match[1]) {
          return match[1];
        }
      } else {
        // Linux
        const { stdout } = await execAsync('cat /sys/class/net/eth0/address');
        if (stdout.trim()) {
          return stdout.trim();
        }
      }

      // Fallback: get first available MAC address
      const interfaces = networkInterfaces();
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        if (networkInterface) {
          for (const network of networkInterface) {
            if (network.mac && network.mac !== '00:00:00:00:00:00') {
              return network.mac;
            }
          }
        }
      }

      return 'unknown';
    } catch (error) {
      logger.warn('Failed to get MAC address:', error);
      return 'unknown';
    }
  }

  private getLocalIPAddress(): string {
    try {
      const interfaces = networkInterfaces();
      
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        if (networkInterface) {
          for (const network of networkInterface) {
            if (network.family === 'IPv4' && !network.internal) {
              return network.address;
            }
          }
        }
      }

      return '127.0.0.1';
    } catch (error) {
      logger.warn('Failed to get IP address:', error);
      return '127.0.0.1';
    }
  }

  private async getScreenResolution(): Promise<string> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows
        const { stdout } = await execAsync('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution /format:value');
        const lines = stdout.split('\n');
        let width = '';
        let height = '';
        
        for (const line of lines) {
          if (line.includes('CurrentHorizontalResolution=')) {
            width = line.split('=')[1].trim();
          } else if (line.includes('CurrentVerticalResolution=')) {
            height = line.split('=')[1].trim();
          }
        }
        
        if (width && height) {
          return `${width}x${height}`;
        }
      } else if (platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('system_profiler SPDisplaysDataType | grep Resolution');
        const match = stdout.match(/(\d+) x (\d+)/);
        if (match && match[1] && match[2]) {
          return `${match[1]}x${match[2]}`;
        }
      } else {
        // Linux
        const { stdout } = await execAsync('xrandr | grep "\\*" | head -1');
        const match = stdout.match(/(\d+)x(\d+)/);
        if (match && match[1] && match[2]) {
          return `${match[1]}x${match[2]}`;
        }
      }

      return '1920x1080'; // Default fallback
    } catch (error) {
      logger.warn('Failed to get screen resolution:', error);
      return '1920x1080';
    }
  }

  private getBrowserInfo(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    if (ua.includes('ie') || ua.includes('trident')) return 'Internet Explorer';
    
    return 'Unknown';
  }

  private getBrowserVersion(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    const ua = userAgent.toLowerCase();
    
    // Chrome version
    const chromeMatch = ua.match(/chrome\/(\d+\.\d+)/);
    if (chromeMatch) return chromeMatch[1];
    
    // Firefox version
    const firefoxMatch = ua.match(/firefox\/(\d+\.\d+)/);
    if (firefoxMatch) return firefoxMatch[1];
    
    // Safari version
    const safariMatch = ua.match(/version\/(\d+\.\d+).*safari/);
    if (safariMatch) return safariMatch[1];
    
    // Edge version
    const edgeMatch = ua.match(/edg\/(\d+\.\d+)/);
    if (edgeMatch) return edgeMatch[1];
    
    return undefined;
  }

  private getDefaultDeviceInfo(userAgent?: string): DeviceInfo {
    return {
      ipAddress: '127.0.0.1',
      macAddress: 'unknown',
      userAgent: userAgent || 'Unknown',
      platform: os.platform(),
      os: os.type(),
      osVersion: os.release(),
      browser: this.getBrowserInfo(userAgent),
      browserVersion: this.getBrowserVersion(userAgent),
      screenResolution: '1920x1080',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: Intl.DateTimeFormat().resolvedOptions().locale
    };
  }

  async validateDevice(deviceInfo: DeviceInfo): Promise<boolean> {
    try {
      // Basic validation
      if (!deviceInfo.ipAddress || deviceInfo.ipAddress === 'unknown') {
        return false;
      }

      if (!deviceInfo.macAddress || deviceInfo.macAddress === 'unknown') {
        return false;
      }

      if (!deviceInfo.platform || !deviceInfo.os) {
        return false;
      }

      // Check if IP is valid
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(deviceInfo.ipAddress)) {
        return false;
      }

      // Check if MAC address is valid
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (!macRegex.test(deviceInfo.macAddress)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate device:', error);
      return false;
    }
  }

  async getSystemInfo(): Promise<{
    cpu: string;
    memory: string;
    uptime: number;
    loadAverage: number[];
  }> {
    try {
      return {
        cpu: os.cpus()[0]?.model || 'Unknown',
        memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        uptime: os.uptime(),
        loadAverage: os.loadavg()
      };
    } catch (error) {
      logger.error('Failed to get system info:', error);
      return {
        cpu: 'Unknown',
        memory: 'Unknown',
        uptime: 0,
        loadAverage: [0, 0, 0]
      };
    }
  }
}

export default new DeviceService();
