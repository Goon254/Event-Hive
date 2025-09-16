/**
 * TicketsSection Component
 * 
 * Fourth section of the event creation form for tickets and registration information.
 */

import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import DSButton from '../../../components/design-system/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { EventForm, FormErrors, NavigationDirection, TicketType } from '../../types';
import { FormField } from '../shared/FormField';
import { SectionNavigation } from '../shared/SectionNavigation';
import { DatePickerModal } from '../modals/DatePickerModal';
import styles from '../../styles';

interface TicketsSectionProps {
  /** Form data */
  formData: EventForm;
  
  /** Form validation errors */
  formErrors: FormErrors;
  
  /** Function to update form data */
  updateFormData: (updates: Partial<EventForm>) => void;
  
  /** Function to navigate between sections */
  navigateSection: (direction: NavigationDirection) => void;
  
  /** Function to show the ticket modal */
  showTicketModal: () => void;
  
  /** Function to set the current ticket for editing */
  setCurrentTicket: (ticket?: TicketType) => void;
  
  /** Whether the form is being submitted */
  isSubmitting: boolean;
  
  /** Whether to show the deadline picker */
  showDeadlinePicker: boolean;
  
  /** Function to set whether to show the deadline picker */
  setShowDeadlinePicker: (show: boolean) => void;
}

/**
 * Fourth section of the event creation form for tickets and registration information
 */
export function TicketsSection({
  formData,
  formErrors,
  updateFormData,
  navigateSection,
  isSubmitting,
  showDeadlinePicker,
  setShowDeadlinePicker,
  showTicketModal,
  setCurrentTicket,
}: TicketsSectionProps) {
  // Local state for new ticket
  const [newTicket, setNewTicket] = useState<TicketType>({
    id: '',
    name: '',
    price: '',
    quantity: '',
    description: ''
  });
  
  // Local state for editing ticket
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  
  /**
   * Toggle between free and paid event
   */
  const togglePaidEvent = (isPaid: boolean) => {
    updateFormData({ isPaid });
  };
  
  /**
   * Open ticket modal for adding a new ticket
   */
  const addTicketType = () => {
    setCurrentTicket(undefined);
    showTicketModal();
    
    // The actual adding of the ticket is handled in the parent component
  };
  
  /**
   * Start editing a ticket
   */
  const startEditingTicket = (ticket: TicketType) => {
    setCurrentTicket(ticket);
    showTicketModal();
  };
  
  /**
   * No longer needed as ticket editing is handled by the modal
   */
  const updateTicket = () => {
    // This is now handled in the parent component
  };
  
  /**
   * Remove a ticket type
   */
  const removeTicket = (id: string) => {
    Alert.alert(
      'Remove Ticket',
      'Are you sure you want to remove this ticket type?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          onPress: () => {
            const updatedTickets = formData.ticketTypes.filter(ticket => ticket.id !== id);
            updateFormData({
              ticketTypes: updatedTickets
            });
            
            // If we were editing this ticket, reset the editing state
            if (editingTicketId === id) {
              setNewTicket({
                id: '',
                name: '',
                price: '',
                quantity: '',
                description: ''
              });
              setEditingTicketId(null);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  /**
   * Cancel editing a ticket
   */
  const cancelEditingTicket = () => {
    setNewTicket({
      id: '',
      name: '',
      price: '',
      quantity: '',
      description: ''
    });
    setEditingTicketId(null);
  };
  
  /**
   * Render a ticket item
   */
  const renderTicketItem = ({ item }: { item: TicketType }) => (
    <View style={styles.ticketItem}>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketName}>{item.name}</Text>
        <Text style={styles.ticketPrice}>${parseFloat(item.price).toFixed(2)}</Text>
        {item.quantity && (
          <Text style={styles.ticketQuantity}>
            Quantity: {item.quantity}
          </Text>
        )}
        {item.description && (
          <Text style={styles.ticketDescription}>{item.description}</Text>
        )}
      </View>
      <View style={styles.ticketActions}>
        <TouchableOpacity
          style={styles.editTicketButton}
          onPress={() => startEditingTicket(item)}
          disabled={isSubmitting}
        >
          <MaterialIcons name="edit" size={20} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeTicketButton}
          onPress={() => removeTicket(item.id)}
          disabled={isSubmitting}
        >
          <MaterialIcons name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tickets & Registration</Text>
      
      {/* Event Capacity */}
      <FormField
        label="Event Capacity"
        value={formData.capacity}
        onChangeText={(text) => updateFormData({ capacity: text })}
        placeholder="Enter maximum number of attendees (optional)"
        keyboardType="numeric"
        error={formErrors.capacity}
        disabled={isSubmitting}
        helperText="Leave blank for unlimited capacity"
      />
      
      {/* Registration Deadline */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Deadline</Text>
        <DSButton
          title={formData.registrationDeadline
              ? format(formData.registrationDeadline, 'EEEE, MMMM d, yyyy')
              : 'No deadline (registration until event starts)'}
          onPress={() => setShowDeadlinePicker(true)}
          disabled={isSubmitting}
        />
        
        {/* Date Picker Modal for Registration Deadline */}
        <DatePickerModal
          visible={showDeadlinePicker}
          onClose={() => setShowDeadlinePicker(false)}
          initialDate={formData.registrationDeadline || formData.date}
          onSave={(date) => {
            updateFormData({ registrationDeadline: date });
            setShowDeadlinePicker(false);
          }}
          title="Select Registration Deadline"
          showTime={false}
          isSubmitting={isSubmitting}
          minDate={new Date()} // Can't select dates in the past
          maxDate={formData.date} // Can't be after event start date
        />
      </View>
      
      {/* Paid/Free Toggle */}
      <View style={styles.formGroup}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>This is a paid event</Text>
          <Switch
            value={formData.isPaid}
            onValueChange={togglePaidEvent}
            disabled={isSubmitting}
          />
        </View>
      </View>
      
      {/* Paid Event Options */}
      {formData.isPaid && (
        <>
          {/* Single Price or Multiple Ticket Types */}
          {formData.ticketTypes.length === 0 ? (
            <View style={styles.singlePriceContainer}>
              <Text style={styles.label}>
                Ticket Price<Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={formData.price}
                  onChangeText={(text) => updateFormData({ price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
              </View>
              {formErrors.price && (
                <Text style={styles.errorText}>{formErrors.price}</Text>
              )}
            </View>
          ) : null}
          
          {/* Ticket Types */}
          <View style={styles.ticketsContainer}>
            <View style={styles.ticketTypeHeader}>
              <Text style={styles.ticketTypeTitle}>
                Ticket Types
              </Text>
              <TouchableOpacity
                style={styles.addTicketButton}
                onPress={() => {
                  // If we have a single price, convert it to a ticket type
                  if (formData.ticketTypes.length === 0 && formData.price) {
                    const generalTicket: TicketType = {
                      id: Date.now().toString(),
                      name: 'General Admission',
                      price: formData.price,
                      quantity: '',
                      description: ''
                    };
                    updateFormData({
                      ticketTypes: [generalTicket],
                      price: ''
                    });
                  } else {
                    // Open the ticket modal to add a new ticket
                    addTicketType();
                  }
                }}
                disabled={isSubmitting}
              >
                <MaterialIcons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addTicketText}>Add Ticket</Text>
              </TouchableOpacity>
            </View>
            
            {/* Ticket List */}
            {formData.ticketTypes.length > 0 && (
              <View style={styles.ticketsList}>
                <FlatList
                  data={formData.ticketTypes}
                  renderItem={renderTicketItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
                
                {formErrors.ticketTypes && (
                  <Text style={styles.errorText}>{formErrors.ticketTypes}</Text>
                )}
              </View>
            )}
          </View>
        </>
      )}
      
      {/* Navigation Buttons */}
      <SectionNavigation
        currentSection={4}
        totalSections={6}
        onNavigate={navigateSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}