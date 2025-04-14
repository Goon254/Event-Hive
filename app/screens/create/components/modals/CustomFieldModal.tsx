/**
 * CustomFieldModal Component
 * 
 * Modal for creating and editing custom registration fields.
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
  FlatList,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomField } from '../../types';
import { FormField } from '../shared/FormField';
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

// Field type options
const FIELD_TYPES = [
  { id: 'text', label: 'Text', icon: 'text-fields' },
  { id: 'checkbox', label: 'Checkbox', icon: 'check-box' },
  { id: 'select', label: 'Dropdown', icon: 'arrow-drop-down-circle' }
];

/**
 * Modal for creating and editing custom registration fields
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
      setFieldData(field);
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
   * Add an option to the select field
   */
  const addOption = () => {
    if (!newOption.trim()) {
      return;
    }
    
    // Check if option already exists
    if (fieldData.options?.includes(newOption.trim())) {
      Alert.alert('Duplicate Option', 'This option already exists.');
      return;
    }
    
    // Add the option
    const updatedOptions = [...(fieldData.options || []), newOption.trim()];
    updateFieldData({ options: updatedOptions });
    setNewOption('');
  };
  
  /**
   * Remove an option from the select field
   */
  const removeOption = (option: string) => {
    const updatedOptions = fieldData.options?.filter(o => o !== option) || [];
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
    if (fieldData.type === 'select' && (!fieldData.options || fieldData.options.length < 2)) {
      newErrors.options = 'Select fields require at least 2 options';
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
  
  /**
   * Render an option item
   */
  const renderOptionItem = ({ item }: { item: string }) => (
    <View style={localStyles.optionItem}>
      <Text style={localStyles.optionText}>{item}</Text>
      <TouchableOpacity
        onPress={() => removeOption(item)}
        disabled={isSubmitting}
      >
        <MaterialIcons name="close" size={18} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
  
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
              {field ? 'Edit Field' : 'Add Custom Field'}
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
            <FormField
              label="Field Label"
              value={fieldData.label}
              onChangeText={(text) => updateFieldData({ label: text })}
              placeholder="e.g., Dietary Restrictions, T-Shirt Size"
              error={errors.label}
              required={true}
              disabled={isSubmitting}
            />
            
            {/* Field Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Field Type</Text>
              <View style={localStyles.fieldTypeContainer}>
                {FIELD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      localStyles.fieldTypeButton,
                      fieldData.type === type.id && localStyles.fieldTypeButtonSelected
                    ]}
                    onPress={() => updateFieldData({ type: type.id as 'text' | 'checkbox' | 'select' })}
                    disabled={isSubmitting}
                  >
                    <MaterialIcons 
                      name={type.icon as any} 
                      size={24} 
                      color={fieldData.type === type.id ? '#3B82F6' : '#6B7280'} 
                    />
                    <Text 
                      style={[
                        localStyles.fieldTypeText,
                        fieldData.type === type.id && localStyles.fieldTypeTextSelected
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Required Field Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Required Field</Text>
                <Switch
                  value={fieldData.required}
                  onValueChange={(value) => updateFieldData({ required: value })}
                  disabled={isSubmitting}
                />
              </View>
              <Text style={styles.helperText}>
                Toggle on if attendees must complete this field
              </Text>
            </View>
            
            {/* Options for Select Fields */}
            {fieldData.type === 'select' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Options<Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.helperText}>
                  Add at least 2 options for your dropdown field
                </Text>
                
                {/* Options List */}
                {fieldData.options && fieldData.options.length > 0 && (
                  <View style={localStyles.optionsContainer}>
                    <FlatList
                      data={fieldData.options}
                      renderItem={renderOptionItem}
                      keyExtractor={(item) => item}
                      scrollEnabled={false}
                      numColumns={2}
                    />
                  </View>
                )}
                
                {/* Add Option Input */}
                <View style={localStyles.addOptionContainer}>
                  <TextInput
                    style={localStyles.addOptionInput}
                    value={newOption}
                    onChangeText={setNewOption}
                    placeholder="Add an option..."
                    editable={!isSubmitting}
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
                  <Text style={styles.errorText}>{errors.options}</Text>
                )}
              </View>
            )}
            
            {/* Field Preview */}
            <View style={localStyles.previewContainer}>
              <Text style={localStyles.previewTitle}>Preview</Text>
              <View style={localStyles.previewContent}>
                {fieldData.type === 'text' && (
                  <View>
                    <Text style={localStyles.previewLabel}>
                      {fieldData.label || 'Field Label'}
                      {fieldData.required && <Text style={styles.requiredStar}>*</Text>}
                    </Text>
                    <View style={localStyles.previewTextInput} />
                  </View>
                )}
                
                {fieldData.type === 'checkbox' && (
                  <View style={localStyles.previewCheckboxContainer}>
                    <View style={localStyles.previewCheckbox} />
                    <Text style={localStyles.previewLabel}>
                      {fieldData.label || 'Field Label'}
                      {fieldData.required && <Text style={styles.requiredStar}>*</Text>}
                    </Text>
                  </View>
                )}
                
                {fieldData.type === 'select' && (
                  <View>
                    <Text style={localStyles.previewLabel}>
                      {fieldData.label || 'Field Label'}
                      {fieldData.required && <Text style={styles.requiredStar}>*</Text>}
                    </Text>
                    <View style={localStyles.previewSelect}>
                      <Text style={localStyles.previewSelectText}>
                        {fieldData.options && fieldData.options.length > 0 
                          ? 'Select an option...' 
                          : 'No options added'}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
                    </View>
                  </View>
                )}
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
  fieldTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  fieldTypeButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  fieldTypeText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  fieldTypeTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    width: '48%',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  addOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  previewContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewContent: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  previewTextInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  previewCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  previewSelect: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  previewSelectText: {
    fontSize: 14,
    color: '#6B7280',
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