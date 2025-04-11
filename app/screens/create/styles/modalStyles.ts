/**
 * Modal styles for the Event Creation flow
 * Includes styles for all modals: date picker, ticket, custom field, speaker
 */

import { StyleSheet } from 'react-native';
import { dimensions } from './index';

const { height } = dimensions;

const modalStyles = StyleSheet.create({
  // Common modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalBody: {
    padding: 16,
  },
  
  // Specific modal content containers
  ticketModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.7,
  },
  fieldModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.6,
  },
  speakerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.8,
  },
});

export default modalStyles;