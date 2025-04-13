import { ApplicationError } from '../errors/applicationErrors.js';

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  
  // Handle known application errors
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.field && { field: err.field }),
        ...(err.resource && { resource: err.resource }),
        ...(err.rule && { rule: err.rule })
      }
    });
  }
  
  // Handle common known errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this key already exists'
      }
    });
  }
  
  // For security, don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      ...((!isProduction && err.stack) && { stack: err.stack.split('\n') })
    }
  });
};

export default errorHandler; 