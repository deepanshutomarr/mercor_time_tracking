import { Request, Response, NextFunction } from 'express';
import TimeEntry from '../models/TimeEntry';
import Project from '../models/Project';
import Task from '../models/Task';
import Employee from '../models/Employee';
import Screenshot from '../models/Screenshot';
import { logger } from '../config/logger';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import screenshotService from '../services/screenshotService';
import deviceService from '../services/deviceService';
import emailService from '../services/emailService';
import { StartTimeTrackingRequest, StopTimeTrackingRequest, ApiResponse, WindowAnalytics, ScreenshotResponse } from '../types';

// POST /api/v1/time-tracking/start - Start time tracking
export const startTimeTracking = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId, taskId, description }: StartTimeTrackingRequest = req.body;
  const employeeId = req.user?.userId;

  if (!employeeId) {
    return next(createError('Employee ID not found in token', 401));
  }

  // Check if employee has an active time entry
  const activeEntry = await TimeEntry.findOne({ employeeId, isActive: true });
  if (activeEntry) {
    return next(createError('Employee already has an active time entry', 400));
  }

  // Verify project exists and employee is assigned to it
  const project = await Project.findById(projectId);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  if (!project.employees.includes(employeeId)) {
    return next(createError('Employee not assigned to project', 403));
  }

  // Verify task exists and employee is assigned to it
  const task = await Task.findById(taskId);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  if (!task.employees.includes(employeeId)) {
    return next(createError('Employee not assigned to task', 403));
  }

  // Get device info
  const deviceInfo = await deviceService.getDeviceInfo(req.get('User-Agent'));

  // Create time entry
  const timeEntry = new TimeEntry({
    employeeId,
    projectId,
    taskId,
    startTime: new Date(),
    description,
    isActive: true,
    deviceInfo
  });

  await timeEntry.save();

  // Start screenshot capture if enabled
  if (project.screenshotSettings?.screenshotEnabled) {
    const interval = project.screenshotSettings.interval || 300000; // 5 minutes default
    const screenshotId = await screenshotService.captureScreenshot(
      employeeId,
      String(timeEntry._id),
      projectId,
      taskId,
      deviceInfo
    );

    if (screenshotId) {
      await timeEntry.addScreenshot(screenshotId);
    }
  }

  // Send notification email
  const employee = await Employee.findById(employeeId);
  if (employee) {
    await emailService.sendTimeTrackingNotification(
      employee.email,
      employee.name,
      'start',
      {
        projectName: project.name,
        taskName: task.name,
        startTime: timeEntry.startTime
      }
    );
  }

  const response: ApiResponse<typeof timeEntry> = {
    success: true,
    data: timeEntry,
    message: 'Time tracking started successfully'
  };

  res.status(201).json(response);
});

// POST /api/v1/time-tracking/stop - Stop time tracking
export const stopTimeTracking = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { timeEntryId, description }: StopTimeTrackingRequest = req.body;
  const employeeId = req.user?.userId;

  if (!employeeId) {
    return next(createError('Employee ID not found in token', 401));
  }

  // Find active time entry
  const timeEntry = await TimeEntry.findOne({ 
    _id: timeEntryId, 
    employeeId, 
    isActive: true 
  });

  if (!timeEntry) {
    return next(createError('Active time entry not found', 404));
  }

  // Stop time entry
  await timeEntry.stop();

  // Update description if provided
  if (description) {
    await timeEntry.updateDescription(description);
  }

  // Get project and task info for notification
  const project = await Project.findById(timeEntry.projectId);
  const task = await Task.findById(timeEntry.taskId);

  // Send notification email
  const employee = await Employee.findById(employeeId);
  if (employee) {
    await emailService.sendTimeTrackingNotification(
      employee.email,
      employee.name,
      'stop',
      {
        projectName: project?.name,
        taskName: task?.name,
        duration: timeEntry.formattedDuration,
        endTime: timeEntry.endTime
      }
    );
  }

  const response: ApiResponse<typeof timeEntry> = {
    success: true,
    data: timeEntry,
    message: 'Time tracking stopped successfully'
  };

  res.json(response);
});

// GET /api/v1/time-tracking/active - Get active time entries
export const getActiveTimeEntries = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const employeeId = req.user?.userId;

  if (!employeeId) {
    return next(createError('Employee ID not found in token', 401));
  }

  const timeEntries = await TimeEntry.findActiveEntries(employeeId)
  const timeEntriesRaw = await (TimeEntry.findActiveEntries(employeeId) as any)
    .sort({ startTime: -1 });
  const populatedTimeEntries = await TimeEntry.populate(timeEntriesRaw, [
    { path: 'projectId', select: 'name description' },
    { path: 'taskId', select: 'name description' },
    { path: 'employeeId', select: 'name email' }
  ]);

  const response: ApiResponse<typeof timeEntries> = {
    success: true,
    data: timeEntries
  };

  res.json(response);
});

// GET /api/v1/time-tracking/employee/:employeeId - Get employee time entries
export const getEmployeeTimeEntries = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { employeeId } = req.params;
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate) {
    start = new Date(Number(startDate));
  }
  if (endDate) {
    end = new Date(Number(endDate));
  }

  const timeEntries = await TimeEntry.findByEmployee(employeeId, start, end)
  const timeEntriesRaw2 = await (TimeEntry.findByEmployee(employeeId, start, end) as any)
    .sort({ startTime: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const populatedTimeEntries2 = await TimeEntry.populate(timeEntriesRaw2, [
    { path: 'projectId', select: 'name description' },
    { path: 'taskId', select: 'name description' },
    { path: 'employeeId', select: 'name email' }
  ]);

  const total = await TimeEntry.countDocuments({
    employeeId,
    ...(start && end && { startTime: { $gte: start, $lte: end } })
  });

  const response: ApiResponse<typeof timeEntries> = {
    success: true,
    data: timeEntries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// GET /api/v1/analytics/window - Get window analytics
export const getWindowAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    start,
    end,
    timezone,
    employeeId,
    teamId,
    projectId,
    taskId,
    shiftId
  } = req.query;

  const startDate = new Date(Number(start));
  const endDate = new Date(Number(end));

  // Build query
  const query: any = {
    startTime: { $gte: startDate, $lte: endDate },
    isActive: false
  };

  if (employeeId) query.employeeId = employeeId;
  if (projectId) query.projectId = projectId;
  if (taskId) query.taskId = taskId;
  if (shiftId) query._id = shiftId;

  // Get time entries
  const timeEntries = await TimeEntry.find(query)
    .populate('employeeId', 'name email teamId')
    .populate('projectId', 'name')
    .populate('taskId', 'name');

  // Filter by team if specified
  let filteredEntries = timeEntries;
  if (teamId) {
    filteredEntries = timeEntries.filter(entry => 
      entry.employeeId && (entry.employeeId as any).teamId === teamId
    );
  }

  // Calculate analytics
  const totalTime = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const activeTime = totalTime; // For now, assume all time is active
  const idleTime = 0; // This would be calculated based on activity data

  // Get screenshot count
  const screenshotCount = await Screenshot.countDocuments({
    takenAt: { $gte: startDate, $lte: endDate },
    ...(employeeId && { employeeId }),
    ...(projectId && { projectId }),
    ...(taskId && { taskId })
  });

  const analytics: WindowAnalytics = {
    employeeId: employeeId as string,
    teamId: teamId as string,
    projectId: projectId as string,
    taskId: taskId as string,
    shiftId: shiftId as string,
    start: Number(start),
    end: Number(end),
    timezone: timezone as string,
    totalTime,
    activeTime,
    idleTime,
    screenshots: screenshotCount,
    activities: [] // This would be populated with activity data
  };

  const response: ApiResponse<WindowAnalytics> = {
    success: true,
    data: analytics
  };

  res.json(response);
});

// GET /api/v1/analytics/screenshot - Get screenshots
export const getScreenshots = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    start,
    end,
    timezone,
    taskId,
    shiftId,
    projectId,
    sortBy = 'takenAt',
    limit = 15,
    next: nextToken
  } = req.query;

  const startDate = new Date(Number(start));
  const endDate = new Date(Number(end));

  // Build query
  const query: any = {
    takenAt: { $gte: startDate, $lte: endDate }
  };

  if (taskId) query.taskId = taskId;
  if (shiftId) query.timeEntryId = shiftId;
  if (projectId) query.projectId = projectId;

  // Build sort
  const sort: any = {};
  const sortByStr = Array.isArray(sortBy) ? sortBy[0] : typeof sortBy === 'object' ? '' : sortBy;
  if (typeof sortByStr === 'string' && sortByStr.startsWith('-')) {
    sort[sortByStr.substring(1)] = -1;
  } else if (typeof sortByStr === 'string') {
    sort[sortByStr] = 1;
  }

  // Execute query
  const screenshots = await Screenshot.find(query)
    .sort(sort)
    .limit(Number(limit))
    .populate('employeeId', 'name email')
    .populate('projectId', 'name')
    .populate('taskId', 'name')
    .populate('timeEntryId', 'startTime endTime duration');

  const response: ApiResponse<ScreenshotResponse> = {
    success: true,
    data: {
      screenshots,
      total: screenshots.length,
      hasMore: screenshots.length === Number(limit)
    }
  };

  res.json(response);
});

// GET /api/v1/analytics/screenshot-paginate - Get screenshots with pagination
export const getScreenshotsPaginated = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    start,
    end,
    timezone,
    taskId,
    shiftId,
    projectId,
    sortBy = 'takenAt',
    limit = 10000,
    next: nextToken
  } = req.query;

  const startDate = new Date(Number(start));
  const endDate = new Date(Number(end));

  // Build query
  const query: any = {
    takenAt: { $gte: startDate, $lte: endDate }
  };

  if (taskId) query.taskId = taskId;
  if (shiftId) query.timeEntryId = shiftId;
  if (projectId) query.projectId = projectId;

  // Build sort
  const sort: any = {};
  const sortByStr2 = Array.isArray(sortBy) ? sortBy[0] : typeof sortBy === 'object' ? '' : sortBy;
  if (typeof sortByStr2 === 'string' && sortByStr2.startsWith('-')) {
    sort[sortByStr2.substring(1)] = -1;
  } else if (typeof sortByStr2 === 'string') {
    sort[sortByStr2] = 1;
  }

  // Execute query
  const screenshots = await Screenshot.find(query)
    .sort(sort)
    .limit(Number(limit))
    .populate('employeeId', 'name email')
    .populate('projectId', 'name')
    .populate('taskId', 'name')
    .populate('timeEntryId', 'startTime endTime duration');

  const response: ApiResponse<ScreenshotResponse> = {
    success: true,
    data: {
      screenshots,
      total: screenshots.length,
      hasMore: screenshots.length === Number(limit)
    }
  };

  res.json(response);
});

// DELETE /api/v1/analytics/screenshot/:id - Delete screenshot
export const deleteScreenshot = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const deleted = await screenshotService.deleteScreenshot(id);
  if (!deleted) {
    return next(createError('Screenshot not found', 404));
  }

  const response: ApiResponse = {
    success: true,
    message: 'Screenshot deleted successfully'
  };

  res.json(response);
});

// GET /api/v1/analytics/screenshot/:id/file - Get screenshot file
export const getScreenshotFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const screenshot = await Screenshot.findById(id);
  if (!screenshot) {
    return next(createError('Screenshot not found', 404));
  }

  const fileBuffer = await screenshotService.getScreenshot(id);
  if (!fileBuffer) {
    return next(createError('Screenshot file not found', 404));
  }

  res.set({
    'Content-Type': screenshot.mimeType,
    'Content-Length': screenshot.fileSize,
    'Content-Disposition': `inline; filename="${screenshot.fileName}"`
  });

  res.send(fileBuffer);
});

// GET /api/v1/analytics/screenshot/:id/thumbnail - Get screenshot thumbnail
export const getScreenshotThumbnail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const screenshot = await Screenshot.findById(id);
  if (!screenshot) {
    return next(createError('Screenshot not found', 404));
  }

  const thumbnailBuffer = await screenshotService.getThumbnail(id);
  if (!thumbnailBuffer) {
    return next(createError('Screenshot thumbnail not found', 404));
  }

  res.set({
    'Content-Type': 'image/jpeg',
    'Content-Length': thumbnailBuffer.length,
    'Content-Disposition': `inline; filename="thumb_${screenshot.fileName}"`
  });

  res.send(thumbnailBuffer);
});
