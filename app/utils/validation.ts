//app/utils/validation.ts
interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  const validatePassword = (password: string): ValidationResult => {
    const errors: string[] = [];
  
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  const validateEmail = (email: string): ValidationResult => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  const validateName = (name: string): ValidationResult => {
    const errors: string[] = [];
  
    if (!name.trim()) {
      errors.push('Name is required');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push(
        'Name can only contain letters, spaces, hyphens, and apostrophes'
      );
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): ValidationResult => {
    const errors: string[] = [];
  
    if (!confirmPassword) {
      errors.push('Please confirm your password');
    } else if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  /**
   * Validates a phone number
   * @param phoneNumber The phone number to validate
   * @returns Validation result with isValid flag and error messages
   */
  const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
    const errors: string[] = [];
    
    // Skip validation if phone number is empty (assuming it's optional)
    if (!phoneNumber) {
      return {
        isValid: true,
        errors: [],
      };
    }
    
    // Basic format validation
    // Accepts formats like: +1234567890, 1234567890, (123) 456-7890, 123-456-7890
    const phoneRegex = /^(\+?\d{1,3})?[-. (]?\d{3}[-. )]?\d{3}[-. ]?\d{4}$/;
    
    if (!phoneRegex.test(phoneNumber)) {
      errors.push('Please enter a valid phone number');
    }
    
    // Check minimum length (excluding formatting characters)
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      errors.push('Phone number must have at least 10 digits');
    }
    
    // Check maximum length to prevent unreasonably long numbers
    if (digitsOnly.length > 15) {
      errors.push('Phone number has too many digits');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  /**
   * Formats a phone number for consistent storage
   * @param phoneNumber The phone number to format
   * @returns Formatted phone number (E.164 format if possible)
   */
  export const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If it starts with a country code (assuming length > 10 and starts with 1 for US)
    if (digitsOnly.length > 10 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    
    // For US numbers without country code, add +1
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // For other cases, just add + if not present
    return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
  };
  
  // Wrap all validation functions in an object and export it as the default function
  const validationUtils = {
    validatePassword,
    validateEmail,
    validateName,
    validateConfirmPassword,
    validatePhoneNumber,
  };
  
  export default validationUtils;
  