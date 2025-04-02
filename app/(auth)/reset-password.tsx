// app/(auth)/reset-password.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInputProps
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils from '../utils/validation';
import { Link, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

// Enhanced form input component
const EnhancedInput = ({ 
  label, 
  error, 
  icon, 
  ...inputProps 
}: { 
  label: string, 
  error?: string, 
  icon: React.ReactNode 
} & TextInputProps) => (
  <View style={enhancedStyles.inputContainer}>
    {label && <Text style={enhancedStyles.inputLabel}>{label}</Text>}
    <View style={[
      enhancedStyles.inputWrapper,
      error ? enhancedStyles.inputWrapperError : null
    ]}>
      <View style={enhancedStyles.inputIcon}>
        {icon}
      </View>
      <TextInput
        style={enhancedStyles.input}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
    </View>
    {error ? <Text style={enhancedStyles.errorText}>{error}</Text> : null}
  </View>
);

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const emailValidation = validationUtils.validateEmail(email);
    setEmailError(emailValidation.errors.join(', '));
    return emailValidation.isValid;
  };

  const handleResetPassword = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setIsSuccess(true);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        let errorMessage = 'Failed to send password reset email. Please try again.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        Alert.alert('Reset Password Failed', errorMessage);
      }
    }
  };

  if (isSuccess) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <FontAwesome name="check-circle" size={60} color="#34D399" style={styles.successIcon} />
              <Text style={styles.title}>Email Sent</Text>
              <Text style={styles.subtitle}>
                A password reset link has been sent to {email}. Please check your email inbox and follow the instructions to reset your password.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Return to Login</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Didn't receive the email? </Text>
              <TouchableOpacity onPress={handleResetPassword} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Resend Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email address to receive a password reset link</Text>
          </View>

          <EnhancedInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            error={emailError}
            icon={<FontAwesome name="envelope" size={16} color="#6B7280" />}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <View style={styles.backToLoginContainer}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <FontAwesome name="arrow-left" size={16} color="#6B7280" style={styles.backIcon} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backIcon: {
    marginRight: 8,
  },
  backToLoginText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  }
});

// Enhanced styles for input component
const enhancedStyles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});