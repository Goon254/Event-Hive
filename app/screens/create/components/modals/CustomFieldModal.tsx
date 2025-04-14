/**
 * CustomFieldModal Component
 * 
 * Modal for creating and editing custom registration form fields.
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
  Switch,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomField } from '../../types';
import styles from '../../styles';

interface CustomFieldModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Custom field data to edit (if editing) */
  field?: CustomField;
  
  /** Function to save the custom field */
  onSave: (field: CustomField) => void;
  
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * Modal for creating and editing custom registration form fields
 */
export function CustomFieldModal({
  visible,
  onClose,
  field,
  onSave,
  isSubmitting = false
}: CustomFieldModalProps) {
  // Local state for field data
  const [fieldData, setFieldData] = useState<CustomField>({
    id: '',
    label: '',
    type: 'text',
    required: false,
    options: []
  });
  
  // Local state for new option
  const [newOption, setNewOption] = useState<string>('');
  
  // Local state for validation errors
  const [errors, setErrors] = useState<{
    label?: string;
    options?: string;
  }>({});
  
  // Initialize field data when editing
  useEffect(() => {
    if (field) {
      setFieldData({
        ...field,
        options: field.options || []
      });
    } else {
      // Reset form when creating a new field
      setFieldData({
        id: Date.now().toString(),
        label: '',
        type: 'text',
        required: false,
        options: []
      });
    }
    
    // Clear errors and new option
    setErrors({});
    setNewOption('');
  }, [field, visible]);
  
  /**
   * Update field data
   */
  const updateFieldData = (updates: Partial<CustomField>) => {
    setFieldData(prev => ({ ...prev, ...updates }));
  };
  
  /**
   * Add an option to select field
   */
  const addOption = () => {
    if (!newOption.trim()) {
      return;
    }
    
    // Check if option already exists
    if (fieldData.options && fieldData.options.includes(newOption.trim())) {
      Alert.alert('Duplicate Option', 'This option already exists.');
      return;
    }
    
    // Add the option
    const updatedOptions = [...(fieldData.options || []), newOption.trim()];
    updateFieldData({ options: updatedOptions });
    setNewOption('');
  };
  
  /**
   * Remove an option from select field
   */
  const removeOption = (option: string) => {
    if (!fieldData.options) return;
    
    const updatedOptions = fieldData.options.filter(o => o !== option);
    updateFieldData({ options: updatedOptions });
  };
  
  /**
   * Validate the form
   */
  const validateForm = (): boolean => {
    const newErrors: {
      label?: string;
      options?: string;
    } = {};
    
    // Validate label
    if (!fieldData.label.trim()) {
      newErrors.label = 'Field label is required';
    }
    
    // Validate options for select fields
    if (fieldData.type === 'select' && (!fieldData.options || fieldData.options.length === 0)) {
      newErrors.options = 'Select fields must have at least one option';
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
      onSave(fieldData);
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
              {field ? 'Edit Field' : 'Add Registration Field'}
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
            {/* Field Label */}
            <View style={localStyles.formGroup}>
              <Text style={localStyles.label}>
                Field Label<Text style={localStyles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  localStyles.input,
                  errors.label && localStyles.inputError
                ]}
                value={fieldData.label}
                onChangeText={(text) => updateFieldData({ label: text })}
                placeholder="e.g., Dietary Restrictions, T-Shirt Size"
                editable={!isSubmitting}
              />
              {errors.label && (
                <Text style={localStyles.errorText}>{errors.label}</Text>
              )}
            </View>
            
            {/* Field Type */}
            <View style={localStyles.formGroup}>
              <Text style={localStyles.label}>Field Type</Text>
              <View style={localStyles.fieldTypeContainer}>
                <TouchableOpacity
                  style={[
                    localStyles.fieldTypeButton,
                    fieldData.type === 'text' && localStyles.fieldTypeButtonActive
                  ]}
                  onPress={() => updateFieldData({ type: 'text' })}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="text-fields"
                    size={20}
                    color={fieldData.type === 'text' ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    style={[
                      localStyles.fieldTypeText,
                      fieldData.type === 'text' && localStyles.fieldTypeTextActive
                    ]}
                  >
                    Text
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    localStyles.fieldTypeButton,
                    fieldData.type === 'checkbox' && localStyles.fieldTypeButtonActive
                  ]}
                  onPress={() => updateFieldData({ type: 'checkbox' })}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="check-box"
                    size={20}
                    color={fieldData.type === 'checkbox' ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    style={[
                      localStyles.fieldTypeText,
                      fieldData.type === 'checkbox' && localStyles.fieldTypeTextActive
                    ]}
                  >
                    Checkbox
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    localStyles.fieldTypeButton,
                    fieldData.type === 'select' && localStyles.fieldTypeButtonActive
                  ]}
                  onPress={() => updateFieldData({ type: 'select' })}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="list"
                    size={20}
                    color={fieldData.type === 'select' ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    style={[
                      localStyles.fieldTypeText,
                      fieldData.type === 'select' && localStyles.fieldTypeTextActive
                    ]}
                  >
                    Select
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Required Field */}
            <View style={localStyles.formGroup}>
              <View style={localStyles.switchContainer}>
                <Text style={localStyles.label}>Required Field</Text>
                <Switch
                  value={fieldData.required}
                  onValueChange={(value) => updateFieldData({ required: value })}
                  disabled={isSubmitting}
                />
              </View>
              <Text style={localStyles.helperText}>
                {fieldData.required
                  ? 'Attendees must complete this field to register'
                  : 'This field is optional for attendees'}
              </Text>
            </View>
            
            {/* Options for Select Field */}
            {fieldData.type === 'select' && (
              <View style={localStyles.formGroup}>
                <Text style={localStyles.label}>
                  Options<Text style={localStyles.requiredStar}>*</Text>
                </Text>
                <Text style={localStyles.helperText}>
                  Add options for attendees to choose from
                </Text>
                
                {/* Options List */}
                <View style={localStyles.optionsContainer}>
                  {fieldData.options && fieldData.options.map((option, index) => (
                    <View key={index} style={localStyles.optionItem}>
                      <Text style={localStyles.optionText}>{option}</Text>
                      <TouchableOpacity
                        onPress={() => removeOption(option)}
                        disabled={isSubmitting}
                      >
                        <MaterialIcons name="close" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {/* Add Option Input */}
                <View style={localStyles.addOptionContainer}>
                  <TextInput
                    style={localStyles.addOptionInput}
                    value={newOption}
                    onChangeText={setNewOption}
                    placeholder="Add an option..."
                    editable={!isSubmitting}
                    onSubmitEditing={addOption}
                  />
                  <TouchableOpacity
                    style={localStyles.addOptionButton}
                    onPress={addOption}
                    disabled={isSubmitting || !newOption.trim()}
                  >
                    <MaterialIcons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {errors.options && (
                  <Text style={localStyles.errorText}>{errors.options}</Text>
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
                {isSubmitting ? 'Saving...' : 'Save Field'}
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
  formGroup: {
    marginBottom: 20,
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  fieldTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  fieldTypeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  fieldTypeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  fieldTypeTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
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
  addOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOptionInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  addOptionButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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