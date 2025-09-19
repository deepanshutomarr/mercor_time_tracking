import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import Employee from '../models/Employee';
import { logger } from '../config/logger';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { CreateTaskRequest, UpdateTaskRequest, ApiResponse } from '../types';

// POST /api/v1/task - Create new task
export const createTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    description,
    projectId,
    employees,
    deadline,
    status = 'pending',
    labels = [],
    priority = 'medium',
    billable = true,
    payroll
  }: CreateTaskRequest = req.body;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  // Verify all employees exist and are assigned to the project
  const existingEmployees = await Employee.find({ 
    _id: { $in: employees },
    projects: projectId
  });
  if (existingEmployees.length !== employees.length) {
    return next(createError('One or more employees not found or not assigned to project', 400));
  }

  // Create task
  const task = new Task({
    name,
    description,
    projectId,
    employees,
    deadline,
    status,
    labels,
    priority,
    billable,
    payroll
  });

  await task.save();

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Task created successfully'
  };

  res.status(201).json(response);
});

// GET /api/v1/task/:id - Get task by ID
export const getTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate('projectId', 'name description')
    .populate('employees', 'name email title');

  if (!task) {
    return next(createError('Task not found', 404));
  }

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task
  };

  res.json(response);
});

// GET /api/v1/task - List all tasks
export const getTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    priority,
    billable,
    projectId,
    employeeId
  } = req.query;

  // Build query
  const query: any = {};
  if (status) {
    query.status = status;
  }
  if (priority) {
    query.priority = priority;
  }
  if (billable !== undefined) {
    query.billable = billable === 'true';
  }
  if (projectId) {
    query.projectId = projectId;
  }
  if (employeeId) {
    query.employees = employeeId;
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const tasks = await Task.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate('projectId', 'name description')
    .populate('employees', 'name email title');

  const total = await Task.countDocuments(query);
  const totalPages = Math.ceil(total / Number(limit));

  const response: ApiResponse<typeof tasks> = {
    success: true,
    data: tasks,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: totalPages
    }
  };

  res.json(response);
});

// PUT /api/v1/task/:id - Update task
export const updateTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData: UpdateTaskRequest = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  // If employees are being updated, verify they exist and are assigned to the project
  if (updateData.employees) {
    const existingEmployees = await Employee.find({ 
      _id: { $in: updateData.employees },
      projects: task.projectId
    });
    if (existingEmployees.length !== updateData.employees.length) {
      return next(createError('One or more employees not found or not assigned to project', 400));
    }
  }

  // Update task
  Object.assign(task, updateData);
  await task.save();

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Task updated successfully'
  };

  res.json(response);
});

// DELETE /api/v1/task/:id - Delete task
export const deleteTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  // Delete task
  await Task.findByIdAndDelete(id);

  const response: ApiResponse = {
    success: true,
    message: 'Task deleted successfully'
  };

  res.json(response);
});

// POST /api/v1/task/:id/employees - Add employee to task
export const addEmployeeToTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  // Check if employee is assigned to the project
  if (!employee.projects.includes(task.projectId)) {
    return next(createError('Employee is not assigned to the project', 400));
  }

  await task.addEmployee(employeeId);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Employee added to task successfully'
  };

  res.json(response);
});

// DELETE /api/v1/task/:id/employees/:employeeId - Remove employee from task
export const removeEmployeeFromTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id, employeeId } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  await task.removeEmployee(employeeId);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Employee removed from task successfully'
  };

  res.json(response);
});

// PUT /api/v1/task/:id/status - Update task status
export const updateTaskStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  await task.updateStatus(status);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Task status updated successfully'
  };

  res.json(response);
});

// PUT /api/v1/task/:id/priority - Update task priority
export const updateTaskPriority = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { priority } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  await task.updatePriority(priority);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Task priority updated successfully'
  };

  res.json(response);
});

// POST /api/v1/task/:id/labels - Add label to task
export const addLabelToTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { label } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  await task.addLabel(label);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Label added to task successfully'
  };

  res.json(response);
});

// DELETE /api/v1/task/:id/labels/:label - Remove label from task
export const removeLabelFromTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id, label } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  await task.removeLabel(label);

  const response: ApiResponse<typeof task> = {
    success: true,
    data: task,
    message: 'Label removed from task successfully'
  };

  res.json(response);
});

// GET /api/v1/task/:id/employees - Get task employees
export const getTaskEmployees = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const task = await Task.findById(id).populate('employees', 'name email title');
  if (!task) {
    return next(createError('Task not found', 404));
  }

  const response: ApiResponse<typeof task.employees> = {
    success: true,
    data: task.employees
  };

  res.json(response);
});

// GET /api/v1/task/:id/stats - Get task statistics
export const getTaskStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return next(createError('Task not found', 404));
  }

  // Get time tracking stats for this task
  const TimeEntry = require('../models/TimeEntry').default;
  const stats = await TimeEntry.aggregate([
    { $match: { taskId: id, isActive: false } },
    {
      $group: {
        _id: null,
        totalTime: { $sum: '$duration' },
        totalEntries: { $sum: 1 },
        averageSessionTime: { $avg: '$duration' }
      }
    }
  ]);

  const response: ApiResponse<{
    task: typeof task;
    stats: {
      totalTime: number;
      totalEntries: number;
      averageSessionTime: number;
    };
  }> = {
    success: true,
    data: {
      task,
      stats: stats[0] || {
        totalTime: 0,
        totalEntries: 0,
        averageSessionTime: 0
      }
    }
  };

  res.json(response);
});

// GET /api/v1/task/overdue - Get overdue tasks
export const getOverdueTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tasks = await Task.findOverdue();
  const populatedTasks = await Task.populate(tasks, [
    { path: 'projectId', select: 'name description' },
    { path: 'employees', select: 'name email title' }
  ]);

  const response: ApiResponse<typeof populatedTasks> = {
    success: true,
    data: populatedTasks
  };

  res.json(response);
});
