// app/(auth)/login.tsx

import React, { useState, useRef, useEffect } from 'react';
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
  TextInputProps,
  ImageBackground,
  Image,
  Animated
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils from '../utils/validation';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoogleAuth } from '../utils/googleAuth';
import DSButton from '../components/design-system/Button';
import DSTextInput from '../components/design-system/TextInput';
import Card from '../components/design-system/Card';
import Divider from '../components/design-system/Divider';
import DSTextInput from '../../components/DSTextInput';
import DSButton from '../../components/DSButton';
import Divider from '../../components/Divider';

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

// Palm Tree Component
const PalmTree = () => {
  const swayAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  return (
    <View style={styles.palmTreeContainer}>
      {/* Tree Trunk */}
      <View style={styles.treeTrunk} />
      
      {/* Tree Leaves */}
      <Animated.View
        style={[
          styles.treeLeaves,
          {
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ['-5deg', '0deg', '5deg']
                })
              }
            ]
          }
        ]}
      >
        <View style={[styles.leaf, styles.leaf1]} />
        <View style={[styles.leaf, styles.leaf2]} />
        <View style={[styles.leaf, styles.leaf3]} />
        <View style={[styles.leaf, styles.leaf4]} />
        <View style={[styles.leaf, styles.leaf5]} />
      </Animated.View>
    </View>
  );
};

// Wave animation component
const WaveAnimation = () => {
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    const createAnimation = (value: Animated.Value, toValue: number, duration: number) => {
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

export default function Login() {
  const { signIn, isLoading, error, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const emailValidation = validationUtils.validateEmail(email);
    const passwordValidation = validationUtils.validatePassword(password);

    setEmailError(emailValidation.errors.join(', '));
    setPasswordError(passwordValidation.errors.join(', '));

    return emailValidation.isValid && passwordValidation.isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        await signIn(email, password);
        // Navigation will be handled by AuthContext
      } catch (err) {
        // Fallback error handling if not caught by context
        let errorMessage = 'An unknown error occurred';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        Alert.alert('Login Failed', errorMessage);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      // Navigation will be handled by AuthContext
    } catch (err) {
      // Error handling is done in AuthContext
      setGoogleLoading(false);
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
        <PalmTree />
        <LinearGradient
          colors={['rgba(0, 191, 166, 0.7)', 'rgba(252, 211, 77, 0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Card style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Image
                  source={require('../../assets/images/eventhive-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Welcome to Paradise</Text>
                <Text style={styles.subtitle}>Sign in to continue your tropical journey</Text>
              </View>
              
              {error && (
                <View style={styles.errorContainer}>
                  <FontAwesome name="exclamation-circle" size={18} color="#FF3B30" style={styles.errorIcon} />
                  <Text style={styles.generalError}>{error}</Text>
                </View>
              )}

          <WaveAnimation />
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          }) }] }}>
            <DSTextInput
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
            leftIcon={<FontAwesome name="envelope" size={16} color="#6B7280" />}
          />

          <DSTextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
            error={passwordError}
            leftIcon={<FontAwesome name="lock" size={16} color="#6B7280" />}
          />

          <DSButton title="Sign In" onPress={handleLogin} loading={isLoading} />
          </Animated.View>

          <Link href="/(auth)/reset-password" asChild>
          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity> 
          </Link>

          
          <View style={styles.divider}>
            <Divider />
            <Text style={styles.dividerText}>OR</Text>
            <Divider />
          </View>

          <DSButton
            title={googleLoading ? 'Signing in...' : 'Sign in with Google'}
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            variant="secondary"
            leftIcon={<FontAwesome name="google" size={20} color="#FFFFFF" />}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Card>
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
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#2DD4BF', // Lighter teal
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#009688', // Darker teal
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#00BFA6', // Tropical teal
    fontWeight: '600',
  },
  
  // Palm Tree styles
  palmTreeContainer: {
    position: 'absolute',
    right: 20,
    top: 100,
    width: 100,
    height: 200,
    zIndex: 10,
  },
  treeTrunk: {
    position: 'absolute',
    bottom: 0,
    left: 45,
    width: 10,
    height: 80,
    backgroundColor: '#8B4513', // Brown
    borderRadius: 5,
    transform: [{ skewX: '-5deg' }],
  },
  treeLeaves: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 120,
  },
  leaf: {
    position: 'absolute',
    width: 60,
    height: 25,
    backgroundColor: '#00BFA6', // Tropical teal
    borderRadius: 100,
  },
  leaf1: {
    top: 10,
    left: 20,
    transform: [{ rotate: '30deg' }],
  },
  leaf2: {
    top: 20,
    left: 10,
    transform: [{ rotate: '60deg' }],
  },
  leaf3: {
    top: 40,
    left: 5,
    transform: [{ rotate: '90deg' }],
  },
  leaf4: {
    top: 60,
    left: 10,
    transform: [{ rotate: '120deg' }],
  },
  leaf5: {
    top: 70,
    left: 30,
    transform: [{ rotate: '150deg' }],
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
});