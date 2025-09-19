import { Router } from 'express';

import {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  addEmployeeToProject,
  removeEmployeeFromProject,
  getProjectEmployees,
  updateScreenshotSettings,
  getProjectStats
} from '../controllers/projectController';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  projectQuerySchema
} from '../validations/project';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireEmployee } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Project management routes
router.post('/', requireAdmin, validateRequest(createProjectSchema), createProject);
router.get('/', requireEmployee, validateQuery(projectQuerySchema), getProjects);
router.get('/:id', requireEmployee, validateParams(projectParamsSchema), getProject);
router.put('/:id', requireAdmin, validateParams(projectParamsSchema), validateRequest(updateProjectSchema), updateProject);
router.delete('/:id', requireAdmin, validateParams(projectParamsSchema), deleteProject);

// Project status management
router.post('/:id/archive', requireAdmin, validateParams(projectParamsSchema), archiveProject);
router.post('/:id/unarchive', requireAdmin, validateParams(projectParamsSchema), unarchiveProject);

// Project employee management
router.post('/:id/employees', requireAdmin, validateParams(projectParamsSchema), addEmployeeToProject);
router.delete('/:id/employees/:employeeId', requireAdmin, validateParams(projectParamsSchema), removeEmployeeFromProject);
router.get('/:id/employees', requireEmployee, validateParams(projectParamsSchema), getProjectEmployees);

// Project settings
router.put('/:id/screenshot-settings', requireAdmin, validateParams(projectParamsSchema), updateScreenshotSettings);

// Project analytics
router.get('/:id/stats', requireEmployee, validateParams(projectParamsSchema), getProjectStats);

export default router;
