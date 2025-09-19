import Joi from 'joi';

export const createProjectSchema = Joi.object({
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
  employees: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one employee must be assigned',
      'any.required': 'Employees array is required'
    }),
  statuses: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Statuses must be an array of strings',
      'string.max': 'Each status must not exceed 50 characters'
    }),
  priorities: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Priorities must be an array of strings',
      'string.max': 'Each priority must not exceed 50 characters'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
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

export const updateProjectSchema = Joi.object({
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
  statuses: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Statuses must be an array of strings',
      'string.max': 'Each status must not exceed 50 characters'
    }),
  priorities: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Priorities must be an array of strings',
      'string.max': 'Each priority must not exceed 50 characters'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
    }),
  deadline: Joi.number()
    .integer()
    .optional()
    .messages({
      'number.base': 'Deadline must be a number',
      'number.integer': 'Deadline must be an integer'
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
  }).optional(),
  archived: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Archived must be a boolean'
    }),
  screenshotSettings: Joi.object({
    screenshotEnabled: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Screenshot enabled must be a boolean'
      }),
    interval: Joi.number()
      .integer()
      .min(60000)
      .optional()
      .messages({
        'number.base': 'Interval must be a number',
        'number.integer': 'Interval must be an integer',
        'number.min': 'Interval must be at least 60000ms (1 minute)'
      }),
    quality: Joi.number()
      .integer()
      .min(10)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Quality must be a number',
        'number.integer': 'Quality must be an integer',
        'number.min': 'Quality must be at least 10',
        'number.max': 'Quality must not exceed 100'
      }),
    maxSize: Joi.string()
      .pattern(/^\d+x\d+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Max size must be in format WIDTHxHEIGHT (e.g., 1920x1080)'
      })
  }).optional()
});

export const projectParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Project ID is required'
    })
});

export const projectQuerySchema = Joi.object({
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
    .valid('name', 'createdAt', 'updatedAt', 'deadline')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: name, createdAt, updatedAt, deadline'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    }),
  archived: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Archived must be a boolean'
    }),
  billable: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Billable must be a boolean'
    }),
  employeeId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Employee ID must be a string'
    })
});
