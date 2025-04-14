/**
 * SettingsSection Component
 * 
 * Sixth section of the event creation form for event settings and policies.
 */

import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EventForm, FormErrors, NavigationDirection, CustomField } from '../../types';
import { FormField } from '../shared/FormField';
import { SectionNavigation } from '../shared/SectionNavigation';
import styles from '../../styles';

interface SettingsSectionProps {
  /** Form data */
  formData: EventForm;
  
  /** Form validation errors */
  formErrors: FormErrors;
  
  /** Function to update form data */
  updateFormData: (updates: Partial<EventForm>) => void;
  
  /** Function to navigate between sections */
  navigateSection: (direction: NavigationDirection) => void;
  
  /** Whether the form is being submitted */
  isSubmitting: boolean;
  
  /** Function to submit the form */
  submitForm: () => void;
  
  /** Function to show the custom field modal */
  showCustomFieldModal: () => void;
  
  /** Function to set the current custom field for editing */
  setCurrentField: (field?: CustomField) => void;
}

/**
 * Sixth section of the event creation form for event settings and policies
 */
export function SettingsSection({
  formData,
  formErrors,
  updateFormData,
  navigateSection,
  isSubmitting,
  submitForm,
  showCustomFieldModal,
  setCurrentField,
}: SettingsSectionProps) {
  /**
   * Toggle event privacy
   */
  const togglePrivacy = (isPrivate: boolean) => {
    updateFormData({ isPrivate });
  };
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings & Policies</Text>
      
      {/* Event Privacy */}
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>Private Event</Text>
          <Text style={styles.settingDescription}>
            Private events are only visible to invited guests and won't appear in search results or public listings.
          </Text>
        </View>
        <Switch
          value={formData.isPrivate}
          onValueChange={togglePrivacy}
          disabled={isSubmitting}
        />
      </View>
      
      {/* Cancellation Policy */}
      <View style={styles.formGroup}>
        <FormField
          label="Cancellation Policy"
          value={formData.cancellationPolicy}
          onChangeText={(text) => updateFormData({ cancellationPolicy: text })}
          placeholder="Describe your cancellation and refund policy..."
          multiline={true}
          numberOfLines={5}
          disabled={isSubmitting}
          helperText="Let attendees know under what conditions refunds will be provided if the event is cancelled."
        />
      </View>
      
      {/* Custom Fields */}
      <View style={styles.formGroup}>
        <View style={styles.customFieldsHeader}>
          <Text style={styles.customFieldsTitle}>
            Registration Form Fields
          </Text>
          <TouchableOpacity
            style={styles.addFieldButton}
            onPress={() => {
              setCurrentField(undefined);
              showCustomFieldModal();
            }}
            disabled={isSubmitting}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addFieldText}>Add Field</Text>
          </TouchableOpacity>
        </View>
        
        {formData.customFields.length === 0 ? (
          <Text style={styles.noCustomFieldsText}>
            No custom fields added. Add fields to collect additional information from attendees.
          </Text>
        ) : (
          <View>
            {/* Custom fields list would go here */}
          </View>
        )}
      </View>
      
      {/* Terms & Conditions */}
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>Terms & Conditions</Text>
          <Text style={styles.settingDescription}>
            By creating this event, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // TODO: Show terms and conditions
            alert('Terms and conditions will be displayed here.');
          }}
          disabled={isSubmitting}
        >
          <MaterialIcons name="arrow-forward-ios" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      {/* Navigation Buttons with Submit */}
      <View style={styles.sectionNavigation}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
          disabled={isSubmitting}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: '#059669' }]}
          onPress={submitForm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.nextButtonText}>Submitting...</Text>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Create Event</Text>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}