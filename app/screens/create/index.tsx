/**
 * CreateEventScreen Component
 * 
 * Main container component for the event creation flow.
 * Orchestrates the multi-step form and manages shared state.
 */

import React, { useRef, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../AuthContext';
import { TicketType, CustomField, Speaker } from './types';

// Components
import { EventFormHeader } from './components/EventFormHeader';
import { EventFormProgress } from './components/EventFormProgress';
import { BasicInfoSection } from './components/sections/BasicInfoSection';
import { DateTimeSection } from './components/sections/DateTimeSection';
import { LocationSection } from './components/sections/LocationSection';
import { TicketsSection } from './components/sections/TicketsSection';
import { SpeakersSection } from './components/sections/SpeakersSection';
import { SettingsSection } from './components/sections/SettingsSection';
import { PreviewModal } from './components/modals/PreviewModal';
import { TicketModal } from './components/modals/TicketModal';
import { DatePickerModal } from './components/modals/DatePickerModal';
import { CustomFieldModal } from './components/modals/CustomFieldModal';
import { SpeakerModal } from './components/modals/SpeakerModal';

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
  
  // Local state for modals
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<TicketType | undefined>(undefined);
  
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [currentField, setCurrentField] = useState<CustomField | undefined>(undefined);
  
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | undefined>(undefined);
  
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | 'deadline'>('start');
  const [datePickerCallback, setDatePickerCallback] = useState<(date: Date) => void>(() => {});
  
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
    // Date & Time picker states
    showDatePicker,
    showEndDatePicker,
    showTimePicker,
    showEndTimePicker,
    showDeadlinePicker,
    currentPickerMode,
    setShowDatePicker,
    setShowEndDatePicker,
    setShowTimePicker,
    setShowEndTimePicker,
    setShowDeadlinePicker,
    setCurrentPickerMode,
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
      {/* Status Bar Spacer to fix layout extending to top of screen */}
      <View style={{
        height: Platform.OS === 'ios' ? 50 : 30,
        backgroundColor: '#FFFFFF'
      }} />
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
        {activeSection === 2 && (
          <DateTimeSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
            showDatePickerModal={(mode, callback) => {
              setDatePickerMode(mode);
              setDatePickerCallback(() => callback);
              if (mode === 'start') {
                setShowDatePicker(true);
              } else if (mode === 'end') {
                setShowEndDatePicker(true);
              }
            }}
          />
        )}
        
        {activeSection === 3 && (
          <LocationSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
          />
        )}
        
        {activeSection === 4 && (
          <TicketsSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
            showDeadlinePicker={showDeadlinePicker}
            setShowDeadlinePicker={setShowDeadlinePicker}
            showTicketModal={() => setShowTicketModal(true)}
            setCurrentTicket={setCurrentTicket}
          />
        )}
        
        {activeSection === 5 && (
          <SpeakersSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
            handleImageSelected={handleImageSelected}
            showSpeakerModal={() => setShowSpeakerModal(true)}
            setCurrentSpeaker={setCurrentSpeaker}
          />
        )}
        
        {activeSection === 6 && (
          <SettingsSection
            formData={formData}
            formErrors={formErrors}
            updateFormData={updateFormData}
            navigateSection={navigateSection}
            isSubmitting={isSubmitting}
            submitForm={submitForm}
            showCustomFieldModal={() => setShowCustomFieldModal(true)}
            setCurrentField={setCurrentField}
          />
        )}
      </ScrollView>
      
      {/* Preview Modal */}
      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        eventData={formData}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
      />
      
      {/* Ticket Modal */}
      <TicketModal
        visible={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setCurrentTicket(undefined);
        }}
        ticket={currentTicket}
        onSave={(ticket) => {
          if (currentTicket) {
            // Update existing ticket
            const updatedTickets = formData.ticketTypes.map(t =>
              t.id === ticket.id ? ticket : t
            );
            updateFormData({ ticketTypes: updatedTickets });
          } else {
            // Add new ticket
            updateFormData({
              ticketTypes: [...formData.ticketTypes, ticket],
              price: '' // Clear single price when adding ticket types
            });
          }
        }}
        isSubmitting={isSubmitting}
      />
      
      {/* Custom Field Modal */}
      <CustomFieldModal
        visible={showCustomFieldModal}
        onClose={() => {
          setShowCustomFieldModal(false);
          setCurrentField(undefined);
        }}
        field={currentField}
        onSave={(field) => {
          if (currentField) {
            // Update existing field
            const updatedFields = formData.customFields.map(f =>
              f.id === field.id ? field : f
            );
            updateFormData({ customFields: updatedFields });
          } else {
            // Add new field
            updateFormData({
              customFields: [...formData.customFields, field]
            });
          }
        }}
        isSubmitting={isSubmitting}
      />
      
      {/* Speaker Modal */}
      <SpeakerModal
        visible={showSpeakerModal}
        onClose={() => {
          setShowSpeakerModal(false);
          setCurrentSpeaker(undefined);
        }}
        speaker={currentSpeaker}
        onSave={(speaker) => {
          if (currentSpeaker) {
            // Update existing speaker
            const updatedSpeakers = formData.speakers.map(s =>
              s.id === speaker.id ? speaker : s
            );
            updateFormData({ speakers: updatedSpeakers });
          } else {
            // Add new speaker
            updateFormData({
              speakers: [...formData.speakers, speaker]
            });
          }
        }}
        isSubmitting={isSubmitting}
      />
    </KeyboardAvoidingView>
  );
}