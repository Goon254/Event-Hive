/**
 * EventFormProgress Component
 * 
 * Displays the progress bar and step indicators for the multi-step form.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SectionCompletion } from '../types';
import { SECTION_NAMES } from '../constants';
import styles from '../styles';

interface EventFormProgressProps {
  /** Current active section */
  activeSection: number;
  
  /** Object tracking which sections are complete */
  sectionComplete: SectionCompletion;
  
  /** Callback to set the active section */
  setActiveSection: (section: number) => void;
  
  /** Total number of sections */
  totalSections?: number;
}

/**
 * Displays the progress bar and step indicators for the multi-step form
 * 
 * @example
 * <EventFormProgress 
 *   activeSection={activeSection} 
 *   sectionComplete={sectionComplete}
 *   setActiveSection={setActiveSection}
 * />
 */
export function EventFormProgress({
  activeSection,
  sectionComplete,
  setActiveSection,
  totalSections = 6,
}: EventFormProgressProps) {
  /**
   * Handle step circle click to navigate to that section
   * @param step The section number to navigate to
   */
  const handleStepClick = (step: number) => {
    // Only allow navigation to completed sections or current section
    if (step <= activeSection || sectionComplete[step as keyof typeof sectionComplete]) {
      setActiveSection(step);
    } else {
      Alert.alert('Complete the current section first', 'Please complete the current section before moving ahead.');
    }
  };
  
  return (
    <View style={styles.progressContainer}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(activeSection / totalSections) * 100}%` }
          ]} 
        />
      </View>
      
      {/* Step circles */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSections }, (_, i) => i + 1).map((step) => (
          <TouchableOpacity 
            key={step}
            style={[
              styles.stepCircle,
              activeSection >= step && styles.activeStep,
              sectionComplete[step as keyof typeof sectionComplete] && styles.completedStep
            ]}
            onPress={() => handleStepClick(step)}
            accessibilityLabel={`Section ${step}: ${SECTION_NAMES[step as keyof typeof SECTION_NAMES]}`}
            accessibilityHint={
              sectionComplete[step as keyof typeof sectionComplete] 
                ? "Completed section" 
                : step === activeSection 
                  ? "Current section" 
                  : "Incomplete section"
            }
          >
            {sectionComplete[step as keyof typeof sectionComplete] ? (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            ) : (
              <Text 
                style={[
                  styles.stepNumber,
                  activeSection >= step && styles.activeStepNumber
                ]}
              >
                {step}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Section label */}
      <View style={styles.stepLabelContainer}>
        <Text style={styles.stepLabel}>
          {SECTION_NAMES[activeSection as keyof typeof SECTION_NAMES]}
        </Text>
      </View>
    </View>
  );
}