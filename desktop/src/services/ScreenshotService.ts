import screenshot from 'screenshot-desktop'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { isDev, getUserDataPath } from '../utils/environment'

interface ScreenshotData {
  file: Buffer
  path: string
  width: number
  height: number
  timestamp: number
}

export class ScreenshotService {
  private screenshotsDir: string
  private isInitialized = false

  constructor() {
    this.screenshotsDir = join(getUserDataPath(), 'screenshots')
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('Screenshot Service already initialized, skipping');
      return;
    }

    try {
      // Create screenshots directory
      await mkdir(this.screenshotsDir, { recursive: true });
      this.isInitialized = true;
      console.log('Screenshot Service initialized');
    } catch (error) {
      console.error('Failed to initialize Screenshot Service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async captureScreenshot(): Promise<ScreenshotData | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Screenshot Service not initialized')
      }

      // Capture screenshot
      const img = await screenshot({ format: 'png' })
      
      // Process image
      const processedImg = await this.processScreenshot(img)
      
      // Get image metadata
      const metadata = await sharp(processedImg).metadata()
      
      // Generate filename
      const timestamp = Date.now()
      const filename = `screenshot_${timestamp}.png`
      const filepath = join(this.screenshotsDir, filename)
      
      // Save screenshot
      await writeFile(filepath, processedImg)
      
      const screenshotData: ScreenshotData = {
        file: processedImg,
        path: filepath,
        width: metadata.width || 0,
        height: metadata.height || 0,
        timestamp
      }

      console.log('Screenshot captured:', filename)
      return screenshotData
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return null
    }
  }

  private async processScreenshot(img: Buffer): Promise<Buffer> {
    try {
      // Resize and optimize screenshot
      return await sharp(img)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 80,
          compressionLevel: 9
        })
        .toBuffer()
    } catch (error) {
      console.error('Failed to process screenshot:', error)
      return img // Return original if processing fails
    }
  }

  async createThumbnail(screenshotPath: string): Promise<Buffer | null> {
    try {
      const thumbnail = await sharp(screenshotPath)
        .resize(300, 200, {
          fit: 'cover',
          position: 'top'
        })
        .jpeg({
          quality: 80
        })
        .toBuffer()
      
      return thumbnail
    } catch (error) {
      console.error('Failed to create thumbnail:', error)
      return null
    }
  }

  async getScreenshotList(): Promise<string[]> {
    try {
      const { readdir } = await import('fs/promises')
      const files = await readdir(this.screenshotsDir)
      return files.filter(file => file.endsWith('.png'))
    } catch (error) {
      console.error('Failed to get screenshot list:', error)
      return []
    }
  }

  async deleteScreenshot(filename: string): Promise<boolean> {
    try {
      const { unlink } = await import('fs/promises')
      const filepath = join(this.screenshotsDir, filename)
      await unlink(filepath)
      console.log('Screenshot deleted:', filename)
      return true
    } catch (error) {
      console.error('Failed to delete screenshot:', error)
      return false
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up old screenshots (older than 30 days)
      const { readdir, stat, unlink } = await import('fs/promises')
      const files = await readdir(this.screenshotsDir)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filepath = join(this.screenshotsDir, file)
          const stats = await stat(filepath)
          
          if (stats.mtime.getTime() < thirtyDaysAgo) {
            await unlink(filepath)
            console.log('Cleaned up old screenshot:', file)
          }
        }
      }
      
      console.log('Screenshot Service cleaned up')
    } catch (error) {
      console.error('Failed to cleanup Screenshot Service:', error)
    }
  }
}
