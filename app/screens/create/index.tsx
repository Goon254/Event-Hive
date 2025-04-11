/**
 * CreateEventScreen Component
 * 
 * Main container component for the event creation flow.
 * Orchestrates the multi-step form and manages shared state.
 */

import React, { useRef, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../AuthContext';

// Components
import { EventFormHeader } from './components/EventFormHeader';
import { EventFormProgress } from './components/EventFormProgress';
import { BasicInfoSection } from './components/sections/BasicInfoSection';

// Hooks
import { useEventForm } from './hooks/useEventForm';
import { useEventSubmission } from './hooks/useEventSubmission';

// Styles
import styles from './styles';

/**
 * Main container component for the event creation flow
 * Manages form state and orchestrates the multi-step form
 */
export default function CreateEventScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Initialize form state and validation
  const {
    formData,
    formErrors,
    activeSection,
    sectionComplete,
    updateFormData,
    validateSection,
    validateForm,
    navigateSection,
    setActiveSection,
    setFormData,
    setSectionComplete,
    handleImageSelected,
    showPreview,
    setShowPreview,
    // Other form state and functions...
  } = useEventForm();
  
  // Initialize submission handling
  const {
    isSubmitting,
    handleSubmit,
    uploadProgress,
  } = useEventSubmission(formData, user, router);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading, router]);
  
  // Handle form submission
  const submitForm = () => {
    handleSubmit(validateForm, setFormData, setSectionComplete, setActiveSection);
  };
  
  // Scroll to top when changing sections
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  }, [activeSection]);
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <EventFormHeader 
        router={router} 
        isSubmitting={isSubmitting} 
        onPreviewPress={() => setShowPreview(true)} 
      />
      
      {/* Progress Indicator */}
      <EventFormProgress 
        activeSection={activeSection} 
        sectionComplete={sectionComplete}
        setActiveSection={setActiveSection}
      />
      
      {/* Form Sections */}
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        {/* Render the active section */}
        {activeSection === 1 && (
          <BasicInfoSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            handleImageSelected={handleImageSelected}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
          />
        )}
        
        {/* 
          TODO: Implement and add other sections:
          - DateTimeSection (section 2)
          - LocationSection (section 3)
          - TicketsSection (section 4)
          - SpeakersSection (section 5)
          - SettingsSection (section 6)
        */}
      </ScrollView>
      
      {/* 
        TODO: Implement and add modals:
        - DatePickerModal
        - TicketModal
        - CustomFieldModal
        - SpeakerModal
        - PreviewModal
      */}
    </KeyboardAvoidingView>
  );
}