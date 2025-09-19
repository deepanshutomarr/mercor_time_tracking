
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { SignOptions } from 'jsonwebtoken';
import jwt = require('jsonwebtoken');
import { v4 as uuidv4 } from 'uuid';
import Employee from '../models/Employee';
import Team from '../models/Team';
import SharedSettings from '../models/SharedSettings';
import { config } from '../config';
import { logger } from '../config/logger';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';
import { CreateEmployeeRequest, UpdateEmployeeRequest, ApiResponse } from '../types';


// POST /api/v1/employee/register - Public self-registration
export const registerEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findByEmail(email);
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    // For self-registration, assign default team and sharedSettings (or null)
    const defaultTeam = await Team.findOne();
    const defaultSharedSettings = await SharedSettings.findOne();
    if (!defaultTeam || !defaultSharedSettings) {
      return res.status(500).json({ success: false, message: 'Registration is not available at this time. Please contact admin.' });
    }

    // Generate activation token
    const activationToken = uuidv4();
    const activationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Create employee (inactive by default)
    const employee = new Employee({
      name,
      email,
      password,
      teamId: defaultTeam._id,
      sharedSettingsId: defaultSharedSettings._id,
      isActive: false,
      activationToken,
      activationTokenExpires
    });
    await employee.save();

    // Send activation email
    await emailService.sendEmployeeInvitation(email, name, activationToken);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to activate your account.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
};


// POST /api/v1/employee - Create new employee
export const createEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, teamId, sharedSettingsId, title, projects }: CreateEmployeeRequest = req.body;

  // Check if employee already exists
  const existingEmployee = await Employee.findByEmail(email);
  if (existingEmployee) {
    return next(createError('Employee with this email already exists', 400));
  }

  // Verify team exists
  const team = await Team.findById(teamId);
  if (!team) {
    return next(createError('Team not found', 404));
  }

  // Verify shared settings exist
  const sharedSettings = await SharedSettings.findById(sharedSettingsId);
  if (!sharedSettings) {
    return next(createError('Shared settings not found', 404));
  }

  // Create activation token
  const activationToken = uuidv4();

  // Create employee
  const employee = new Employee({
    name,
    email,
    teamId,
    sharedSettingsId,
    title,
    projects: projects || [],
    isActive: false // Will be activated when they click the email link
  });

  await employee.save();

  // Send invitation email
  const emailSent = await emailService.sendEmployeeInvitation(
    email,
    name,
    activationToken
  );

  if (!emailSent) {
    logger.warn('Failed to send invitation email', { employeeId: employee._id, email });
  }

  // Add employee to team
  await team.addMember(employee._id.toString());

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Employee created successfully. Invitation email sent.'
  };

  res.status(201).json(response);
});

// GET /api/v1/employee/:id - Get employee by ID
export const getEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const employee = await Employee.findById(id)
    .populate('teamId', 'name')
    .populate('sharedSettingsId', 'name')
    .populate('projects', 'name');

  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee
  };

  res.json(response);
});

// GET /api/v1/employee - List all employees
export const getEmployees = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    select = '_id,name,email,createdAt,updatedAt',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    isActive,
    teamId
  } = req.query;

  // Build query
  const query: any = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  if (teamId) {
    query.teamId = teamId;
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  let employeesQuery = Employee.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  if (typeof select === 'string') {
    employeesQuery = employeesQuery.select(select.split(',').join(' '));
  }

  const employees = await employeesQuery
    .populate('teamId', 'name')
    .populate('sharedSettingsId', 'name')
    .populate('projects', 'name');

  const total = await Employee.countDocuments(query);
  const totalPages = Math.ceil(total / Number(limit));

  const response: ApiResponse<typeof employees> = {
    success: true,
    data: employees,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: totalPages
    }
  };

  res.json(response);
});

// PUT /api/v1/employee/:id - Update employee
export const updateEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData: UpdateEmployeeRequest = req.body;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  // Check if email is being changed and if it's already taken
  if (updateData.email && updateData.email !== employee.email) {
    const existingEmployee = await Employee.findByEmail(updateData.email);
    if (existingEmployee) {
      return next(createError('Employee with this email already exists', 400));
    }
  }

  // Update employee
  Object.assign(employee, updateData);
  await employee.save();

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Employee updated successfully'
  };

  res.json(response);
});

// POST /api/v1/employee/deactivate/:id - Deactivate employee
export const deactivateEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await employee.deactivate();

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Employee deactivated successfully'
  };

  res.json(response);
});

// POST /api/v1/employee/activate/:id - Activate employee
export const activateEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await employee.activate();

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Employee activated successfully'
  };

  res.json(response);
});

// POST /api/v1/employee/:id/projects - Add project to employee
export const addProjectToEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { projectId } = req.body;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await employee.addProject(projectId);

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Project added to employee successfully'
  };

  res.json(response);
});

// DELETE /api/v1/employee/:id/projects/:projectId - Remove project from employee
export const removeProjectFromEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id, projectId } = req.params;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  await employee.removeProject(projectId);

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Project removed from employee successfully'
  };

  res.json(response);
});

// GET /api/v1/employee/:id/projects - Get employee's projects
export const getEmployeeProjects = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const employee = await Employee.findById(id).populate('projects', 'name description billable');
  if (!employee) {
    return next(createError('Employee not found', 404));
  }

  const response: ApiResponse<typeof employee.projects> = {
    success: true,
    data: employee.projects
  };

  res.json(response);
});

// POST /api/v1/employee/login - Employee login
export const loginEmployee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Find employee
  const employee = await Employee.findByEmail(email);
  if (!employee) {
    return next(createError('Invalid email or password', 401));
  }

  if (!employee.isActive) {
    return next(createError('Account is not activated', 401));
  }

  // For this implementation, we'll use a simple password check
  // In production, you'd want to hash passwords and store them
  const isValidPassword = await bcrypt.compare(password, employee.email); // Using email as password for demo
  if (!isValidPassword) {
    return next(createError('Invalid email or password', 401));
  }

  // Update last login
  await employee.updateLastLogin();

  // Generate JWT token
  const payload = {
    userId: employee._id,
    email: employee.email,
    role: 'employee'
  };
  const token = jwt.sign(payload, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: parseInt(config.jwtExpiresIn) || '7d'
  });

  const response: ApiResponse<{ token: string; employee: typeof employee }> = {
    success: true,
    data: {
      token,
      employee
    },
    message: 'Login successful'
  };

  res.json(response);
});

// POST /api/v1/employee/activate-account - Activate employee account
export const activateAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    return next(createError('Activation token is required', 400));
  }

  // Find employee by activation token and check expiry
  const employee = await Employee.findOne({ activationToken: token });
  if (!employee) {
    return next(createError('Invalid or expired activation token', 400));
  }
  if (employee.isActive) {
    return next(createError('Account is already activated', 400));
  }
  if (!employee.activationTokenExpires || employee.activationTokenExpires < new Date()) {
    return next(createError('Activation token has expired', 400));
  }

  // Activate account
  employee.isActive = true;
  employee.activationToken = null;
  employee.activationTokenExpires = null;
  await employee.save();

  const response: ApiResponse<typeof employee> = {
    success: true,
    data: employee,
    message: 'Account activated successfully'
  };

  res.json(response);
});
