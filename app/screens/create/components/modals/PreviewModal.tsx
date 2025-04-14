/**
 * PreviewModal Component
 * 
 * Modal for previewing the event before submission.
 */

import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { EventForm } from '../../types';
import styles from '../../styles';

interface PreviewModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Event data to preview */
  eventData: EventForm;
  
  /** Function to submit the form */
  onSubmit: () => void;
  
  /** Whether the form is submitting */
  isSubmitting: boolean;
}

/**
 * Modal for previewing the event before submission
 */
export function PreviewModal({
  visible,
  onClose,
  eventData,
  onSubmit,
  isSubmitting
}: PreviewModalProps) {
  /**
   * Format date and time
   */
  const formatDateTime = (date: Date, time: Date): string => {
    const dateObj = new Date(date);
    const timeObj = new Date(time);
    
    dateObj.setHours(timeObj.getHours());
    dateObj.setMinutes(timeObj.getMinutes());
    
    return format(dateObj, 'EEEE, MMMM d, yyyy h:mm a');
  };
  
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={localStyles.previewContainer}>
        {/* Preview Header */}
        <View style={localStyles.previewHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={localStyles.previewTitle}>Event Preview</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Preview Content */}
        <ScrollView style={localStyles.previewContent}>
          {/* Event Image */}
          {eventData.imageUri ? (
            <Image
              source={{ uri: eventData.imageUri }}
              style={localStyles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={localStyles.previewImagePlaceholder}>
              <MaterialIcons name="image" size={48} color="#9CA3AF" />
              <Text style={localStyles.previewImagePlaceholderText}>No Image</Text>
            </View>
          )}
          
          {/* Event Title */}
          <View style={localStyles.previewSection}>
            <Text style={localStyles.previewEventTitle}>{eventData.title}</Text>
            
            {/* Event Category */}
            <View style={localStyles.previewCategory}>
              <Text style={localStyles.previewCategoryText}>{eventData.category}</Text>
            </View>
          </View>
          
          {/* Event Date & Time */}
          <View style={localStyles.previewSection}>
            <View style={localStyles.previewSectionHeader}>
              <MaterialIcons name="event" size={20} color="#3B82F6" />
              <Text style={localStyles.previewSectionTitle}>Date & Time</Text>
            </View>
            
            <View style={localStyles.previewDetail}>
              <Text style={localStyles.previewDetailLabel}>Starts</Text>
              <Text style={localStyles.previewDetailText}>
                {formatDateTime(eventData.date, eventData.time)}
              </Text>
            </View>
            
            <View style={localStyles.previewDetail}>
              <Text style={localStyles.previewDetailLabel}>Ends</Text>
              <Text style={localStyles.previewDetailText}>
                {formatDateTime(eventData.endDate, eventData.endTime)}
              </Text>
            </View>
            
            <View style={localStyles.previewDetail}>
              <Text style={localStyles.previewDetailLabel}>Time Zone</Text>
              <Text style={localStyles.previewDetailText}>{eventData.timeZone}</Text>
            </View>
          </View>
          
          {/* Event Location */}
          <View style={localStyles.previewSection}>
            <View style={localStyles.previewSectionHeader}>
              <MaterialIcons
                name={eventData.isVirtual ? "computer" : "location-on"}
                size={20}
                color="#3B82F6"
              />
              <Text style={localStyles.previewSectionTitle}>
                {eventData.isVirtual ? 'Virtual Event' : 'Location'}
              </Text>
            </View>
            
            {eventData.isVirtual ? (
              <View style={localStyles.previewDetail}>
                <Text style={localStyles.previewDetailLabel}>Link</Text>
                <Text style={localStyles.previewDetailText}>{eventData.virtualLink}</Text>
              </View>
            ) : (
              <>
                {eventData.buildingName && (
                  <View style={localStyles.previewDetail}>
                    <Text style={localStyles.previewDetailLabel}>Venue</Text>
                    <Text style={localStyles.previewDetailText}>{eventData.buildingName}</Text>
                  </View>
                )}
                
                <View style={localStyles.previewDetail}>
                  <Text style={localStyles.previewDetailLabel}>Address</Text>
                  <Text style={localStyles.previewDetailText}>
                    {eventData.address}
                    {'\n'}
                    {eventData.city}, {eventData.state} {eventData.zipCode}
                    {'\n'}
                    {eventData.country}
                  </Text>
                </View>
              </>
            )}
          </View>
          
          {/* Event Description */}
          <View style={localStyles.previewSection}>
            <View style={localStyles.previewSectionHeader}>
              <MaterialIcons name="description" size={20} color="#3B82F6" />
              <Text style={localStyles.previewSectionTitle}>About</Text>
            </View>
            
            <Text style={localStyles.previewDescription}>{eventData.description}</Text>
          </View>
          
          {/* Event Tickets */}
          <View style={localStyles.previewSection}>
            <View style={localStyles.previewSectionHeader}>
              <MaterialIcons name="confirmation-number" size={20} color="#3B82F6" />
              <Text style={localStyles.previewSectionTitle}>
                {eventData.isPaid ? 'Tickets' : 'Registration'}
              </Text>
            </View>
            
            {eventData.isPaid ? (
              eventData.ticketTypes.length > 0 ? (
                eventData.ticketTypes.map((ticket) => (
                  <View key={ticket.id} style={localStyles.previewTicket}>
                    <View>
                      <Text style={localStyles.previewTicketName}>{ticket.name}</Text>
                      {ticket.description && (
                        <Text style={localStyles.previewTicketDescription}>{ticket.description}</Text>
                      )}
                    </View>
                    <Text style={localStyles.previewTicketPrice}>${parseFloat(ticket.price).toFixed(2)}</Text>
                  </View>
                ))
              ) : (
                <View style={localStyles.previewTicket}>
                  <Text style={localStyles.previewTicketName}>General Admission</Text>
                  <Text style={localStyles.previewTicketPrice}>${parseFloat(eventData.price).toFixed(2)}</Text>
                </View>
              )
            ) : (
              <Text style={localStyles.previewFreeText}>Free Event</Text>
            )}
            
            {eventData.capacity && (
              <View style={localStyles.previewDetail}>
                <Text style={localStyles.previewDetailLabel}>Capacity</Text>
                <Text style={localStyles.previewDetailText}>{eventData.capacity} attendees</Text>
              </View>
            )}
          </View>
          
          {/* Event Speakers */}
          {eventData.speakers.length > 0 && (
            <View style={localStyles.previewSection}>
              <View style={localStyles.previewSectionHeader}>
                <MaterialIcons name="people" size={20} color="#3B82F6" />
                <Text style={localStyles.previewSectionTitle}>Speakers</Text>
              </View>
              
              {eventData.speakers.map((speaker) => (
                <View key={speaker.id} style={localStyles.previewSpeaker}>
                  {speaker.imageUri ? (
                    <Image
                      source={{ uri: speaker.imageUri }}
                      style={localStyles.previewSpeakerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={localStyles.previewSpeakerImagePlaceholder}>
                      <Text style={localStyles.previewSpeakerInitial}>
                        {speaker.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  <View style={localStyles.previewSpeakerInfo}>
                    <Text style={localStyles.previewSpeakerName}>{speaker.name}</Text>
                    {speaker.role && (
                      <Text style={localStyles.previewSpeakerRole}>{speaker.role}</Text>
                    )}
                    {speaker.bio && (
                      <Text style={localStyles.previewSpeakerBio}>{speaker.bio}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Event Tags */}
          {eventData.tags.length > 0 && (
            <View style={localStyles.previewSection}>
              <View style={localStyles.previewSectionHeader}>
                <MaterialIcons name="local-offer" size={20} color="#3B82F6" />
                <Text style={localStyles.previewSectionTitle}>Tags</Text>
              </View>
              
              <View style={localStyles.previewTags}>
                {eventData.tags.map((tag) => (
                  <View key={tag} style={localStyles.previewTag}>
                    <Text style={localStyles.previewTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Preview Footer */}
        <View style={styles.previewFooter}>
          <TouchableOpacity
            style={styles.editEventButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <MaterialIcons name="edit" size={20} color="#6B7280" />
            <Text style={styles.editEventButtonText}>Edit Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.publishEventButton}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.publishEventButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Text>
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Local styles for the preview modal
const localStyles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewContent: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#9CA3AF',
  },
  previewSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewCategory: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  previewCategoryText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  previewDetail: {
    marginBottom: 12,
  },
  previewDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewDetailText: {
    fontSize: 16,
    color: '#1F2937',
  },
  previewDescription: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  previewTicket: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewTicketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewTicketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  previewTicketPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  previewFreeText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 12,
  },
  previewSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewSpeakerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  previewSpeakerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewSpeakerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  previewSpeakerInfo: {
    flex: 1,
  },
  previewSpeakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewSpeakerRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewSpeakerBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewTagText: {
    fontSize: 14,
    color: '#4B5563',
  },
});