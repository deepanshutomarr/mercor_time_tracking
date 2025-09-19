import Joi from 'joi';

export const startTimeTrackingSchema = Joi.object({
  projectId: Joi.string()
    .required()
    .messages({
      'any.required': 'Project ID is required'
    }),
  taskId: Joi.string()
    .required()
    .messages({
      'any.required': 'Task ID is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    })
});

export const stopTimeTrackingSchema = Joi.object({
  timeEntryId: Joi.string()
    .required()
    .messages({
      'any.required': 'Time Entry ID is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    })
});

export const timeTrackingQuerySchema = Joi.object({
  start: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Start time must be a number',
      'number.integer': 'Start time must be an integer',
      'any.required': 'Start time is required'
    }),
  end: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'End time must be a number',
      'number.integer': 'End time must be an integer',
      'any.required': 'End time is required'
    }),
  timezone: Joi.string()
    .optional()
    .messages({
      'string.base': 'Timezone must be a string'
    }),
  employeeId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Employee ID must be a string'
    }),
  teamId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Team ID must be a string'
    }),
  projectId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Project ID must be a string'
    }),
  taskId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Task ID must be a string'
    }),
  shiftId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Shift ID must be a string'
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
    })
});

export const screenshotQuerySchema = Joi.object({
  start: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Start time must be a number',
      'number.integer': 'Start time must be an integer',
      'any.required': 'Start time is required'
    }),
  end: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'End time must be a number',
      'number.integer': 'End time must be an integer',
      'any.required': 'End time is required'
    }),
  timezone: Joi.string()
    .optional()
    .messages({
      'string.base': 'Timezone must be a string'
    }),
  taskId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Task ID must be a string'
    }),
  shiftId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Shift ID must be a string'
    }),
  projectId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Project ID must be a string'
    }),
  sortBy: Joi.string()
    .valid('takenAt', '-takenAt', 'fileSize', '-fileSize')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: takenAt, -takenAt, fileSize, -fileSize'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 10000'
    }),
  next: Joi.string()
    .optional()
    .messages({
      'string.base': 'Next must be a string'
    })
});

export const screenshotParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Screenshot ID is required'
    })
});
