/**
 * TagInput Component
 * 
 * A reusable component for managing tags/keywords with add and remove functionality.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../../styles';

interface TagInputProps {
  /** Array of current tags */
  tags: string[];
  
  /** Callback when tags are updated */
  onTagsChange: (tags: string[]) => void;
  
  /** Label for the input */
  label?: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Helper text to display */
  helperText?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Placeholder for the input */
  placeholder?: string;
  
  /** Whether the input is disabled */
  disabled?: boolean;
  
  /** Maximum number of tags allowed */
  maxTags?: number;
}

/**
 * A component for managing tags/keywords with add and remove functionality
 * 
 * @example
 * <TagInput
 *   tags={formData.tags}
 *   onTagsChange={(tags) => updateFormData({ tags })}
 *   label="Event Tags"
 *   helperText="Add relevant keywords to help users find your event"
 *   placeholder="Add a tag (press Enter)"
 * />
 */
export function TagInput({
  tags,
  onTagsChange,
  label = 'Tags',
  required = false,
  helperText,
  error,
  placeholder = 'Add a tag (press Enter)',
  disabled = false,
  maxTags = 10,
}: TagInputProps) {
  const [newTag, setNewTag] = useState('');
  
  /**
   * Add a new tag if it's valid and not a duplicate
   */
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      if (maxTags && tags.length >= maxTags) {
        // Don't add more tags if at the limit
        return;
      }
      
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  /**
   * Remove a tag from the list
   */
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };
  
  return (
    <View style={styles.formGroup}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      )}
      
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity 
              onPress={() => removeTag(tag)}
              disabled={disabled}
              accessibilityLabel={`Remove tag ${tag}`}
            >
              <MaterialIcons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <View style={styles.tagInputContainer}>
        <TextInput
          style={styles.tagInput}
          value={newTag}
          onChangeText={setNewTag}
          placeholder={placeholder}
          onSubmitEditing={addTag}
          blurOnSubmit={false}
          editable={!disabled}
          accessibilityLabel="Tag input field"
          maxLength={30} // Reasonable limit for a tag
        />
        <TouchableOpacity 
          style={styles.tagAddButton} 
          onPress={addTag}
          disabled={disabled || !newTag.trim() || (!!maxTags && tags.length >= maxTags)}
          accessibilityLabel="Add tag button"
        >
          <MaterialIcons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {maxTags && (
        <Text style={styles.charCount}>
          {tags.length}/{maxTags} tags
        </Text>
      )}
    </View>
  );
}