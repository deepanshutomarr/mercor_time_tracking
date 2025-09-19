import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../config/logger';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Validation error:', { error: errorMessage, body: req.body });
      
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage,
        details: error.details
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Query validation error:', { error: errorMessage, query: req.query });
      
      res.status(400).json({
        success: false,
        message: 'Query validation error',
        error: errorMessage,
        details: error.details
      });
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Params validation error:', { error: errorMessage, params: req.params });
      
      res.status(400).json({
        success: false,
        message: 'Params validation error',
        error: errorMessage,
        details: error.details
      });
      return;
    }

    req.params = value;
    next();
  };
};
