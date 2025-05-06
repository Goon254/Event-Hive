// app/(tabs)/create.tsx
import React, { useRef, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { TicketType, CustomField, Speaker } from '../screens/create/types';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/common/ScreenWrapper';

// Components
import { EventFormHeader } from '../screens/create/components/EventFormHeader';
import { EventFormProgress } from '../screens/create/components/EventFormProgress';
import { BasicInfoSection } from '../screens/create/components/sections/BasicInfoSection';
import { DateTimeSection } from '../screens/create/components/sections/DateTimeSection';
import { LocationSection } from '../screens/create/components/sections/LocationSection';
import { TicketsSection } from '../screens/create/components/sections/TicketsSection';
import { SpeakersSection } from '../screens/create/components/sections/SpeakersSection';
import { SettingsSection } from '../screens/create/components/sections/SettingsSection';
import { PreviewModal } from '../screens/create/components/modals/PreviewModal';
import { TicketModal } from '../screens/create/components/modals/TicketModal';
import { CustomFieldModal } from '../screens/create/components/modals/CustomFieldModal';
import { SpeakerModal } from '../screens/create/components/modals/SpeakerModal';

// Hooks
import { useEventForm } from '../screens/create/hooks/useEventForm';
import { useEventSubmission } from '../screens/create/hooks/useEventSubmission';

// Styles
import styles from '../screens/create/styles';

/**
 * Create Event Tab Component
 * Embedded directly in the tab layout to avoid navigation issues
 */
export default function CreateTab() {
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
  
  // Handle back button press
  const handleGoBack = () => {
    // Navigate to Home tab
    router.navigate('/(tabs)/Home');
  };

  return (
    <ScreenWrapper
      header={{ hidden: true }}
      backgroundColor="transparent"
      statusBarStyle="light-content"
      contentContainerStyle={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ImageBackground
          source={require('../../assets/images/tropical-gradient.png')}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
          {/* Header */}
          <EventFormHeader
            router={router}
            isSubmitting={isSubmitting}
            onPreviewPress={() => setShowPreview(true)}
            onBackPress={handleGoBack}
          />
      
          {/* Progress Indicator */}
          <EventFormProgress
            activeSection={activeSection}
            sectionComplete={sectionComplete}
            setActiveSection={setActiveSection}
          />
          
          {/* Form Sections */}
          <ScrollView
            style={[styles.container, { backgroundColor: 'transparent' }]}
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
        </ImageBackground>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}