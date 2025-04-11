/**
 * Custom hook for managing event form state and validation
 * Centralizes form state management and validation logic
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  EventForm, 
  FormErrors, 
  SectionCompletion, 
  NavigationDirection 
} from '../types';
import { DEFAULT_FORM_VALUES, DEFAULT_SECTION_COMPLETION } from '../constants';
import { Alert } from 'react-native';

/**
 * Custom hook for managing event form state and validation
 * @returns Form state, errors, validation functions, and navigation helpers
 */
export function useEventForm() {
  // Form state
  const [formData, setFormData] = useState<EventForm>(DEFAULT_FORM_VALUES);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [activeSection, setActiveSection] = useState(1);
  const [sectionComplete, setSectionComplete] = useState<SectionCompletion>(DEFAULT_SECTION_COMPLETION);
  
  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [currentPickerMode, setCurrentPickerMode] = useState<'date' | 'time'>('date');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  /**
   * Update form data with partial updates
   * @param updates Partial form data to update
   */
  const updateFormData = useCallback((updates: Partial<EventForm>) => {
    setFormData(prevData => ({ ...prevData, ...updates }));
  }, []);

  /**
   * Validate a specific section of the form
   * @param section Section number to validate
   * @returns Boolean indicating if the section is valid
   */
  const validateSection = useCallback((section: number): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    switch (section) {
      case 1: // Basic Info
        if (!formData.title.trim()) {
          errors.title = 'Title is required';
          isValid = false;
        }

        if (!formData.description.trim()) {
          errors.description = 'Description is required';
          isValid = false;
        } else if (formData.description.length < 30) {
          errors.description = 'Description should be at least 30 characters';
          isValid = false;
        }
        break;

      case 2: // Date & Time
        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(formData.date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          errors.date = 'Event date cannot be in the past';
          isValid = false;
        }

        // End date should be after start date
        if (formData.endDate < formData.date) {
          errors.date = 'End date must be after start date';
          isValid = false;
        }

        // Same day - check times
        if (selectedDate.getTime() === formData.endDate.getTime()) {
          if (formData.endTime <= formData.time) {
            errors.time = 'End time must be after start time';
            isValid = false;
          }
        }
        break;

      case 3: // Location
        if (!formData.isVirtual) {
          // In-person event location validation
          if (!formData.address.trim()) {
            errors.address = 'Address is required for in-person events';
            isValid = false;
          }

          if (!formData.city.trim()) {
            errors.city = 'City is required for in-person events';
            isValid = false;
          }

          if (!formData.country.trim()) {
            errors.country = 'Country is required';
            isValid = false;
          }

          // Check state/province for countries that require it
          if ((formData.country === 'United States' || formData.country === 'Canada') && !formData.state.trim()) {
            errors.state = formData.country === 'United States' ? 'State is required' : 'Province is required';
            isValid = false;
          }

          // ZIP/Postal code validation based on country
          if (formData.country === 'United States' && !formData.zipCode.trim()) {
            errors.zipCode = 'ZIP code is required';
            isValid = false;
          }
        } else {
          // Virtual event validation
          if (!formData.virtualLink.trim()) {
            errors.virtualLink = 'Virtual event link is required';
            isValid = false;
          }
        }
        break;

      case 4: // Tickets & Registration
        // Capacity validation
        if (formData.capacity && isNaN(Number(formData.capacity))) {
          errors.capacity = 'Capacity must be a number';
          isValid = false;
        }

        // Pricing validation
        if (formData.isPaid) {
          if (formData.ticketTypes.length === 0) {
            if (!formData.price.trim()) {
              errors.price = 'Price is required for paid events';
              isValid = false;
            } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
              errors.price = 'Price must be a positive number';
              isValid = false;
            }
          } else {
            // Validate ticket types
            const invalidTickets = formData.ticketTypes.filter(
              ticket => !ticket.name || isNaN(Number(ticket.price)) || Number(ticket.price) < 0
            );
            
            if (invalidTickets.length > 0) {
              errors.ticketTypes = 'All ticket types must have a name and valid price';
              isValid = false;
            }
          }
        }
        break;

      case 5: // Speakers
        // No mandatory validation for speakers
        break;

      case 6: // Settings & Policies
        // No mandatory validation for settings/policies
        break;
      
      default:
        break;
    }

    setFormErrors(errors);
    setSectionComplete(prev => ({...prev, [section]: isValid}));
    
    return isValid;
  }, [formData]);

  /**
   * Validate the entire form
   * @returns Boolean indicating if the entire form is valid
   */
  const validateForm = useCallback((): boolean => {
    let allValid = true;
    
    // Check validation for each section
    for (let i = 1; i <= 6; i++) {
      if (!validateSection(i)) {
        allValid = false;
        
        // If any section is invalid, show alert and navigate to that section
        if (!sectionComplete[i as keyof typeof sectionComplete]) {
          Alert.alert(
            'Incomplete Section', 
            `Please complete section ${i} before submitting`,
            [{ text: 'OK', onPress: () => setActiveSection(i) }]
          );
          return false;
        }
      }
    }
    
    return allValid;
  }, [validateSection, sectionComplete]);

  /**
   * Navigate between form sections
   * @param direction Direction to navigate (next or previous)
   */
  const navigateSection = useCallback((direction: NavigationDirection) => {
    // Validate current section before advancing
    if (direction === 'next') {
      if (!validateSection(activeSection)) {
        Alert.alert('Please complete this section', 'All required fields must be filled correctly before proceeding.');
        return;
      }
    }
    
    const nextSection = direction === 'next' ? activeSection + 1 : activeSection - 1;
    
    if (nextSection >= 1 && nextSection <= 6) {
      setActiveSection(nextSection);
    }
  }, [activeSection, validateSection]);

  /**
   * Handle image selection for main event image
   * @param uri Image URI
   */
  const handleImageSelected = useCallback((uri: string) => {
    updateFormData({ imageUri: uri });
  }, [updateFormData]);

  /**
   * Add a new tag to the form
   */
  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData({
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  }, [newTag, formData.tags, updateFormData]);

  /**
   * Remove a tag from the form
   * @param tagToRemove Tag to remove
   */
  const removeTag = useCallback((tagToRemove: string) => {
    updateFormData({
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  }, [formData.tags, updateFormData]);

  // Validate current section when form data changes
  useEffect(() => {
    validateSection(activeSection);
  }, [formData, activeSection, validateSection]);

  return {
    // Form state
    formData,
    formErrors,
    activeSection,
    sectionComplete,
    
    // Modal states
    showDatePicker,
    showEndDatePicker,
    showTimePicker,
    showEndTimePicker,
    showDeadlinePicker,
    currentPickerMode,
    showTagInput,
    newTag,
    showPreview,
    
    // State updaters
    setFormData,
    updateFormData,
    setActiveSection,
    setSectionComplete,
    setShowDatePicker,
    setShowEndDatePicker,
    setShowTimePicker,
    setShowEndTimePicker,
    setShowDeadlinePicker,
    setCurrentPickerMode,
    setShowTagInput,
    setNewTag,
    setShowPreview,
    
    // Form operations
    validateSection,
    validateForm,
    navigateSection,
    handleImageSelected,
    addTag,
    removeTag,
  };
}