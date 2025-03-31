// app/(auth)/register.tsx
import React, { useState, useRef } from 'react';
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
  Image,
  Modal,
  Dimensions,
  Animated,
  Keyboard
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils from '../utils/validation';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Define user interests/categories
const USER_INTERESTS = [
  'Music', 'Technology', 'Business', 'Arts', 'Sports',
  'Food', 'Health', 'Education', 'Travel', 'Networking',
  'Fashion', 'Science', 'Gaming', 'Outdoor', 'Photography'
];

// Define user types
const USER_TYPES = [
  { id: 'attendee', label: 'Attendee', icon: 'person' },
  { id: 'organizer', label: 'Organizer', icon: 'event' },
  { id: 'both', label: 'Both', icon: 'groups' }
];

export default function Register() {
  const { signUp, isLoading, error } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress] = useState(new Animated.Value(0));
  
  // Form data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
    phoneNumber: '',
    city: '',
    country: '',
    interests: [] as string[],
    userType: 'both',
    organizationName: '',
    acceptTerms: false
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    terms: '',
  });
  
  // UI states
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return score;
  };
  
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is changed
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Update password strength if password field is changed
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };
  
  // Handle interests selection
  const toggleInterest = (interest: string) => {
    if (userData.interests.includes(interest)) {
      setUserData(prev => ({
        ...prev,
        interests: prev.interests.filter(i => i !== interest)
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };
  
  // Pick profile image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleChange('profileImage', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Validate current step
  const validateStep = () => {
    let isValid = true;
    let newErrors = { ...errors };
    
    if (currentStep === 1) {
      // Validate basic information
      const nameValidation = validationUtils.validateName(userData.name);
      const emailValidation = validationUtils.validateEmail(userData.email);
      const passwordValidation = validationUtils.validatePassword(userData.password);
      const confirmPasswordValidation = validationUtils.validateConfirmPassword(
        userData.password, userData.confirmPassword
      );
      
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.errors.join(', ');
        isValid = false;
      }
      
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.errors.join(', ');
        isValid = false;
      }
      
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join(', ');
        isValid = false;
      }
      
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.errors.join(', ');
        isValid = false;
      }
    } else if (currentStep === 2) {
      // Phone validation is optional
      if (userData.phoneNumber) {
        if (!/^\+?[0-9]{10,15}$/.test(userData.phoneNumber)) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
          isValid = false;
        }
      }
    } else if (currentStep === 3) {
      // Terms validation
      if (!userData.acceptTerms) {
        newErrors.terms = 'You must accept the terms and privacy policy';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        // Update progress bar animation
        Animated.timing(progress, {
          toValue: currentStep / 3,
          duration: 300,
          useNativeDriver: false
        }).start();
        
        setCurrentStep(prev => prev + 1);
        
        // Scroll to top
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      } else {
        // Submit form on last step
        handleRegister();
      }
    }
  };
  
  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      // Update progress bar animation
      Animated.timing(progress, {
        toValue: (currentStep - 2) / 3,
        duration: 300,
        useNativeDriver: false
      }).start();
      
      setCurrentStep(prev => prev - 1);
      
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    } else {
      // Navigate back to login
      router.back();
    }
  };
  
  // Submit registration
  const handleRegister = async () => {
    if (validateStep()) {
      try {
        // Create a user profile object with all the data
        const userProfile = {
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber || null,
          city: userData.city || null,
          country: userData.country || null,
          interests: userData.interests,
          userType: userData.userType,
          organizationName: userData.organizationName || null,
          profileImage: userData.profileImage || null
        };
        
        await signUp(userData.email, userData.password, userData.name, userProfile);
        // Navigation will be handled by AuthContext
      } catch (err) {
        // Fallback error handling if not caught by context
        let errorMessage = 'An unknown error occurred';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        Alert.alert('Registration Failed', errorMessage);
      }
    }
  };
  
  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <Animated.View 
        style={[
          styles.progressBar,
          { width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          })}
        ]}
      />
      <View style={styles.stepsContainer}>
        {[1, 2, 3].map((step) => (
          <TouchableOpacity 
            key={step} 
            style={[
              styles.stepCircle,
              currentStep >= step && styles.activeStep,
              currentStep > step && styles.completedStep
            ]}
            onPress={() => {
              if (step < currentStep) {
                setCurrentStep(step);
                Animated.timing(progress, {
                  toValue: (step - 1) / 3,
                  duration: 300,
                  useNativeDriver: false
                }).start();
              }
            }}
          >
            {currentStep > step ? (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.activeStepNumber
              ]}>
                {step}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.stepLabelsContainer}>
        <Text style={[
          styles.stepLabel,
          currentStep >= 1 && styles.activeStepLabel
        ]}>
          Account
        </Text>
        <Text style={[
          styles.stepLabel,
          currentStep >= 2 && styles.activeStepLabel
        ]}>
          Profile
        </Text>
        <Text style={[
          styles.stepLabel,
          currentStep >= 3 && styles.activeStepLabel
        ]}>
          Preferences
        </Text>
      </View>
    </View>
  );
  
  // Render step 1: Basic Account Info
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepDescription}>
        Enter your basic information to get started
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Your full name"
          value={userData.name}
          onChangeText={(text) => handleChange('name', text)}
          autoCapitalize="words"
          editable={!isLoading}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="your.email@example.com"
          value={userData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Create a strong password"
          value={userData.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : (
          <View style={styles.passwordStrengthContainer}>
            <View style={styles.strengthMeterContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View 
                  key={level}
                  style={[
                    styles.strengthSegment,
                    { 
                      backgroundColor: passwordStrength >= level 
                        ? getPasswordStrengthColor(passwordStrength) 
                        : '#E5E7EB'
                    }
                  ]}
                />
              ))}
            </View>
            {userData.password && (
              <Text style={[
                styles.strengthText,
                { color: getPasswordStrengthColor(passwordStrength) }
              ]}>
                {getPasswordStrengthLabel(passwordStrength)}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Re-enter your password"
          value={userData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        {errors.confirmPassword ? (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        ) : null}
      </View>
    </View>
  );
  
  // Render step 2: Profile Info
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepDescription}>
        Add more details to personalize your experience
      </Text>
      
      <View style={styles.profileImageContainer}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {userData.profileImage ? (
            <Image 
              source={{ uri: userData.profileImage }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <MaterialIcons name="add-a-photo" size={32} color="#6B7280" />
              <Text style={styles.imagePickerText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="+1 (234) 567-8910"
          value={userData.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
        {errors.phoneNumber ? (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        ) : null}
      </View>
      
      <View style={styles.rowContainer}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>City (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Your city"
            value={userData.city}
            onChangeText={(text) => handleChange('city', text)}
            editable={!isLoading}
          />
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Country (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Your country"
            value={userData.country}
            onChangeText={(text) => handleChange('country', text)}
            editable={!isLoading}
          />
        </View>
      </View>
      
      <View style={styles.userTypeContainer}>
        <Text style={styles.inputLabel}>I am a:</Text>
        <View style={styles.userTypeOptions}>
          {USER_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.userTypeOption,
                userData.userType === type.id && styles.userTypeSelected
              ]}
              onPress={() => handleChange('userType', type.id)}
            >
              <MaterialIcons 
                name={type.icon as any} 
                size={24} 
                color={userData.userType === type.id ? '#007AFF' : '#6B7280'} 
              />
              <Text style={[
                styles.userTypeText,
                userData.userType === type.id && styles.userTypeTextSelected
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {(userData.userType === 'organizer' || userData.userType === 'both') && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Organization Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Company or organization name"
            value={userData.organizationName}
            onChangeText={(text) => handleChange('organizationName', text)}
            editable={!isLoading}
          />
        </View>
      )}
    </View>
  );
  
  // Render step 3: Preferences
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Preferences</Text>
      <Text style={styles.stepDescription}>
        Choose your interests to discover relevant events
      </Text>
      
      <View style={styles.interestsContainer}>
        <Text style={styles.inputLabel}>Your Interests (Select at least one)</Text>
        
        <View style={styles.selectedInterestsContainer}>
          {userData.interests.length > 0 ? (
            <View style={styles.selectedInterests}>
              {userData.interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{interest}</Text>
                  <TouchableOpacity 
                    onPress={() => toggleInterest(interest)}
                    style={styles.interestChipRemove}
                  >
                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noInterestsText}>
              No interests selected yet
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.selectInterestsButton}
          onPress={() => setShowInterestsModal(true)}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.selectInterestsText}>
            {userData.interests.length > 0 ? 'Edit Interests' : 'Select Interests'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.termsContainer}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => handleChange('acceptTerms', !userData.acceptTerms)}
        >
          <View style={[
            styles.checkbox,
            userData.acceptTerms && styles.checkboxChecked
          ]}>
            {userData.acceptTerms && (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => Alert.alert('Terms', 'Terms and Conditions will be displayed here.')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => Alert.alert('Privacy', 'Privacy Policy will be displayed here.')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </TouchableOpacity>
        {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}
      </View>
      
      {error && <Text style={styles.generalError}>{error}</Text>}
    </View>
  );
  
  // Render interests modal
  const renderInterestsModal = () => (
    <Modal
      visible={showInterestsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowInterestsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        <View style={styles.interestsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Your Interests</Text>
            <TouchableOpacity onPress={() => setShowInterestsModal(false)}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.interestsList}>
              {USER_INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestOption,
                    userData.interests.includes(interest) && styles.interestOptionSelected
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.interestOptionText,
                    userData.interests.includes(interest) && styles.interestOptionTextSelected
                  ]}>
                    {interest}
                  </Text>
                  {userData.interests.includes(interest) && (
                    <MaterialIcons name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowInterestsModal(false)}
          >
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Password strength utilities
  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return '#EF4444'; // Red
    if (strength <= 3) return '#F59E0B'; // Orange/Amber
    return '#10B981'; // Green
  };
  
  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 3) return 'Moderate';
    return 'Strong';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {renderStepIndicator()}
      
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {currentStep < 3 ? 'Continue' : 'Sign Up'}
                  </Text>
                  {currentStep < 3 && (
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  )}
                </>
              )}
            </TouchableOpacity>
            
            {currentStep === 1 && (
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {renderInterestsModal()}
    </KeyboardAvoidingView>
  );
}

// Continuation of styles for app/(auth)/register.tsx

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepIndicatorContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginBottom: 12,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStep: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  completedStep: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#1F2937',
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  generalError: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  strengthMeterContainer: {
    flexDirection: 'row',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthSegment: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  userTypeSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  userTypeText: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  userTypeTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  interestsContainer: {
    marginBottom: 24,
  },
  selectedInterestsContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    minHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  selectedInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  interestChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 4,
  },
  interestChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noInterestsText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  selectInterestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  selectInterestsText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonsContainer: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  interestsModal: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    maxHeight: height * 0.5,
  },
  interestsList: {
    padding: 16,
  },
  interestOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  interestOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  interestOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  interestOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  modalDoneButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});