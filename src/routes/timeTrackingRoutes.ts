import { Router } from 'express';

import {
  startTimeTracking,
  stopTimeTracking,
  getActiveTimeEntries,
  getEmployeeTimeEntries,
  getWindowAnalytics,
  getScreenshots,
  getScreenshotsPaginated,
  deleteScreenshot,
  getScreenshotFile,
  getScreenshotThumbnail
} from '../controllers/timeTrackingController';
import {
  startTimeTrackingSchema,
  stopTimeTrackingSchema,
  timeTrackingQuerySchema,
  screenshotQuerySchema,
  screenshotParamsSchema
} from '../validations/timeTracking';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { authenticateToken, requireEmployee } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Time tracking routes
router.post('/start', requireEmployee, validateRequest(startTimeTrackingSchema), startTimeTracking);
router.post('/stop', requireEmployee, validateRequest(stopTimeTrackingSchema), stopTimeTracking);
router.get('/active', requireEmployee, getActiveTimeEntries);
router.get('/employee/:employeeId', requireEmployee, validateQuery(timeTrackingQuerySchema), getEmployeeTimeEntries);

// Analytics routes
router.get('/analytics/window', requireEmployee, validateQuery(timeTrackingQuerySchema), getWindowAnalytics);

// Screenshot routes
router.get('/analytics/screenshot', requireEmployee, validateQuery(screenshotQuerySchema), getScreenshots);
router.get('/analytics/screenshot-paginate', requireEmployee, validateQuery(screenshotQuerySchema), getScreenshotsPaginated);
router.delete('/analytics/screenshot/:id', requireEmployee, validateParams(screenshotParamsSchema), deleteScreenshot);
router.get('/analytics/screenshot/:id/file', requireEmployee, validateParams(screenshotParamsSchema), getScreenshotFile);
router.get('/analytics/screenshot/:id/thumbnail', requireEmployee, validateParams(screenshotParamsSchema), getScreenshotThumbnail);

export default router;
