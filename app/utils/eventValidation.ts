//app/utils/eventValidation.ts
interface ValidationError {
    field: string;
    message: string;
  }
  
  const validateEventForm = (formData: any): ValidationError[] => {
    const errors: ValidationError[] = [];
  
    // Title validation
    if (!formData.title.trim()) {
      errors.push({ field: 'title', message: 'Event title is required' });
    } else if (formData.title.length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    }
  
    // Date validation
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
  
    if (!formData.date) {
      errors.push({ field: 'date', message: 'Event date is required' });
    } else if (formData.date < currentDate) {
      errors.push({ field: 'date', message: 'Event date cannot be in the past' });
    }
  
    // Location validation
    if (!formData.location.trim()) {
      errors.push({ field: 'location', message: 'Event location is required' });
    }
  
    // Capacity validation
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        errors.push({ field: 'capacity', message: 'Capacity must be a positive number' });
      }
    }
  
    return errors;
  };
  
  export default validateEventForm;
  