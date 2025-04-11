/**
 * Container styles for the Event Creation flow
 * Includes styles for the main container, header, and progress indicator
 */

import { StyleSheet, Platform } from 'react-native';

const containerStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Progress indicator styles
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  completedStep: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    color: '#1F2937',
  },
  
  // Section styles
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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