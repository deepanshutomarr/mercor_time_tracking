import { Router } from 'express';

import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
  addEmployeeToTask,
  removeEmployeeFromTask,
  updateTaskStatus,
  updateTaskPriority,
  addLabelToTask,
  removeLabelFromTask,
  getTaskEmployees,
  getTaskStats,
  getOverdueTasks
} from '../controllers/taskController';
import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  taskQuerySchema
} from '../validations/task';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireEmployee } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Task management routes
router.post('/', requireAdmin, validateRequest(createTaskSchema), createTask);
router.get('/', requireEmployee, validateQuery(taskQuerySchema), getTasks);
router.get('/overdue', requireEmployee, getOverdueTasks);
router.get('/:id', requireEmployee, validateParams(taskParamsSchema), getTask);
router.put('/:id', requireAdmin, validateParams(taskParamsSchema), validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', requireAdmin, validateParams(taskParamsSchema), deleteTask);

// Task employee management
router.post('/:id/employees', requireAdmin, validateParams(taskParamsSchema), addEmployeeToTask);
router.delete('/:id/employees/:employeeId', requireAdmin, validateParams(taskParamsSchema), removeEmployeeFromTask);
router.get('/:id/employees', requireEmployee, validateParams(taskParamsSchema), getTaskEmployees);

// Task status and priority management
router.put('/:id/status', requireEmployee, validateParams(taskParamsSchema), updateTaskStatus);
router.put('/:id/priority', requireEmployee, validateParams(taskParamsSchema), updateTaskPriority);

// Task label management
router.post('/:id/labels', requireEmployee, validateParams(taskParamsSchema), addLabelToTask);
router.delete('/:id/labels/:label', requireEmployee, validateParams(taskParamsSchema), removeLabelFromTask);

// Task analytics
router.get('/:id/stats', requireEmployee, validateParams(taskParamsSchema), getTaskStats);

export default router;
