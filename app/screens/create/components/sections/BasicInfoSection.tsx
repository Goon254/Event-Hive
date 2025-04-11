/**
 * BasicInfoSection Component
 * 
 * First section of the event creation form for basic event information.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { EventForm, FormErrors, NavigationDirection } from '../../types';
import { EVENT_CATEGORIES } from '../../constants';
import { FormField } from '../shared/FormField';
import { TagInput } from '../shared/TagInput';
import { SectionNavigation } from '../shared/SectionNavigation';
import ImageUpload from '../../../../container/events/ImageUpload';
import styles from '../../styles';

interface BasicInfoSectionProps {
  /** Form data */
  formData: EventForm;
  
  /** Form validation errors */
  formErrors: FormErrors;
  
  /** Function to update form data */
  updateFormData: (updates: Partial<EventForm>) => void;
  
  /** Function to handle image selection */
  handleImageSelected: (uri: string) => void;
  
  /** Function to navigate between sections */
  navigateSection: (direction: NavigationDirection) => void;
  
  /** Whether the form is being submitted */
  isSubmitting: boolean;
  
  /** Function to add a new tag */
  addTag?: () => void;
  
  /** Function to remove a tag */
  removeTag?: (tag: string) => void;
  
  /** Current tag input value */
  newTag?: string;
  
  /** Function to update tag input value */
  setNewTag?: (value: string) => void;
}

/**
 * First section of the event creation form for basic event information
 * 
 * @example
 * <BasicInfoSection
 *   formData={formData}
 *   formErrors={formErrors}
 *   updateFormData={updateFormData}
 *   handleImageSelected={handleImageSelected}
 *   navigateSection={navigateSection}
 *   isSubmitting={isSubmitting}
 * />
 */
export function BasicInfoSection({
  formData,
  formErrors,
  updateFormData,
  handleImageSelected,
  navigateSection,
  isSubmitting,
  addTag,
  removeTag,
  newTag,
  setNewTag,
}: BasicInfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Event Information</Text>
      
      {/* Event Image */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Image</Text>
        <Text style={styles.helperText}>
          This will be the main image displayed for your event
        </Text>
        <ImageUpload
          onImageSelected={handleImageSelected}
          initialImage={formData.imageUri || undefined}
        />
      </View>

      {/* Event Title */}
      <FormField
        label="Event Title"
        value={formData.title}
        onChangeText={(text) => updateFormData({ title: text })}
        placeholder="Enter a clear, descriptive title"
        error={formErrors.title}
        required={true}
        maxLength={70}
        disabled={isSubmitting}
        accessibilityLabel="Event title input"
      />

      {/* Event Description */}
      <FormField
        label="Event Description"
        value={formData.description}
        onChangeText={(text) => updateFormData({ description: text })}
        placeholder="Enter a detailed description of your event..."
        error={formErrors.description}
        required={true}
        multiline={true}
        numberOfLines={6}
        disabled={isSubmitting}
        helperText="Describe what attendees can expect at your event"
      />

      {/* Event Category */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Event Category<Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(itemValue) => updateFormData({ category: itemValue })}
            enabled={!isSubmitting}
            style={styles.picker}
          >
            {EVENT_CATEGORIES.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Event Tags */}
      <TagInput
        tags={formData.tags}
        onTagsChange={(tags) => updateFormData({ tags })}
        label="Event Tags"
        helperText="Add relevant keywords to help users find your event"
        error={formErrors.tags}
        disabled={isSubmitting}
      />
      
      {/* Navigation Buttons */}
      <SectionNavigation
        currentSection={1}
        totalSections={6}
        onNavigate={navigateSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}