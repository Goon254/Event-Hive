/**
 * EventFormHeader Component
 * 
 * Header component for the event creation form with back button and preview button.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../styles';

interface EventFormHeaderProps {
  /** Router object for navigation */
  router: any;
  
  /** Whether the form is being submitted */
  isSubmitting?: boolean;
  
  /** Callback for preview button press */
  onPreviewPress: () => void;
  
  /** Title to display in the header */
  title?: string;
}

/**
 * Header component for the event creation form
 * 
 * @example
 * <EventFormHeader 
 *   router={router} 
 *   isSubmitting={isSubmitting} 
 *   onPreviewPress={() => setShowPreview(true)} 
 * />
 */
export function EventFormHeader({
  router,
  isSubmitting = false,
  onPreviewPress,
  title = 'Create Event',
}: EventFormHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        disabled={isSubmitting}
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <TouchableOpacity
        onPress={onPreviewPress}
        disabled={isSubmitting}
        accessibilityLabel="Preview event"
        style={styles.previewButton}
      >
        <Text style={styles.previewButtonText}>Preview</Text>
      </TouchableOpacity>
    </View>
  );
}