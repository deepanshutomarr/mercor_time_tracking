import { Router } from 'express';

import {
  createEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  addProjectToEmployee,
  removeProjectFromEmployee,
  getEmployeeProjects,
  loginEmployee,
  activateAccount
} from '../controllers/employeeController';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeParamsSchema,
  employeeQuerySchema
} from '../validations/employee';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireEmployee } from '../middleware/auth';

const router = Router();

// Public routes
import { registerEmployee } from '../controllers/employeeController';
import Joi from 'joi';
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});
router.post('/register', validateRequest(registerSchema), registerEmployee);
router.post('/login', validateRequest(createEmployeeSchema), loginEmployee);
router.post('/activate-account', activateAccount);

// Protected routes
router.use(authenticateToken);

// Employee management routes
router.post('/', requireAdmin, validateRequest(createEmployeeSchema), createEmployee);
router.get('/', requireAdmin, validateQuery(employeeQuerySchema), getEmployees);
router.get('/:id', requireAdmin, validateParams(employeeParamsSchema), getEmployee);
router.put('/:id', requireAdmin, validateParams(employeeParamsSchema), validateRequest(updateEmployeeSchema), updateEmployee);
router.post('/:id/deactivate', requireAdmin, validateParams(employeeParamsSchema), deactivateEmployee);
router.post('/:id/activate', requireAdmin, validateParams(employeeParamsSchema), activateEmployee);

// Employee project management
router.post('/:id/projects', requireAdmin, validateParams(employeeParamsSchema), addProjectToEmployee);
router.delete('/:id/projects/:projectId', requireAdmin, validateParams(employeeParamsSchema), removeProjectFromEmployee);
router.get('/:id/projects', requireAdmin, validateParams(employeeParamsSchema), getEmployeeProjects);

export default router;
