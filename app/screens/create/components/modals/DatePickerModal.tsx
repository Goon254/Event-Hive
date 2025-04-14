/**
 * DatePickerModal Component
 * 
 * Modal for selecting dates and times with calendar interface and validation.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, isAfter, isBefore, isEqual } from 'date-fns';
import styles from '../../styles';

interface DatePickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Initial date value */
  initialDate: Date;
  
  /** Function to save the selected date */
  onSave: (date: Date) => void;
  
  /** Whether this is for a deadline (optional) */
  isDeadline?: boolean;
  
  /** Minimum allowed date (optional) */
  minDate?: Date;
  
  /** Maximum allowed date (optional) */
  maxDate?: Date;
  
  /** Title for the modal */
  title?: string;
  
  /** Whether to show time picker */
  showTime?: boolean;
  
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * Modal for selecting dates and times with calendar interface
 */
export function DatePickerModal({
  visible,
  onClose,
  initialDate,
  onSave,
  isDeadline = false,
  minDate,
  maxDate,
  title = 'Select Date',
  showTime = true,
  isSubmitting = false
}: DatePickerModalProps) {
  // Local state for date and time
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [showPicker, setShowPicker] = useState<boolean>(false);
  
  // Reset selected date when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate || new Date());
    }
  }, [visible, initialDate]);
  
  /**
   * Handle date change
   */
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      // If we're changing the date, preserve the time
      if (mode === 'date') {
        const newDate = new Date(date);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setSelectedDate(newDate);
        
        // On Android, we need to show the time picker separately
        if (Platform.OS === 'android' && showTime) {
          setMode('time');
          setShowPicker(true);
        }
      } else {
        // If we're changing the time, preserve the date
        const newDate = new Date(selectedDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setSelectedDate(newDate);
      }
    }
  };
  
  /**
   * Show date picker
   */
  const showDatePicker = () => {
    setMode('date');
    setShowPicker(true);
  };
  
  /**
   * Show time picker
   */
  const showTimePicker = () => {
    setMode('time');
    setShowPicker(true);
  };
  
  /**
   * Handle save
   */
  const handleSave = () => {
    // Validate date if needed
    if (minDate && isBefore(selectedDate, minDate) && !isEqual(selectedDate, minDate)) {
      alert(`Date must be on or after ${format(minDate, 'MMMM d, yyyy')}`);
      return;
    }
    
    if (maxDate && isAfter(selectedDate, maxDate) && !isEqual(selectedDate, maxDate)) {
      alert(`Date must be on or before ${format(maxDate, 'MMMM d, yyyy')}`);
      return;
    }
    
    onSave(selectedDate);
    onClose();
  };
  
  /**
   * Quick date selection options
   */
  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'Next Week', date: addDays(new Date(), 7) },
    { label: 'Next Month', date: addDays(new Date(), 30) },
  ];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* Modal Body */}
          <ScrollView style={styles.modalBody}>
            {/* Selected Date Display */}
            <View style={localStyles.selectedDateContainer}>
              <Text style={localStyles.selectedDateLabel}>Selected Date & Time</Text>
              <Text style={localStyles.selectedDateValue}>
                {format(selectedDate, showTime ? 'EEEE, MMMM d, yyyy h:mm a' : 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
            
            {/* Quick Date Selection */}
            <View style={localStyles.quickOptionsContainer}>
              <Text style={localStyles.quickOptionsTitle}>Quick Select</Text>
              <View style={localStyles.quickOptions}>
                {quickDateOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={localStyles.quickOption}
                    onPress={() => {
                      const newDate = new Date(option.date);
                      newDate.setHours(selectedDate.getHours());
                      newDate.setMinutes(selectedDate.getMinutes());
                      setSelectedDate(newDate);
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={localStyles.quickOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Date Picker Button */}
            <TouchableOpacity
              style={localStyles.pickerButton}
              onPress={showDatePicker}
              disabled={isSubmitting}
            >
              <MaterialIcons name="calendar-today" size={20} color="#3B82F6" />
              <Text style={localStyles.pickerButtonText}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            
            {/* Time Picker Button (if showTime is true) */}
            {showTime && (
              <TouchableOpacity
                style={localStyles.pickerButton}
                onPress={showTimePicker}
                disabled={isSubmitting}
              >
                <MaterialIcons name="access-time" size={20} color="#3B82F6" />
                <Text style={localStyles.pickerButtonText}>
                  {format(selectedDate, 'h:mm a')}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Date/Time Picker */}
            {showPicker && (
              <View style={localStyles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode={mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                />
                
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={localStyles.doneButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={localStyles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
          
          {/* Modal Footer */}
          <View style={localStyles.modalFooter}>
            <TouchableOpacity
              style={localStyles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={localStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={localStyles.saveButton}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={localStyles.saveButtonText}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Local styles for components not in the shared styles
const localStyles = StyleSheet.create({
  selectedDateContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedDateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedDateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickOptionsContainer: {
    marginBottom: 16,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickOption: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  quickOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  doneButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  doneButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});