/**
 * Container styles for the Event Creation flow
 * Includes styles for the main container, header, and progress indicator
 */

import { StyleSheet, Platform } from 'react-native';

const containerStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background to match Home.tsx
  },
  scrollContent: {
    paddingBottom: 50,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: 'transparent', // Transparent to show gradient
    borderBottomWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 191, 166, 0.2)', // Light teal background
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#00BFA6', // Primary teal color
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Progress indicator styles
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 16,
    borderBottomWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#00BFA6', // Updated to primary teal color
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeStep: {
    backgroundColor: '#00BFA6', // Updated to primary teal color
    borderColor: '#00BFA6', // Updated to primary teal color
  },
  completedStep: {
    backgroundColor: '#009688', // Primary dark teal color
    borderColor: '#009688', // Primary dark teal color
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Section styles
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Location container
  locationContainer: {
    borderRadius: 10,
    padding: 0,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default containerStyles;