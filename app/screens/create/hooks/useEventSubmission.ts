/**
 * Custom hook for handling event submission
 * Manages the submission process, image uploads, and navigation after submission
 */

import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { EventForm, User } from '../types';
import eventService from '../../../services/eventServices';
import { imageUploadService } from '../../../services/imageUploadService';

/**
 * Custom hook for handling event submission
 * @param formData The form data to submit
 * @param user The current user
 * @param router The router for navigation
 * @returns Submission state and functions
 */
export function useEventSubmission(
  formData: EventForm, 
  user: User | null,
  router: any
) {
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload an image to Firebase Storage
   * @param uri The image URI to upload
   * @returns Promise resolving to the download URL
   */
  const uploadImage = useCallback(async (uri: string): Promise<string> => {
    try {
      console.log("Starting image upload for URI:", uri);
      
      // If no URI is provided, return empty string
      if (!uri) {
        console.log("No image URI provided, skipping upload");
        return "";
      }
      
      if (!user || !user.id) {
        throw new Error('User ID is required for event image upload');
      }
      
      // Use the unified image upload service
      const onProgress = (progress: number) => {
        setUploadProgress(progress);
      };
      
      // Upload the image using the imageUploadService
      const downloadURL = await imageUploadService.uploadEventImage(
        user.id,
        uri,
        undefined, // No event ID yet
        onProgress
      );
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Provide more specific error message if available
      if (error instanceof Error) {
        throw error;
      }
      
      // Generic error if not an Error instance
      throw new Error('Failed to upload image. Please try again with a different image.');
    }
  }, [user]);

  /**
   * Reset the form to its initial state
   * @param resetFormData Function to reset form data
   * @param resetSectionComplete Function to reset section completion
   * @param setActiveSection Function to set active section
   */
  const resetForm = useCallback((
    resetFormData: (data: EventForm) => void,
    resetSectionComplete: (data: any) => void,
    setActiveSection: (section: number) => void
  ) => {
    // Reset form data to default values
    resetFormData({
      title: '',
      description: '',
      category: 'Other',
      tags: [],
      date: new Date(),
      endDate: new Date(Date.now() + 3600000),
      time: new Date(),
      endTime: new Date(Date.now() + 3600000),
      timeZone: 'UTC-05:00',
      isVirtual: false,
      buildingName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      virtualLink: '',
      capacity: '',
      registrationDeadline: null,
      isPrivate: false,
      isPaid: false,
      price: '',
      imageUri: null,
      ticketTypes: [],
      customFields: [],
      speakers: [],
      cancellationPolicy: '',
    });
    
    // Reset section completion
    resetSectionComplete({
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false
    });
    
    // Reset to first section
    setActiveSection(1);
  }, []);

  /**
   * Handle form submission
   * @param validateForm Function to validate the form
   * @param resetFormData Function to reset form data
   * @param resetSectionComplete Function to reset section completion
   * @param setActiveSection Function to set active section
   */
  const handleSubmit = useCallback(async (
    validateForm: () => boolean,
    resetFormData: (data: EventForm) => void,
    resetSectionComplete: (data: any) => void,
    setActiveSection: (section: number) => void
  ) => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
  
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to create an event');
      return;
    }
  
    try {
      setIsSubmitting(true);
  
      // Upload main image
      let mainImageUrl = null;
      try {
        if (formData.imageUri) {
          mainImageUrl = await uploadImage(formData.imageUri);
        }
      } catch (imageError) {
        console.warn('Main image upload failed:', imageError);
        
        // Provide more specific error message based on the error
        let errorMessage = 'We encountered an issue uploading your image.';
        
        if (imageError instanceof Error) {
          errorMessage = imageError.message;
        }
        
        // Ask user if they want to continue without the image or try again
        return new Promise((resolve) => {
          Alert.alert(
            'Image Upload Failed',
            `${errorMessage} Would you like to continue creating the event without an image?`,
            [
              {
                text: 'Try Again',
                style: 'cancel',
                onPress: () => {
                  setIsSubmitting(false);
                  resolve(false);
                }
              },
              {
                text: 'Continue Without Image',
                onPress: () => {
                  // Continue with event creation without the image
                  mainImageUrl = null;
                  resolve(true);
                }
              }
            ],
            { cancelable: false }
          );
        }).then(shouldContinue => {
          if (!shouldContinue) {
            return false; // Exit the function
          }
        });
      }
  
      // Format location string based on event type
      let locationString = '';
      if (formData.isVirtual) {
        locationString = 'Virtual Event';
      } else {
        locationString = `${formData.buildingName ? formData.buildingName + ', ' : ''}${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`.trim();
      }
  
      // Combine date and time for start and end
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(
        formData.time.getHours(),
        formData.time.getMinutes(),
        0,
        0
      );
  
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(
        formData.endTime.getHours(),
        formData.endTime.getMinutes(),
        0,
        0
      );
  
      // Calculate duration in milliseconds
      const duration = endDateTime.getTime() - startDateTime.getTime();
  
      // Create event data with proper handling of undefined values
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        date: startDateTime,
        time: startDateTime,
        endDate: endDateTime,
        endTime: endDateTime,
        timeZone: formData.timeZone,
        duration,
        isVirtual: formData.isVirtual,
        location: locationString,
        // Only add virtualLink if it's a virtual event AND the link exists
        ...(formData.isVirtual && formData.virtualLink ? { virtualLink: formData.virtualLink } : {}),
        // Only add locationDetails if it's not a virtual event
        ...(formData.isVirtual ? {} : {
          locationDetails: {
            buildingName: formData.buildingName.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            zipCode: formData.zipCode.trim(),
            country: formData.country.trim()
          }
        }),
        capacity: Number(formData.capacity) || 0,
        // Only add registrationDeadline if it exists
        ...(formData.registrationDeadline ? { registrationDeadline: formData.registrationDeadline } : {}),
        isPrivate: formData.isPrivate,
        isPaid: formData.isPaid,
        price: formData.isPaid && formData.ticketTypes.length === 0 ? Number(formData.price) : 0,
        ticketTypes: formData.isPaid ? formData.ticketTypes : [],
        customFields: formData.customFields,
        createdBy: user.id,
        organizerName: user.name || 'Event Host',
        createdAt: new Date(),
        // Only add imageUrl if it exists
        ...(mainImageUrl ? { imageUrl: mainImageUrl } : {}),
        // Store cancellation policy
        cancellationPolicy: formData.cancellationPolicy || '',
        // Add required fields for Event type
        privacyLevel: formData.isPrivate ? 'private' as const : 'public' as const,
        publishStatus: 'published' as const
      };

      // Now create the event with the properly formatted data
      const createdEvent = await eventService.createEvent(eventData);
  
      Alert.alert(
        'Success', 
        'Event created successfully', 
        [
          { 
            text: 'View Event', 
            onPress: () => router.push({
              pathname: "/screens/eventdetails",
              params: { id: createdEvent.id }
            })
          },
          { 
            text: 'Create Another', 
            onPress: () => {
              // Reset form
              resetForm(resetFormData, resetSectionComplete, setActiveSection);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, uploadImage, resetForm, router]);

  return {
    isSubmitting,
    uploadProgress,
    handleSubmit,
    uploadImage,
    resetForm
  };
}