// Error types
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DUPLICATE: 'DUPLICATE_ENTRY_ERROR',
  SERVER: 'SERVER_ERROR'
};

// Error handler class
class AppError extends Error {
  constructor(message, type, statusCode = 500) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// Centralized error handler
const handleError = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    type: err.type,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.message || 'Internal server error',
      type: err.type || ERROR_TYPES.SERVER,
      status: statusCode,
      timestamp: err.timestamp || new Date().toISOString()
    }
  };

  res.status(statusCode).json(response);
};

// Validation error creator
const createValidationError = (message) => {
  return new AppError(message, ERROR_TYPES.VALIDATION, 400);
};

// Database error creator
const createDatabaseError = (message) => {
  return new AppError(message, ERROR_TYPES.DATABASE, 500);
};

// Authentication error creator
const createAuthError = (message) => {
  return new AppError(message, ERROR_TYPES.AUTH, 401);
};

// Not found error creator
const createNotFoundError = (message) => {
  return new AppError(message, ERROR_TYPES.NOT_FOUND, 404);
};

export {
  ERROR_TYPES,
  AppError,
  handleError,
  createValidationError,
  createDatabaseError,
  createAuthError,
  createNotFoundError
}; 