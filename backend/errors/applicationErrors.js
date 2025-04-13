// Define application error types
class ApplicationError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Database related errors
class DatabaseError extends ApplicationError {
  constructor(message) {
    super(message || 'Database error occurred', 500, 'DATABASE_ERROR');
  }
}

// Authentication related errors
class AuthenticationError extends ApplicationError {
  constructor(message) {
    super(message || 'Authentication failed', 401, 'AUTHENTICATION_ERROR');
  }
}

// Resource not found errors
class NotFoundError extends ApplicationError {
  constructor(message, resource) {
    super(message || `${resource || 'Resource'} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

// Validation errors
class ValidationError extends ApplicationError {
  constructor(message, field) {
    super(message || 'Validation error', 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// Business rule violation errors
class BusinessRuleError extends ApplicationError {
  constructor(message, rule) {
    super(message || 'Business rule violation', 400, 'BUSINESS_RULE_ERROR');
    this.rule = rule;
  }
}

export {
  ApplicationError,
  DatabaseError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  BusinessRuleError
}; 