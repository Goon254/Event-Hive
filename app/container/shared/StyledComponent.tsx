// app/container/shared/StyledComponent.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';

// Styled Input Component
interface StyledInputProps extends TextInputProps {
  error?: string;
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const StyledInput = ({ error, label, containerStyle, ...props }: StyledInputProps) => (
  <View style={[styles.inputContainer, containerStyle]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        props.multiline && styles.multilineInput,
      ]}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Styled Button Component
interface StyledButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const StyledButton = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: StyledButtonProps) => (
  <TouchableOpacity
    style={[
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      variant === 'outline' && styles.buttonOutline,
      (disabled || loading) && styles.buttonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#FFFFFF'} />
    ) : (
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'outline' && styles.buttonTextOutline,
        ]}
      >
        {title}
      </Text>
    )}
  </TouchableOpacity>
);

// Password Strength Indicator Component
export const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const getColor = () => {
    if (strength < 2) return '#EF4444';
    if (strength < 4) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View style={styles.strengthContainer}>
      {[...Array(5)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.strengthBar,
            {
              backgroundColor: index < strength ? getColor() : '#E5E7EB',
            },
          ]}
        />
      ))}
      <Text style={[styles.strengthText, { color: getColor() }]}>
        {strength < 2
          ? 'Weak'
          : strength < 4
          ? 'Medium'
          : 'Strong'} password
      </Text>
    </View>
  );
};

// Group components and export them as the default export
const Components = {
  StyledInput,
  StyledButton,
  PasswordStrengthIndicator,
};

export default Components;

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#6B7280',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: '#007AFF',
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
  },
});
