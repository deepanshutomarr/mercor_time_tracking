import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  teamId: Joi.string()
    .required()
    .messages({
      'any.required': 'Team ID is required'
    }),
  sharedSettingsId: Joi.string()
    .required()
    .messages({
      'any.required': 'Shared Settings ID is required'
    }),
  title: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Title must not exceed 100 characters'
    }),
  projects: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Projects must be an array of strings'
    })
});

export const updateEmployeeSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  title: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Title must not exceed 100 characters'
    }),
  teamId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Team ID must be a string'
    }),
  sharedSettingsId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Shared Settings ID must be a string'
    }),
  projects: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Projects must be an array of strings'
    })
});

export const employeeParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Employee ID is required'
    })
});

export const employeeQuerySchema = Joi.object({
  select: Joi.string()
    .optional()
    .messages({
      'string.base': 'Select must be a string'
    }),
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
    .valid('name', 'email', 'createdAt', 'updatedAt', 'lastLoginAt')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: name, email, createdAt, updatedAt, lastLoginAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    }),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'IsActive must be a boolean'
    }),
  teamId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Team ID must be a string'
    })
});
