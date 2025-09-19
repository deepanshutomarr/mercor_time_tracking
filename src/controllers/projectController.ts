import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Employee from '../models/Employee';
import { logger } from '../config/logger';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../types';

// POST /api/v1/project - Create new project
export const createProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    description,
    employees,
    statuses = [],
    priorities = [],
    billable = true,
    deadline,
    payroll
  }: CreateProjectRequest = req.body;

  // Verify all employees exist
  const existingEmployees = await Employee.find({ _id: { $in: employees } });
  if (existingEmployees.length !== employees.length) {
    return next(createError('One or more employees not found', 400));
  }

  // Create project
  const project = new Project({
    name,
    description,
    employees,
    statuses,
    priorities,
    billable,
    deadline,
    payroll
  });

  await project.save();

  // Add project to employees
  for (const employeeId of employees) {
    const employee = await Employee.findById(employeeId);
    if (employee) {
      await employee.addProject(project._id.toString());
    }
  }

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Project created successfully'
  };

  res.status(201).json(response);
});

// GET /api/v1/project/:id - Get project by ID
export const getProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('employees', 'name email title')
    .populate('tasks', 'name description status priority');

  if (!project) {
    return next(createError('Project not found', 404));
  }

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project
  };

  res.json(response);
});

// GET /api/v1/project - List all projects
export const getProjects = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    archived,
    billable,
    employeeId
  } = req.query;

  // Build query
  const query: any = {};
  if (archived !== undefined) {
    query.archived = archived === 'true';
  }
  if (billable !== undefined) {
    query.billable = billable === 'true';
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
  const projects = await Project.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate('employees', 'name email title')
    .populate('tasks', 'name description status priority');

  const total = await Project.countDocuments(query);
  const totalPages = Math.ceil(total / Number(limit));

  const response: ApiResponse<typeof projects> = {
    success: true,
    data: projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: totalPages
    }
  };

  res.json(response);
});

// PUT /api/v1/project/:id - Update project
export const updateProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData: UpdateProjectRequest = req.body;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  // If employees are being updated, verify they exist
  if (updateData.employees) {
    const existingEmployees = await Employee.find({ _id: { $in: updateData.employees } });
    if (existingEmployees.length !== updateData.employees.length) {
      return next(createError('One or more employees not found', 400));
    }
  }

  // Update project
  Object.assign(project, updateData);
  await project.save();

  // Update employee project assignments if employees changed
  if (updateData.employees) {
    // Remove project from old employees
    const oldEmployees = await Employee.find({ projects: id });
    for (const employee of oldEmployees) {
      if (!updateData.employees.includes(employee._id.toString())) {
        await employee.removeProject(id);
      }
    }

    // Add project to new employees
    for (const employeeId of updateData.employees) {
      const employee = await Employee.findById(employeeId);
      if (employee && !employee.projects.includes(id)) {
        await employee.addProject(id);
      }
    }
  }

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Project updated successfully'
  };

  res.json(response);
});

// DELETE /api/v1/project/:id - Delete project
export const deleteProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  // Remove project from all employees
  const employees = await Employee.find({ projects: id });
  for (const employee of employees) {
    await employee.removeProject(id);
  }

  // Delete project
  await Project.findByIdAndDelete(id);

  const response: ApiResponse = {
    success: true,
    message: 'Project deleted successfully'
  };

  res.json(response);
});

// POST /api/v1/project/:id/archive - Archive project
export const archiveProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  await project.archive();

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Project archived successfully'
  };

  res.json(response);
});

// POST /api/v1/project/:id/unarchive - Unarchive project
export const unarchiveProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  await project.unarchive();

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Project unarchived successfully'
  };

  res.json(response);
});

// POST /api/v1/project/:id/employees - Add employee to project
export const addEmployeeToProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await project.addEmployee(employeeId);
  await employee.addProject(id);

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Employee added to project successfully'
  };

  res.json(response);
});

// DELETE /api/v1/project/:id/employees/:employeeId - Remove employee from project
export const removeEmployeeFromProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id, employeeId } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await project.removeEmployee(employeeId);
  await employee.removeProject(id);

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Employee removed from project successfully'
  };

  res.json(response);
});

// GET /api/v1/project/:id/employees - Get project employees
export const getProjectEmployees = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id).populate('employees', 'name email title');
  if (!project) {
    return next(createError('Project not found', 404));
  }

  const response: ApiResponse<typeof project.employees> = {
    success: true,
    data: project.employees
  };

  res.json(response);
});

// PUT /api/v1/project/:id/screenshot-settings - Update screenshot settings
export const updateScreenshotSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { screenshotSettings } = req.body;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  await project.updateScreenshotSettings(screenshotSettings);

  const response: ApiResponse<typeof project> = {
    success: true,
    data: project,
    message: 'Screenshot settings updated successfully'
  };

  res.json(response);
});

// GET /api/v1/project/:id/stats - Get project statistics
export const getProjectStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(createError('Project not found', 404));
  }

  // Get time tracking stats for this project
  const TimeEntry = require('../models/TimeEntry').default;
  const stats = await TimeEntry.aggregate([
    { $match: { projectId: id, isActive: false } },
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
    project: typeof project;
    stats: {
      totalTime: number;
      totalEntries: number;
      averageSessionTime: number;
    };
  }> = {
    success: true,
    data: {
      project,
      stats: stats[0] || {
        totalTime: 0,
        totalEntries: 0,
        averageSessionTime: 0
      }
    }
  };

  res.json(response);
});
