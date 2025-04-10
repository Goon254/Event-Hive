// app/services/errorService.ts
// Import Sentry conditionally to avoid build errors if not installed
let Sentry: any;
try {
  Sentry = require('@sentry/react-native');
} catch (e) {
  // Create a mock Sentry if the package is not available
  Sentry = {
    captureException: (error: any) => {
      console.warn('Sentry not available, error not reported:', error);
    },
    captureMessage: (message: string) => {
      console.warn('Sentry not available, message not reported:', message);
    }
  };
}

// Error types
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

// Custom error class
export class AppError extends Error {
  type: ErrorType;
  originalError?: any;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, originalError?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

// Error handling service
class ErrorService {
  // Map Firebase error codes to user-friendly messages
  private firebaseErrorMap: Record<string, { message: string, type: ErrorType }> = {
    // Authentication errors
    'auth/user-not-found': { 
      message: 'No account found with this email address', 
      type: ErrorType.AUTHENTICATION 
    },
    'auth/wrong-password': { 
      message: 'Incorrect password', 
      type: ErrorType.AUTHENTICATION 
    },
    'auth/email-already-in-use': { 
      message: 'This email is already registered', 
      type: ErrorType.AUTHENTICATION 
    },
    'auth/invalid-email': {
      message: 'Invalid email address',
      type: ErrorType.VALIDATION
    },
    'auth/weak-password': {
      message: 'Password is too weak',
      type: ErrorType.VALIDATION
    },
    'auth/requires-recent-login': {
      message: 'Please log in again to perform this action',
      type: ErrorType.AUTHENTICATION
    },
    
    // Firestore errors
    'permission-denied': { 
      message: 'You don\'t have permission to perform this action', 
      type: ErrorType.PERMISSION 
    },
    'not-found': {
      message: 'The requested resource was not found',
      type: ErrorType.SERVER
    },
    'already-exists': {
      message: 'This resource already exists',
      type: ErrorType.VALIDATION
    },
    'resource-exhausted': {
      message: 'Too many requests. Please try again later',
      type: ErrorType.SERVER
    },
    'failed-precondition': {
      message: 'Operation cannot be executed in the current system state',
      type: ErrorType.SERVER
    },
    'aborted': {
      message: 'The operation was aborted',
      type: ErrorType.SERVER
    },
    'out-of-range': {
      message: 'Operation was attempted past the valid range',
      type: ErrorType.VALIDATION
    },
    'unimplemented': {
      message: 'This feature is not implemented yet',
      type: ErrorType.SERVER
    },
    'internal': {
      message: 'Internal server error. Please try again later',
      type: ErrorType.SERVER
    },
    'unavailable': {
      message: 'Service is currently unavailable. Please try again later',
      type: ErrorType.NETWORK
    },
    'data-loss': {
      message: 'Unrecoverable data loss or corruption',
      type: ErrorType.SERVER
    },
    'unauthenticated': {
      message: 'You need to be logged in to perform this action',
      type: ErrorType.AUTHENTICATION
    }
  };
  
  // Handle Firebase errors
  handleFirebaseError(error: any): AppError {
    console.error('Firebase error:', error);
    
    // Extract error code
    const errorCode = error.code || 'unknown';
    
    // Get mapped error or default
    const mappedError = this.firebaseErrorMap[errorCode] || {
      message: 'An unexpected error occurred',
      type: ErrorType.UNKNOWN
    };
    
    // Log to monitoring service in production
    if (__DEV__ === false) {
      Sentry.captureException(error);
    }
    
    return new AppError(mappedError.message, mappedError.type, error);
  }
  
  // Handle network errors
  handleNetworkError(error: any): AppError {
    console.error('Network error:', error);
    
    // Check if it's a timeout
    const isTimeout = error.message?.includes('timeout') || error.code === 'ECONNABORTED';
    
    const message = isTimeout 
      ? 'Request timed out. Please check your connection and try again.'
      : 'Network error. Please check your connection and try again.';
    
    // Log to monitoring service in production
    if (__DEV__ === false) {
      Sentry.captureException(error);
    }
    
    return new AppError(message, ErrorType.NETWORK, error);
  }
  
  // Handle validation errors
  handleValidationError(error: any, fieldName?: string): AppError {
    console.error('Validation error:', error);
    
    let message = 'Invalid data provided';
    if (fieldName) {
      message = `Invalid ${fieldName}`;
    } else if (error.message) {
      message = error.message;
    }
    
    return new AppError(message, ErrorType.VALIDATION, error);
  }
  
  // General error handler
  handleError(error: any): AppError {
    console.error('Error:', error);
    
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }
    
    // Firebase error
    if (error.code && (
      error.code.startsWith('auth/') || 
      this.firebaseErrorMap[error.code]
    )) {
      return this.handleFirebaseError(error);
    }
    
    // Network error
    if (error.message?.includes('network') || 
        error.name === 'NetworkError' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout')) {
      return this.handleNetworkError(error);
    }
    
    // Default error handling
    const message = error.message || 'An unexpected error occurred';
    
    // Log to monitoring service in production
    if (__DEV__ === false) {
      Sentry.captureException(error);
    }
    
    return new AppError(message, ErrorType.UNKNOWN, error);
  }
}

export const errorService = new ErrorService();
export default errorService;