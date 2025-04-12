// app/(auth)/reset-password.tsx
import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils from '../utils/validation';
import { Link, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { 
  canRequestPasswordReset, 
  recordPasswordResetRequest,
  isPasswordCompromised,
  getPasswordStrength
} from '../utils/authSecurity';

/**
 * Reset Password Screen
 * 
 * This screen allows users to request a password reset email.
 * It includes:
 * - Email validation
 * - Rate limiting for password reset requests
 * - Clear error messages
 * - Success feedback
 */
export default function ResetPassword() {
  const { resetPassword, error, clearError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canRequest, setCanRequest] = useState(true);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Check if the user can request a password reset
  useEffect(() => {
    const checkCanRequest = async () => {
      if (email) {
        const canRequest = await canRequestPasswordReset(email);
        setCanRequest(canRequest);
      }
    };

    checkCanRequest();
  }, [email]);

  // Countdown timer for rate limiting
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanRequest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [remainingTime]);

  const validateForm = () => {
    const emailValidation = validationUtils.validateEmail(email);
    setEmailError(emailValidation.errors.join(', '));
    return emailValidation.isValid;
  };

  const handleResetPassword = async () => {
    // Clear previous errors and success state
    clearError();
    setIsSuccess(false);
    
    if (!validateForm()) {
      return;
    }
    
    // Check if the user can request a password reset
    if (!canRequest) {
      Alert.alert(
        'Too Many Requests',
        `Please wait before requesting another password reset. You can try again in ${Math.ceil(remainingTime / 60)} minutes.`
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Record the password reset request
      await recordPasswordResetRequest(email);
      
      // Send the password reset email
      await resetPassword(email);
      
      // Set rate limiting
      setCanRequest(false);
      setRemainingTime(15 * 60); // 15 minutes
      
      // Show success message
      setIsSuccess(true);
      
      // Clear the email field
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      // Error handling is done by the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <FontAwesome name="exclamation-circle" size={18} color="#FF3B30" style={styles.errorIcon} />
              <Text style={styles.generalError}>{error}</Text>
            </View>
          )}
          
          {isSuccess && (
            <View style={styles.successContainer}>
              <FontAwesome name="check-circle" size={18} color="#34C759" style={styles.successIcon} />
              <Text style={styles.successText}>
                Password reset instructions have been sent to your email address. Please check your inbox.
              </Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              emailError ? styles.inputWrapperError : null
            ]}>
              <View style={styles.inputIcon}>
                <FontAwesome name="envelope" size={16} color="#6B7280" />
              </View>
              <TextInput
                style={styles.input}
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
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
          
          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || !canRequest) && styles.buttonDisabled
            ]}
            onPress={handleResetPassword}
            disabled={isLoading || !canRequest}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
          
          {!canRequest && remainingTime > 0 && (
            <Text style={styles.limitText}>
              You can request another reset in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </Text>
          )}
          
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backToLogin} activeOpacity={0.7}>
              <FontAwesome name="arrow-left" size={14} color="#007AFF" style={styles.backIcon} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
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
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  generalError: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successIcon: {
    marginRight: 8,
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    flex: 1,
  },
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
  limitText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backIcon: {
    marginRight: 8,
  },
  backToLoginText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});