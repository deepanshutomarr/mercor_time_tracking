import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import screenshot from 'screenshot-desktop';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../config/logger';
import Screenshot from '../models/Screenshot';
import { DeviceInfo } from '../types';

class ScreenshotService {
  private uploadPath: string;

  constructor() {
    this.uploadPath = config.screenshot.uploadPath;
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'thumbnails'), { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directories:', error);
    }
  }

  async captureScreenshot(
    employeeId: string,
    timeEntryId: string,
    projectId: string,
    taskId: string,
    deviceInfo: DeviceInfo
  ): Promise<string | null> {
    try {
      // Check if screenshot capture is enabled for the project
      // This would typically be checked against project settings
      // For now, we'll assume it's enabled

      const screenshotId = uuidv4();
      const timestamp = Date.now();
      const fileName = `screenshot_${screenshotId}_${timestamp}.png`;
      const filePath = path.join(this.uploadPath, 'screenshots', fileName);
      const thumbnailPath = path.join(this.uploadPath, 'thumbnails', `thumb_${fileName}`);

      // Capture screenshot
      const img = await screenshot({ format: 'png' });
      
      // Process and save screenshot
      const processedImg = await this.processScreenshot(img);
      await fs.writeFile(filePath, processedImg);

      // Create thumbnail
      await this.createThumbnail(filePath, thumbnailPath);

      // Get file stats
      const stats = await fs.stat(filePath);
      const imageInfo = await sharp(processedImg).metadata();

      // Save screenshot record to database
      const screenshotRecord = new Screenshot({
        employeeId,
        timeEntryId,
        projectId,
        taskId,
        filePath,
        fileName,
        fileSize: stats.size,
        mimeType: 'image/png',
        width: imageInfo.width || 0,
        height: imageInfo.height || 0,
        hasPermission: true, // We'll implement permission checking later
        takenAt: new Date()
      });

      await screenshotRecord.save();

      logger.info('Screenshot captured successfully', {
        screenshotId: screenshotRecord._id,
        employeeId,
        timeEntryId,
        fileName
      });

      return screenshotRecord._id.toString();
    } catch (error) {
      logger.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  private async processScreenshot(img: Buffer): Promise<Buffer> {
    try {
      const [maxWidth, maxHeight] = config.screenshot.maxSize.split('x').map(Number);
      
      return await sharp(img)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: config.screenshot.quality,
          compressionLevel: 9
        })
        .toBuffer();
    } catch (error) {
      logger.error('Failed to process screenshot:', error);
      return img; // Return original if processing fails
    }
  }

  private async createThumbnail(sourcePath: string, thumbnailPath: string): Promise<void> {
    try {
      await sharp(sourcePath)
        .resize(300, 200, {
          fit: 'cover',
          position: 'top'
        })
        .jpeg({
          quality: 80
        })
        .toFile(thumbnailPath);
    } catch (error) {
      logger.error('Failed to create thumbnail:', error);
    }
  }

  async getScreenshot(screenshotId: string): Promise<Buffer | null> {
    try {
      const screenshot = await Screenshot.findById(screenshotId);
      if (!screenshot) {
        return null;
      }

      const filePath = screenshot.filePath;
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (!exists) {
        logger.warn('Screenshot file not found:', { screenshotId, filePath });
        return null;
      }

      return await fs.readFile(filePath);
    } catch (error) {
      logger.error('Failed to get screenshot:', error);
      return null;
    }
  }

  async getThumbnail(screenshotId: string): Promise<Buffer | null> {
    try {
      const screenshot = await Screenshot.findById(screenshotId);
      if (!screenshot) {
        return null;
      }

      const thumbnailPath = screenshot.filePath.replace('screenshots', 'thumbnails').replace(screenshot.fileName, `thumb_${screenshot.fileName}`);
      const exists = await fs.access(thumbnailPath).then(() => true).catch(() => false);
      
      if (!exists) {
        // Create thumbnail if it doesn't exist
        await this.createThumbnail(screenshot.filePath, thumbnailPath);
      }

      return await fs.readFile(thumbnailPath);
    } catch (error) {
      logger.error('Failed to get thumbnail:', error);
      return null;
    }
  }

  async deleteScreenshot(screenshotId: string): Promise<boolean> {
    try {
      const screenshot = await Screenshot.findById(screenshotId);
      if (!screenshot) {
        return false;
      }

      // Delete files
      const filePath = screenshot.filePath;
      const thumbnailPath = filePath.replace('screenshots', 'thumbnails').replace(screenshot.fileName, `thumb_${screenshot.fileName}`);
      
      await Promise.all([
        fs.unlink(filePath).catch(() => {}), // Ignore if file doesn't exist
        fs.unlink(thumbnailPath).catch(() => {}) // Ignore if file doesn't exist
      ]);

      // Delete database record
      await Screenshot.findByIdAndDelete(screenshotId);

      logger.info('Screenshot deleted successfully', { screenshotId });
      return true;
    } catch (error) {
      logger.error('Failed to delete screenshot:', error);
      return false;
    }
  }

  async getScreenshotsByTimeRange(
    startDate: Date,
    endDate: Date,
    filters: {
      employeeId?: string;
      projectId?: string;
      taskId?: string;
      timeEntryId?: string;
    } = {}
  ): Promise<any[]> {
    try {
      const query: any = {
        takenAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (filters.employeeId) query.employeeId = filters.employeeId;
      if (filters.projectId) query.projectId = filters.projectId;
      if (filters.taskId) query.taskId = filters.taskId;
      if (filters.timeEntryId) query.timeEntryId = filters.timeEntryId;

      const screenshots = await Screenshot.find(query)
        .sort({ takenAt: -1 })
        .populate('employeeId', 'name email')
        .populate('projectId', 'name')
        .populate('taskId', 'name')
        .lean();

      return screenshots;
    } catch (error) {
      logger.error('Failed to get screenshots by time range:', error);
      return [];
    }
  }

  async getScreenshotStats(
    startDate: Date,
    endDate: Date,
    employeeId?: string
  ): Promise<{
    totalScreenshots: number;
    totalSize: number;
    averageSize: number;
    screenshotsWithPermission: number;
    screenshotsWithoutPermission: number;
  }> {
    try {
      const query: any = {
        takenAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (employeeId) query.employeeId = employeeId;

      const stats = await Screenshot.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalScreenshots: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            screenshotsWithPermission: {
              $sum: { $cond: ['$hasPermission', 1, 0] }
            },
            screenshotsWithoutPermission: {
              $sum: { $cond: ['$hasPermission', 0, 1] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalScreenshots: 0,
        totalSize: 0,
        screenshotsWithPermission: 0,
        screenshotsWithoutPermission: 0
      };

      return {
        ...result,
        averageSize: result.totalScreenshots > 0 ? result.totalSize / result.totalScreenshots : 0
      };
    } catch (error) {
      logger.error('Failed to get screenshot stats:', error);
      return {
        totalScreenshots: 0,
        totalSize: 0,
        averageSize: 0,
        screenshotsWithPermission: 0,
        screenshotsWithoutPermission: 0
      };
    }
  }

  async cleanupOldScreenshots(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const oldScreenshots = await Screenshot.find({
        takenAt: { $lt: cutoffDate }
      });

      let deletedCount = 0;
      for (const screenshot of oldScreenshots) {
        const deleted = await this.deleteScreenshot(screenshot._id.toString());
        if (deleted) deletedCount++;
      }

      logger.info(`Cleaned up ${deletedCount} old screenshots older than ${daysOld} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old screenshots:', error);
      return 0;
    }
  }
}

export default new ScreenshotService();
