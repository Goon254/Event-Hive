/**
 * LocationSection Component
 * 
 * Third section of the event creation form for location information.
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { EventForm, FormErrors, NavigationDirection } from '../../types';
import { COUNTRIES } from '../../constants';
import { FormField } from '../shared/FormField';
import { SectionNavigation } from '../shared/SectionNavigation';
import styles from '../../styles';

// US States
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 
  'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'District of Columbia', 'Puerto Rico', 'U.S. Virgin Islands', 'American Samoa', 'Guam', 
  'Northern Mariana Islands'
];

// Canadian Provinces
const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

interface LocationSectionProps {
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
}

/**
 * Third section of the event creation form for location information
 */
export function LocationSection({
  formData,
  formErrors,
  updateFormData,
  navigateSection,
  isSubmitting,
}: LocationSectionProps) {
  
  /**
   * Toggle between in-person and virtual event
   */
  const toggleEventType = (isVirtual: boolean) => {
    updateFormData({ isVirtual });
  };
  
  /**
   * Get the appropriate state/province list based on the selected country
   */
  const getStatesList = () => {
    if (formData.country === 'United States') {
      return US_STATES;
    } else if (formData.country === 'Canada') {
      return CANADIAN_PROVINCES;
    }
    return [];
  };
  
  /**
   * Get the label for the state/province field based on the selected country
   */
  const getStateFieldLabel = () => {
    if (formData.country === 'United States') {
      return 'State';
    } else if (formData.country === 'Canada') {
      return 'Province';
    }
    return 'State/Province';
  };
  
  /**
   * Get the label for the postal code field based on the selected country
   */
  const getPostalCodeLabel = () => {
    if (formData.country === 'United States') {
      return 'ZIP Code';
    }
    return 'Postal Code';
  };
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      {/* Event Type Toggle */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Type</Text>
        <View style={styles.eventTypeContainer}>
          <View 
            style={[
              styles.eventTypeButton, 
              !formData.isVirtual && styles.selectedEventType
            ]}
          >
            <Switch
              value={!formData.isVirtual}
              onValueChange={(value) => toggleEventType(!value)}
              disabled={isSubmitting}
            />
            <Text 
              style={[
                styles.eventTypeText, 
                !formData.isVirtual && styles.selectedEventTypeText
              ]}
            >
              In-Person
            </Text>
          </View>
          <View 
            style={[
              styles.eventTypeButton, 
              formData.isVirtual && styles.selectedEventType
            ]}
          >
            <Switch
              value={formData.isVirtual}
              onValueChange={(value) => toggleEventType(value)}
              disabled={isSubmitting}
            />
            <Text 
              style={[
                styles.eventTypeText, 
                formData.isVirtual && styles.selectedEventTypeText
              ]}
            >
              Virtual
            </Text>
          </View>
        </View>
      </View>
      
      {/* In-Person Event Fields */}
      {!formData.isVirtual && (
        <>
          <FormField
            label="Building/Venue Name"
            value={formData.buildingName}
            onChangeText={(text) => updateFormData({ buildingName: text })}
            placeholder="Enter the name of the venue"
            disabled={isSubmitting}
          />
          
          <FormField
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateFormData({ address: text })}
            placeholder="Enter the street address"
            error={formErrors.address}
            required={true}
            disabled={isSubmitting}
          />
          
          <FormField
            label="City"
            value={formData.city}
            onChangeText={(text) => updateFormData({ city: text })}
            placeholder="Enter the city"
            error={formErrors.city}
            required={true}
            disabled={isSubmitting}
          />
          
          {/* Country Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Country<Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.country}
                onValueChange={(itemValue) => updateFormData({ country: itemValue, state: '' })}
                enabled={!isSubmitting}
                style={styles.picker}
              >
                {COUNTRIES.map((country) => (
                  <Picker.Item key={country} label={country} value={country} />
                ))}
              </Picker>
            </View>
            {formErrors.country && (
              <Text style={styles.errorText}>{formErrors.country}</Text>
            )}
          </View>
          
          {/* State/Province Selection - Only for US and Canada */}
          {(formData.country === 'United States' || formData.country === 'Canada') && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {getStateFieldLabel()}<Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.state}
                  onValueChange={(itemValue) => updateFormData({ state: itemValue })}
                  enabled={!isSubmitting}
                  style={styles.picker}
                >
                  <Picker.Item label={`Select ${getStateFieldLabel()}`} value="" />
                  {getStatesList().map((state) => (
                    <Picker.Item key={state} label={state} value={state} />
                  ))}
                </Picker>
              </View>
              {formErrors.state && (
                <Text style={styles.errorText}>{formErrors.state}</Text>
              )}
            </View>
          )}
          
          {/* ZIP/Postal Code - Required for US */}
          <FormField
            label={getPostalCodeLabel()}
            value={formData.zipCode}
            onChangeText={(text) => updateFormData({ zipCode: text })}
            placeholder={`Enter ${getPostalCodeLabel()}`}
            error={formErrors.zipCode}
            required={formData.country === 'United States'}
            disabled={isSubmitting}
          />
        </>
      )}
      
      {/* Virtual Event Fields */}
      {formData.isVirtual && (
        <FormField
          label="Virtual Event Link"
          value={formData.virtualLink}
          onChangeText={(text) => updateFormData({ virtualLink: text })}
          placeholder="Enter the URL for your virtual event"
          error={formErrors.virtualLink}
          required={true}
          disabled={isSubmitting}
          helperText="This can be a Zoom, Google Meet, or any other virtual meeting link"
        />
      )}
      
      {/* Navigation Buttons */}
      <SectionNavigation
        currentSection={3}
        totalSections={6}
        onNavigate={navigateSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}