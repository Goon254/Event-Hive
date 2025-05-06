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
  ScrollView,
  ImageBackground,
  Image,
  Animated
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils from '../utils/validation';
import { Link, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
// Wave animation component
const WaveAnimation = () => {
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    const createAnimation = (value, toValue, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          })
        ])
      );
    };
    
    // Create and start animations
    const animation1 = createAnimation(translateX1, -200, 8000);
    const animation2 = createAnimation(translateX2, 100, 10000);
    
    animation1.start();
    animation2.start();
    
    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, []);
  
  return (
    <View style={styles.wavesContainer}>
      <Animated.View
        style={[
          styles.wave,
          styles.wave1,
          { transform: [{ translateX: translateX1 }] }
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          styles.wave2,
          { transform: [{ translateX: translateX2 }] }
        ]}
      />
    </View>
  );
};

export default function ResetPassword() {
  const { resetPassword, error, clearError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canRequest, setCanRequest] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

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
      <ImageBackground
        source={require('../../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 191, 166, 0.7)', 'rgba(252, 211, 77, 0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Image
                  source={require('../../assets/images/eventhive-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you instructions to reset your password.
                </Text>
              </View>
          
          <WaveAnimation />
          
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
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          }) }] }}>
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
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0]
          }) }] }}>
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
          </Animated.View>
          
          {!canRequest && remainingTime > 0 && (
            <Text style={styles.limitText}>
              You can request another reset in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </Text>
          )}
          
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backToLogin} activeOpacity={0.7}>
              <FontAwesome name="arrow-left" size={14} color="#F97316" style={styles.backIcon} /> {/* Vibrant warm orange */}
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  formContainer: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00BFA6', // Tropical teal
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#166534', // Deep green
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0', // Soft mint
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
    backgroundColor: '#00BFA6', // Tropical teal
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#00BFA6', // Tropical teal
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Wave animation styles
  wavesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    borderRadius: 50,
  },
  wave1: {
    bottom: -10,
    height: 20,
    backgroundColor: 'rgba(0, 191, 166, 0.3)', // Tropical teal with transparency
  },
  wave2: {
    bottom: -15,
    height: 25,
    backgroundColor: 'rgba(45, 212, 191, 0.2)', // Lighter teal with transparency
  }
});