import { ValidationError } from '../errors/applicationErrors.js';

/**
 * Validate input against a schema
 */
const validate = (data, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      continue; // Skip other validations if required fails
    }
    
    // Skip other validations if field is not present and not required
    if ((value === undefined || value === null) && !rules.required) {
      continue;
    }
    
    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push({ field, message: `${field} must be a ${rules.type}` });
    }
    
    // String-specific validations
    if (rules.type === 'string') {
      // Min length
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }
      
      // Max length
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
      }
      
      // Pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({ field, message: rules.patternMessage || `${field} has invalid format` });
      }
    }
    
    // Number-specific validations
    if (rules.type === 'number' || (rules.type === 'string' && rules.numeric)) {
      const numValue = Number(value);
      
      // Check if it's a valid number
      if (isNaN(numValue)) {
        errors.push({ field, message: `${field} must be a number` });
        continue;
      }
      
      // Min value
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
      }
      
      // Max value
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push({ field, message: `${field} must be at most ${rules.max}` });
      }
    }
    
    // Date validation
    if (rules.isDate) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({ field, message: `${field} must be a valid date` });
      }
    }
    
    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value, data);
      if (customResult !== true) {
        errors.push({ field, message: customResult || `${field} is invalid` });
      }
    }
  }
  
  return errors;
};

/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = validate(req.body, schema);
    
    if (errors.length > 0) {
      // Use our validation error class with the first error
      const firstError = errors[0];
      return next(new ValidationError(firstError.message, firstError.field));
    }
    
    next();
  };
};

/**
 * Query parameters validation middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = validate(req.query, schema);
    
    if (errors.length > 0) {
      // Use our validation error class with the first error
      const firstError = errors[0];
      return next(new ValidationError(firstError.message, firstError.field));
    }
    
    next();
  };
};

/**
 * URL parameters validation middleware
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const errors = validate(req.params, schema);
    
    if (errors.length > 0) {
      // Use our validation error class with the first error
      const firstError = errors[0];
      return next(new ValidationError(firstError.message, firstError.field));
    }
    
    next();
  };
};

export {
  validate,
  validateRequest,
  validateQuery,
  validateParams
}; 