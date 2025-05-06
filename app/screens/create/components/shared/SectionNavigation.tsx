/**
 * SectionNavigation Component
 * 
 * A reusable component for navigating between form sections with next/back buttons.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationDirection } from '../../types';
import styles from '../../styles';

interface SectionNavigationProps {
  /** Current section number */
  currentSection: number;
  
  /** Total number of sections */
  totalSections: number;
  
  /** Callback for navigation */
  onNavigate: (direction: NavigationDirection) => void;
  
  /** Whether the form is being submitted */
  isSubmitting?: boolean;
  
  /** Whether to show the submit button instead of next (for last section) */
  showSubmitButton?: boolean;
  
  /** Callback for form submission */
  onSubmit?: () => void;
}

/**
 * A component for navigating between form sections
 * 
 * @example
 * <SectionNavigation
 *   currentSection={activeSection}
 *   totalSections={6}
 *   onNavigate={navigateSection}
 *   showSubmitButton={activeSection === 6}
 *   onSubmit={handleSubmit}
 * />
 */
export function SectionNavigation({
  currentSection,
  totalSections,
  onNavigate,
  isSubmitting = false,
  showSubmitButton = false,
  onSubmit,
}: SectionNavigationProps) {
  const isFirstSection = currentSection === 1;
  const isLastSection = currentSection === totalSections;
  
  return (
    <View style={styles.sectionNavigation}>
      {/* Back button (hidden on first section) */}
      {!isFirstSection ? (
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => onNavigate('previous')}
          disabled={isSubmitting}
          accessibilityLabel="Previous section"
          accessibilityHint="Go back to the previous section"
        >
          <MaterialIcons name="arrow-back-ios" size={16} color="#FFFFFF" />
          <Text style={styles.prevButtonText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 100 }} /> // Empty space for alignment
      )}
      
      {/* Next or Submit button */}
      {showSubmitButton && onSubmit ? (
        <TouchableOpacity 
          style={styles.createEventButton}
          onPress={onSubmit}
          disabled={isSubmitting}
          accessibilityLabel="Create event"
          accessibilityHint="Submit the form and create the event"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.createEventButtonText}>Create Event</Text>
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => onNavigate('next')}
          disabled={isSubmitting}
          accessibilityLabel="Next section"
          accessibilityHint="Continue to the next section"
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}