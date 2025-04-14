/**
 * DateTimeSection Component
 * 
 * Second section of the event creation form for date and time information.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { EventForm, FormErrors, NavigationDirection } from '../../types';
import { TIME_ZONES } from '../../constants';
import { SectionNavigation } from '../shared/SectionNavigation';
import styles from '../../styles';

interface DateTimeSectionProps {
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
  
  /** Function to show the date picker modal */
  showDatePickerModal: (mode: 'start' | 'end', callback: (date: Date) => void) => void;
}

/**
 * Second section of the event creation form for date and time information
 */
export function DateTimeSection({
  formData,
  formErrors,
  updateFormData,
  navigateSection,
  isSubmitting,
  showDatePickerModal,
}: DateTimeSectionProps) {
  
  /**
   * Handle start date and time selection
   */
  const handleStartDateTimeSelect = () => {
    showDatePickerModal('start', (selectedDate) => {
      updateFormData({
        date: selectedDate,
        time: selectedDate
      });
    });
  };
  
  /**
   * Handle end date and time selection
   */
  const handleEndDateTimeSelect = () => {
    showDatePickerModal('end', (selectedDate) => {
      updateFormData({
        endDate: selectedDate,
        endTime: selectedDate
      });
    });
  };
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Date & Time</Text>
      
      {/* Error message if any */}
      {formErrors.date && (
        <Text style={styles.errorText}>{formErrors.date}</Text>
      )}
      {formErrors.time && (
        <Text style={styles.errorText}>{formErrors.time}</Text>
      )}
      
      {/* Start Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Start Date<Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={handleStartDateTimeSelect}
          disabled={isSubmitting}
        >
          <Text style={styles.dateButtonText}>
            {format(formData.date, 'EEEE, MMMM d, yyyy')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Start Time */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Start Time<Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={handleStartDateTimeSelect}
          disabled={isSubmitting}
        >
          <Text style={styles.dateButtonText}>
            {format(formData.time, 'h:mm a')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* End Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          End Date<Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={handleEndDateTimeSelect}
          disabled={isSubmitting}
        >
          <Text style={styles.dateButtonText}>
            {format(formData.endDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* End Time */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          End Time<Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={handleEndDateTimeSelect}
          disabled={isSubmitting}
        >
          <Text style={styles.dateButtonText}>
            {format(formData.endTime, 'h:mm a')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Time Zone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Time Zone<Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.timeZone}
            onValueChange={(itemValue) => updateFormData({ timeZone: itemValue })}
            enabled={!isSubmitting}
            style={styles.picker}
          >
            {TIME_ZONES.map((timeZone) => (
              <Picker.Item key={timeZone} label={timeZone} value={timeZone} />
            ))}
          </Picker>
        </View>
      </View>
      
      {/* Navigation Buttons */}
      <SectionNavigation
        currentSection={2}
        totalSections={6}
        onNavigate={navigateSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}