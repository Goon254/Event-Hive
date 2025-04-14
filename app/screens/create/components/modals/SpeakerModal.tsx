/**
 * SpeakerModal Component
 * 
 * Modal for creating and editing speaker profiles with comprehensive information.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Speaker } from '../../types';
import EnhancedImageUpload from '../../../../container/events/EnhancedImageUpload';
import { ImageType } from '../../../../services/enhancedImageService';
import styles from '../../styles';

interface SpeakerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Speaker data to edit (if editing) */
  speaker?: Speaker;
  
  /** Function to save the speaker */
  onSave: (speaker: Speaker) => void;
  
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * Modal for creating and editing speaker profiles
 */
export function SpeakerModal({
  visible,
  onClose,
  speaker,
  onSave,
  isSubmitting = false
}: SpeakerModalProps) {
  // Local state for speaker data
  const [speakerData, setSpeakerData] = useState<Speaker>({
    id: '',
    name: '',
    role: '',
    bio: '',
    imageUri: null,
    socialLinks: {},
    expertiseTags: [],
    contactEmail: '',
    contactPhone: '',
    sessionTitle: ''
  });
  
  // Local state for new expertise tag
  const [newTag, setNewTag] = useState<string>('');
  
  // Local state for validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  
  // Initialize speaker data when editing
  useEffect(() => {
    if (speaker) {
      setSpeakerData({
        ...speaker,
        socialLinks: speaker.socialLinks || {},
        expertiseTags: speaker.expertiseTags || [],
        contactEmail: speaker.contactEmail || '',
        contactPhone: speaker.contactPhone || '',
        sessionTitle: speaker.sessionTitle || ''
      });
    } else {
      // Reset form when creating a new speaker
      setSpeakerData({
        id: Date.now().toString(),
        name: '',
        role: '',
        bio: '',
        imageUri: null,
        socialLinks: {},
        expertiseTags: [],
        contactEmail: '',
        contactPhone: '',
        sessionTitle: ''
      });
    }
    
    // Clear errors and new tag
    setErrors({});
    setNewTag('');
  }, [speaker, visible]);
  
  /**
   * Update speaker data
   */
  const updateSpeakerData = (updates: Partial<Speaker>) => {
    setSpeakerData(prev => ({ ...prev, ...updates }));
  };
  
  /**
   * Update social links
   */
  const updateSocialLink = (platform: 'twitter' | 'linkedin' | 'website', value: string) => {
    setSpeakerData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };
  
  /**
   * Add an expertise tag
   */
  const addExpertiseTag = () => {
    if (!newTag.trim()) {
      return;
    }
    
    // Check if tag already exists
    if (speakerData.expertiseTags && speakerData.expertiseTags.includes(newTag.trim())) {
      Alert.alert('Duplicate Tag', 'This expertise tag already exists.');
      return;
    }
    
    // Add the tag
    const updatedTags = [...(speakerData.expertiseTags || []), newTag.trim()];
    updateSpeakerData({ expertiseTags: updatedTags });
    setNewTag('');
  };
  
  /**
   * Remove an expertise tag
   */
  const removeExpertiseTag = (tag: string) => {
    if (!speakerData.expertiseTags) return;
    
    const updatedTags = speakerData.expertiseTags.filter(t => t !== tag);
    updateSpeakerData({ expertiseTags: updatedTags });
  };
  
  /**
   * Handle image selection
   */
  const handleImageSelected = (uri: string) => {
    updateSpeakerData({ imageUri: uri });
  };
  
  /**
   * Validate the form
   */
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
    } = {};
    
    // Validate name
    if (!speakerData.name.trim()) {
      newErrors.name = 'Speaker name is required';
    }
    
    // Validate email format if provided
    if (speakerData.contactEmail && !/^\S+@\S+\.\S+$/.test(speakerData.contactEmail)) {
      newErrors.email = 'Please enter a valid email address';
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
      onSave(speakerData);
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
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {speaker ? 'Edit Speaker' : 'Add Speaker'}
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
            {/* Speaker Image */}
            <View style={localStyles.imageUploadContainer}>
              <EnhancedImageUpload
                onImageSelected={handleImageSelected}
                initialImage={speakerData.imageUri}
                width={120}
                height={120}
                imageType={ImageType.EVENT_SPEAKER}
                id={speakerData.id}
                isSubmitting={isSubmitting}
                placeholderText="Add Photo"
              />
            </View>
            
            {/* Basic Information */}
            <View style={localStyles.sectionContainer}>
              <Text style={localStyles.sectionTitle}>Basic Information</Text>
              
              {/* Speaker Name */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>
                  Name<Text style={localStyles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    localStyles.input,
                    errors.name && localStyles.inputError
                  ]}
                  value={speakerData.name}
                  onChangeText={(text) => updateSpeakerData({ name: text })}
                  placeholder="Full name"
                  editable={!isSubmitting}
                />
                {errors.name && (
                  <Text style={localStyles.errorText}>{errors.name}</Text>
                )}
              </View>
              
              {/* Speaker Role */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>Role/Title</Text>
                <TextInput
                  style={localStyles.input}
                  value={speakerData.role}
                  onChangeText={(text) => updateSpeakerData({ role: text })}
                  placeholder="e.g., CEO, Professor, Industry Expert"
                  editable={!isSubmitting}
                />
              </View>
              
              {/* Speaker Bio */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>Biography</Text>
                <TextInput
                  style={localStyles.textArea}
                  value={speakerData.bio}
                  onChangeText={(text) => updateSpeakerData({ bio: text })}
                  placeholder="Professional background and achievements..."
                  multiline={true}
                  numberOfLines={5}
                  editable={!isSubmitting}
                />
              </View>
              
              {/* Session Title */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>Session Title</Text>
                <TextInput
                  style={localStyles.input}
                  value={speakerData.sessionTitle || ''}
                  onChangeText={(text) => updateSpeakerData({ sessionTitle: text })}
                  placeholder="Title of their talk or session"
                  editable={!isSubmitting}
                />
              </View>
            </View>
            
            {/* Expertise Tags */}
            <View style={localStyles.sectionContainer}>
              <Text style={localStyles.sectionTitle}>Areas of Expertise</Text>
              
              {/* Tags Display */}
              <View style={localStyles.tagsContainer}>
                {speakerData.expertiseTags && speakerData.expertiseTags.map((tag, index) => (
                  <View key={index} style={localStyles.tag}>
                    <Text style={localStyles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => removeExpertiseTag(tag)}
                      disabled={isSubmitting}
                    >
                      <MaterialIcons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {/* Add Tag Input */}
              <View style={localStyles.addTagContainer}>
                <TextInput
                  style={localStyles.addTagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add expertise tag..."
                  editable={!isSubmitting}
                  onSubmitEditing={addExpertiseTag}
                />
                <TouchableOpacity
                  style={localStyles.addTagButton}
                  onPress={addExpertiseTag}
                  disabled={isSubmitting || !newTag.trim()}
                >
                  <MaterialIcons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Contact Information */}
            <View style={localStyles.sectionContainer}>
              <Text style={localStyles.sectionTitle}>Contact Information</Text>
              
              {/* Email */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>Email</Text>
                <TextInput
                  style={[
                    localStyles.input,
                    errors.email && localStyles.inputError
                  ]}
                  value={speakerData.contactEmail || ''}
                  onChangeText={(text) => updateSpeakerData({ contactEmail: text })}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  editable={!isSubmitting}
                />
                {errors.email && (
                  <Text style={localStyles.errorText}>{errors.email}</Text>
                )}
              </View>
              
              {/* Phone */}
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>Phone</Text>
                <TextInput
                  style={localStyles.input}
                  value={speakerData.contactPhone || ''}
                  onChangeText={(text) => updateSpeakerData({ contactPhone: text })}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>
            </View>
            
            {/* Social Media Links */}
            <View style={localStyles.sectionContainer}>
              <Text style={localStyles.sectionTitle}>Social Media</Text>
              
              {/* Twitter */}
              <View style={localStyles.socialInputContainer}>
                <MaterialIcons name="alternate-email" size={24} color="#1DA1F2" />
                <TextInput
                  style={localStyles.socialInput}
                  value={speakerData.socialLinks?.twitter || ''}
                  onChangeText={(text) => updateSocialLink('twitter', text)}
                  placeholder="Twitter handle"
                  editable={!isSubmitting}
                />
              </View>
              
              {/* LinkedIn */}
              <View style={localStyles.socialInputContainer}>
                <MaterialIcons name="link" size={24} color="#0077B5" />
                <TextInput
                  style={localStyles.socialInput}
                  value={speakerData.socialLinks?.linkedin || ''}
                  onChangeText={(text) => updateSocialLink('linkedin', text)}
                  placeholder="LinkedIn profile URL"
                  editable={!isSubmitting}
                />
              </View>
              
              {/* Website */}
              <View style={localStyles.socialInputContainer}>
                <MaterialIcons name="language" size={24} color="#4B5563" />
                <TextInput
                  style={localStyles.socialInput}
                  value={speakerData.socialLinks?.website || ''}
                  onChangeText={(text) => updateSocialLink('website', text)}
                  placeholder="Personal website URL"
                  editable={!isSubmitting}
                />
              </View>
            </View>
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
                {isSubmitting ? 'Saving...' : 'Save Speaker'}
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
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
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
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  socialInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    marginLeft: 8,
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