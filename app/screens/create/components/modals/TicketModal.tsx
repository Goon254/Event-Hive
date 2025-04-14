/**
 * TicketModal Component
 * 
 * Modal for creating and editing ticket types.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TicketType } from '../../types';
import { FormField } from '../shared/FormField';
import styles from '../../styles';

interface TicketModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Ticket data to edit (if editing) */
  ticket?: TicketType;
  
  /** Function to save the ticket */
  onSave: (ticket: TicketType) => void;
  
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * Modal for creating and editing ticket types
 */
export function TicketModal({
  visible,
  onClose,
  ticket,
  onSave,
  isSubmitting = false
}: TicketModalProps) {
  // Local state for ticket data
  const [ticketData, setTicketData] = useState<TicketType>({
    id: '',
    name: '',
    price: '',
    quantity: '',
    description: ''
  });
  
  // Local state for validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
  }>({});
  
  // Initialize ticket data when editing
  useEffect(() => {
    if (ticket) {
      setTicketData(ticket);
    } else {
      // Reset form when creating a new ticket
      setTicketData({
        id: Date.now().toString(),
        name: '',
        price: '',
        quantity: '',
        description: ''
      });
    }
    
    // Clear errors
    setErrors({});
  }, [ticket, visible]);
  
  /**
   * Update ticket data
   */
  const updateTicketData = (updates: Partial<TicketType>) => {
    setTicketData(prev => ({ ...prev, ...updates }));
  };
  
  /**
   * Validate the form
   */
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      price?: string;
    } = {};
    
    // Validate name
    if (!ticketData.name.trim()) {
      newErrors.name = 'Ticket name is required';
    }
    
    // Validate price
    if (!ticketData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(ticketData.price)) || Number(ticketData.price) < 0) {
      newErrors.price = 'Price must be a valid number';
    }
    
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * Handle save
   */
  const handleSave = () => {
    if (validateForm()) {
      onSave(ticketData);
      onClose();
    }
  };
  
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
            <Text style={styles.modalTitle}>
              {ticket ? 'Edit Ticket' : 'Add Ticket'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* Modal Body */}
          <ScrollView style={styles.modalBody}>
            {/* Ticket Name */}
            <FormField
              label="Ticket Name"
              value={ticketData.name}
              onChangeText={(text) => updateTicketData({ name: text })}
              placeholder="e.g., VIP, Early Bird, General Admission"
              error={errors.name}
              required={true}
              disabled={isSubmitting}
            />
            
            {/* Ticket Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Price<Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={ticketData.price}
                  onChangeText={(text) => updateTicketData({ price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
              </View>
              {errors.price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}
            </View>
            
            {/* Ticket Quantity */}
            <FormField
              label="Quantity Available"
              value={ticketData.quantity}
              onChangeText={(text) => updateTicketData({ quantity: text })}
              placeholder="Leave blank for unlimited"
              keyboardType="numeric"
              disabled={isSubmitting}
              helperText="How many tickets of this type are available"
            />
            
            {/* Ticket Description */}
            <FormField
              label="Description"
              value={ticketData.description}
              onChangeText={(text) => updateTicketData({ description: text })}
              placeholder="Describe what's included with this ticket"
              multiline={true}
              numberOfLines={4}
              disabled={isSubmitting}
              helperText="Optional details about what this ticket includes"
            />
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
                {isSubmitting ? 'Saving...' : 'Save Ticket'}
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