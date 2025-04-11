/**
 * Form styles for the Event Creation flow
 * Includes styles for form elements, inputs, tags, and specialized form components
 */

import { StyleSheet } from 'react-native';

const formStyles = StyleSheet.create({
  // Form element styles
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1F2937',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  
  // Tags input styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    marginRight: 8,
  },
  tagAddButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Date picker styles
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#1F2937',
  },
  
  // Event type selector styles
  eventTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eventTypeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  selectedEventType: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  eventTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedEventTypeText: {
    color: '#3B82F6',
  },
  
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  
  // Ticket styles
  ticketsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addTicketButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTicketText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  ticketsList: {
    marginBottom: 16,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  ticketQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ticketActions: {
    flexDirection: 'row',
  },
  editTicketButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeTicketButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Price input styles
  singlePriceContainer: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 15,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  
  // Custom fields styles
  customFieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customFieldsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addFieldButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFieldText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  customFieldsList: {
    marginBottom: 16,
  },
  customFieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customFieldInfo: {
    flex: 1,
  },
  customFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customFieldDetails: {
    flexDirection: 'row',
  },
  customFieldType: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  customFieldRequired: {
    fontSize: 14,
    color: '#6B7280',
  },
  customFieldOptions: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  customFieldActions: {
    flexDirection: 'row',
  },
  editFieldButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeFieldButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCustomFieldsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  
  // Speakers styles
  speakersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  speakersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addSpeakerButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSpeakerText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  speakersList: {
    marginBottom: 16,
  },
  speakerItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  speakerImageContainer: {
    marginRight: 12,
  },
  speakerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  speakerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerImagePlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  speakerRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  speakerBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  speakerActions: {
    flexDirection: 'row',
  },
  editSpeakerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeSpeakerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSpeakersText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Options for custom fields
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    color: '#4B5563',
    marginRight: 4,
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    marginRight: 8,
  },
  addOptionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Speaker image upload
  speakerImageUpload: {
    alignItems: 'center',
    marginBottom: 24,
  },
});

export default formStyles;