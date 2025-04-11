/**
 * FormField Component
 * 
 * A reusable form field component that handles different input types,
 * validation, and styling consistently across the form.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import styles from '../../styles';

interface FormFieldProps {
  /** The label text for the field */
  label: string;
  
  /** The current value of the field */
  value: string;
  
  /** Callback function when text changes */
  onChangeText: (text: string) => void;
  
  /** Placeholder text when field is empty */
  placeholder?: string;
  
  /** Error message to display (if any) */
  error?: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Whether the field should allow multiple lines */
  multiline?: boolean;
  
  /** Number of lines for multiline fields */
  numberOfLines?: number;
  
  /** Maximum length of input */
  maxLength?: number;
  
  /** Keyboard type for the input */
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
  
  /** Whether the field is disabled */
  disabled?: boolean;
  
  /** Helper text to display below the label */
  helperText?: string;
  
  /** Accessibility label for the input */
  accessibilityLabel?: string;
}

/**
 * A reusable form field component with consistent styling and behavior
 * 
 * @example
 * <FormField
 *   label="Event Title"
 *   value={title}
 *   onChangeText={setTitle}
 *   placeholder="Enter event title"
 *   error={errors.title}
 *   required={true}
 *   maxLength={70}
 * />
 */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  disabled = false,
  helperText,
  accessibilityLabel,
}: FormFieldProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      
      <TextInput
        style={[
          multiline ? styles.textArea : styles.input,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
        }}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        maxLength={maxLength}
        keyboardType={keyboardType}
        editable={!disabled}
        textAlignVertical={multiline ? "top" : undefined}
        accessibilityLabel={accessibilityLabel || label}
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        maxLength && (
          <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
        )
      )}
    </View>
  );
}