import Joi from 'joi';

export const createTaskSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 200 characters',
      'any.required': 'Name is required'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  projectId: Joi.string()
    .required()
    .messages({
      'any.required': 'Project ID is required'
    }),
  employees: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one employee must be assigned',
      'any.required': 'Employees array is required'
    }),
  deadline: Joi.number()
    .integer()
    .min(Date.now())
    .optional()
    .messages({
      'number.base': 'Deadline must be a number',
      'number.integer': 'Deadline must be an integer',
      'number.min': 'Deadline must be in the future'
    }),
  status: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Status must not exceed 50 characters'
    }),
  labels: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Labels must be an array of strings',
      'string.max': 'Each label must not exceed 50 characters'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
    }),
  payroll: Joi.object({
    billRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Bill rate must be a number',
        'number.min': 'Bill rate must be non-negative',
        'any.required': 'Bill rate is required'
      }),
    overtimeBillRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Overtime bill rate must be a number',
        'number.min': 'Overtime bill rate must be non-negative',
        'any.required': 'Overtime bill rate is required'
      })
  }).optional()
});

export const updateTaskSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 200 characters'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  employees: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Employees must be an array of strings'
    }),
  deadline: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'Deadline must be a number',
      'number.integer': 'Deadline must be an integer'
    }),
  status: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Status must not exceed 50 characters'
    }),
  labels: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Labels must be an array of strings',
      'string.max': 'Each label must not exceed 50 characters'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
    }),
  payroll: Joi.object({
    billRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Bill rate must be a number',
        'number.min': 'Bill rate must be non-negative',
        'any.required': 'Bill rate is required'
      }),
    overtimeBillRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Overtime bill rate must be a number',
        'number.min': 'Overtime bill rate must be non-negative',
        'any.required': 'Overtime bill rate is required'
      })
  }).optional()
});

export const taskParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Task ID is required'
    })
});

export const taskQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'updatedAt', 'deadline', 'priority')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: name, createdAt, updatedAt, deadline, priority'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    }),
  status: Joi.string()
    .optional()
    .messages({
      'string.base': 'Status must be a string'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
    }),
  projectId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Project ID must be a string'
    }),
  employeeId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Employee ID must be a string'
    })
});
