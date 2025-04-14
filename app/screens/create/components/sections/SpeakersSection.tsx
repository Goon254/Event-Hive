/**
 * SpeakersSection Component
 * 
 * Fifth section of the event creation form for speakers and presenters information.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EventForm, FormErrors, NavigationDirection, Speaker } from '../../types';
import { FormField } from '../shared/FormField';
import { SectionNavigation } from '../shared/SectionNavigation';
import EnhancedImageUpload from '../../../../container/events/EnhancedImageUpload';
import { ImageType } from '../../../../services/enhancedImageService';
import styles from '../../styles';

interface SpeakersSectionProps {
  /** Form data */
  formData: EventForm;
  
  /** Form validation errors */
  formErrors: FormErrors;
  
  /** Function to update form data */
  updateFormData: (updates: Partial<EventForm>) => void;
  
  /** Function to navigate between sections */
  navigateSection: (direction: NavigationDirection) => void;
  
  /** Whether the form is being submitted */
  isSubmitting: boolean;
  
  /** Function to handle image selection */
  handleImageSelected: (uri: string) => void;
  
  /** Function to show the speaker modal */
  showSpeakerModal: () => void;
  
  /** Function to set the current speaker for editing */
  setCurrentSpeaker: (speaker?: Speaker) => void;
}

/**
 * Fifth section of the event creation form for speakers and presenters information
 */
export function SpeakersSection({
  formData,
  formErrors,
  updateFormData,
  navigateSection,
  isSubmitting,
  handleImageSelected,
  showSpeakerModal,
  setCurrentSpeaker,
}: SpeakersSectionProps) {
  // Local state for new speaker
  const [newSpeaker, setNewSpeaker] = useState<Speaker>({
    id: '',
    name: '',
    role: '',
    bio: '',
    imageUri: null
  });
  
  // Local state for editing speaker
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  
  /**
   * Open speaker modal for adding a new speaker
   */
  const addSpeaker = () => {
    setCurrentSpeaker(undefined);
    showSpeakerModal();
    
    // The actual adding of the speaker is handled in the parent component
  };
  
  /**
   * Start editing a speaker
   */
  const startEditingSpeaker = (speaker: Speaker) => {
    setCurrentSpeaker(speaker);
    showSpeakerModal();
  };
  
  /**
   * No longer needed as speaker editing is handled by the modal
   */
  const updateSpeaker = () => {
    // This is now handled in the parent component
  };
  
  /**
   * Remove a speaker
   */
  const removeSpeaker = (id: string) => {
    Alert.alert(
      'Remove Speaker',
      'Are you sure you want to remove this speaker?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          onPress: () => {
            const updatedSpeakers = formData.speakers.filter(speaker => speaker.id !== id);
            updateFormData({
              speakers: updatedSpeakers
            });
            
            // If we were editing this speaker, reset the editing state
            if (editingSpeakerId === id) {
              setNewSpeaker({
                id: '',
                name: '',
                role: '',
                bio: '',
                imageUri: null
              });
              setEditingSpeakerId(null);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  /**
   * Cancel editing a speaker
   */
  const cancelEditingSpeaker = () => {
    setNewSpeaker({
      id: '',
      name: '',
      role: '',
      bio: '',
      imageUri: null
    });
    setEditingSpeakerId(null);
  };
  
  /**
   * Handle speaker image selection - now handled directly by EnhancedImageUpload
   */
  
  /**
   * Render a speaker item
   */
  const renderSpeakerItem = ({ item }: { item: Speaker }) => (
    <View style={styles.speakerItem}>
      <View style={styles.speakerImageContainer}>
        {item.imageUri ? (
          <Image 
            source={{ uri: item.imageUri }} 
            style={styles.speakerImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.speakerImagePlaceholder}>
            <Text style={styles.speakerImagePlaceholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.speakerInfo}>
        <Text style={styles.speakerName}>{item.name}</Text>
        {item.role && (
          <Text style={styles.speakerRole}>{item.role}</Text>
        )}
        {item.bio && (
          <Text style={styles.speakerBio}>{item.bio}</Text>
        )}
      </View>
      <View style={styles.speakerActions}>
        <TouchableOpacity
          style={styles.editSpeakerButton}
          onPress={() => startEditingSpeaker(item)}
          disabled={isSubmitting}
        >
          <MaterialIcons name="edit" size={20} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeSpeakerButton}
          onPress={() => removeSpeaker(item.id)}
          disabled={isSubmitting}
        >
          <MaterialIcons name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Speakers & Presenters</Text>
      
      <Text style={styles.helperText}>
        Add speakers, presenters, or performers for your event. This section is optional.
      </Text>
      
      {/* Speakers List */}
      <View style={styles.formGroup}>
        <View style={styles.speakersHeader}>
          <Text style={styles.speakersTitle}>
            Speakers
          </Text>
          <TouchableOpacity
            style={styles.addSpeakerButton}
            onPress={() => {
              // If we're editing, finish editing first
              if (editingSpeakerId) {
                updateSpeaker();
              } else {
                // Otherwise just add a new speaker
                addSpeaker();
              }
            }}
            disabled={isSubmitting || !newSpeaker.name}
          >
            <MaterialIcons name={editingSpeakerId ? "check" : "add"} size={18} color="#FFFFFF" />
            <Text style={styles.addSpeakerText}>
              {editingSpeakerId ? "Update" : "Add Speaker"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Speaker Form */}
        <View style={styles.formGroup}>
          <FormField
            label="Name"
            value={newSpeaker.name}
            onChangeText={(text) => setNewSpeaker({...newSpeaker, name: text})}
            placeholder="Speaker's full name"
            required={true}
            disabled={isSubmitting}
          />
          
          <FormField
            label="Role"
            value={newSpeaker.role}
            onChangeText={(text) => setNewSpeaker({...newSpeaker, role: text})}
            placeholder="e.g., Keynote Speaker, Panelist, Performer"
            disabled={isSubmitting}
          />
          
          <FormField
            label="Bio"
            value={newSpeaker.bio}
            onChangeText={(text) => setNewSpeaker({...newSpeaker, bio: text})}
            placeholder="Brief biography or description"
            multiline={true}
            numberOfLines={4}
            disabled={isSubmitting}
          />
          
          {/* Speaker Image Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Speaker Image (Optional)</Text>
            <View style={styles.speakerImageUpload}>
              <EnhancedImageUpload
                onImageSelected={(uri) => setNewSpeaker({...newSpeaker, imageUri: uri})}
                initialImage={newSpeaker.imageUri}
                width={100}
                height={100}
                imageType={ImageType.EVENT_SPEAKER}
                id={formData.id}
                isSubmitting={isSubmitting}
                placeholderText="Add Photo"
              />
            </View>
          </View>
          
          {editingSpeakerId && (
            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              onPress={cancelEditingSpeaker}
              disabled={isSubmitting}
            >
              <Text style={{ color: '#6B7280', textDecorationLine: 'underline' }}>
                Cancel Editing
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Speakers List */}
        {formData.speakers.length > 0 ? (
          <View style={styles.speakersList}>
            <FlatList
              data={formData.speakers}
              renderItem={renderSpeakerItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <Text style={styles.noSpeakersText}>
            No speakers added yet. Add speakers to help promote your event.
          </Text>
        )}
      </View>
      
      {/* Navigation Buttons */}
      <SectionNavigation
        currentSection={5}
        totalSections={6}
        onNavigate={navigateSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}