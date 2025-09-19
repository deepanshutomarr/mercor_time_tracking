import { Router } from 'express';
import employeeRoutes from './employeeRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import timeTrackingRoutes from './timeTrackingRoutes';

const router = Router();

// API routes
router.use('/employee', employeeRoutes);
router.use('/project', projectRoutes);
router.use('/task', taskRoutes);
router.use('/time-tracking', timeTrackingRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
