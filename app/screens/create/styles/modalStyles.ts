/**
 * Modal styles for the Event Creation flow
 * Includes styles for all modals: date picker, ticket, custom field, speaker
 */

import { StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions directly to avoid circular dependency
const { height } = Dimensions.get('window');

const modalStyles = StyleSheet.create({
  // Common modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E', // Dark background for modals
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D', // Darker border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCancel: {
    fontSize: 16,
    color: '#9CA3AF', // Lighter gray for dark mode
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFA6', // Updated to primary teal color
  },
  modalBody: {
    padding: 16,
  },
  
  // Specific modal content containers
  ticketModalContent: {
    backgroundColor: '#1E1E1E', // Dark background for modals
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.7,
  },
  fieldModalContent: {
    backgroundColor: '#1E1E1E', // Dark background for modals
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.6,
  },
  speakerModalContent: {
    backgroundColor: '#1E1E1E', // Dark background for modals
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.8,
  },
});

export default modalStyles;