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
  
  // Wrap all validation functions in an object and export it as the default function
  const validationUtils = {
    validatePassword,
    validateEmail,
    validateName,
    validateConfirmPassword,
  };
  
  export default validationUtils;
  