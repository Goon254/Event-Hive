// app/(auth)/register.tsx
import React, { useState, useRef, useEffect } from 'react';
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from '../services/enhancedImageService';
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
  Keyboard,
  ImageBackground
} from 'react-native';
import { useAuth } from '../AuthContext';
import validationUtils, { formatPhoneNumber } from '../utils/validation';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getStorage, ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import PrivacyTermsModal from '../components/PrivacyTermsModal';
import { isPasswordCompromised } from '../utils/authSecurity';
import { getLocationForProfile } from '../utils/geolocationUtils';
import { normalizeUri, uploadFile } from '../utils/fileUtils';
import * as FileSystem from 'expo-file-system';

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

export default function Register() {
  const { signUp, isLoading, error, signInWithGoogle, checkExistingAccount } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress] = useState(new Animated.Value(0));
  const [uploadingImage, setUploadingImage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Form data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null as string | null,
    profileImageUrl: null as string | null, // For storing the uploaded image URL
    phoneNumber: '',
    city: '',
    country: '',
    interests: [] as string[],
    userType: 'both',
    organizationName: '',
    acceptTerms: false,
    locationLoading: false // Flag for location detection loading state
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pwnedWarning, setPwnedWarning] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
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

  // Handle location detection
  const detectLocation = async () => {
    try {
      // Show privacy notice before requesting location
      Alert.alert(
        'Location Detection',
        'We\'ll use your current location to set your city and country. This helps you find nearby events. Your precise location will not be stored.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Allow',
            onPress: async () => {
              try {
                // Show loading indicator
                setUserData(prev => ({ ...prev, locationLoading: true }));
                
                // Get location data
                const locationData = await getLocationForProfile();
                
                // Update form with location data
                setUserData(prev => ({
                  ...prev,
                  city: locationData.city || prev.city,
                  country: locationData.country || prev.country,
                  locationLoading: false
                }));
                
                // Show success message if location was found
                if (locationData.city || locationData.country) {
                  Alert.alert(
                    'Location Detected',
                    `We've set your location to ${[
                      locationData.city,
                      locationData.country
                    ].filter(Boolean).join(', ')}.`
                  );
                } else {
                  Alert.alert(
                    'Location Not Found',
                    'We couldn\'t determine your location. Please enter it manually.'
                  );
                }
              } catch (error) {
                setUserData(prev => ({ ...prev, locationLoading: false }));
                Alert.alert(
                  'Location Error',
                  'There was a problem detecting your location. Please enter it manually.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in location detection:', error);
    }
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
  
  /**
   * Upload profile image using the enhanced image service
   * This function handles image uploads during registration when the user is not yet authenticated
   */
  const uploadProfileImage = async (imageUri: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Check for missing file
      if (!imageUri) {
        console.warn("No image URI provided for upload");
        return null;
      }
      
      console.log('Starting profile image upload during registration');
      
      // Configure upload options with detailed metadata
      const uploadOptions = {
        quality: ImageQuality.HIGH,
        maxWidth: ImageSize.MEDIUM,
        maxHeight: ImageSize.MEDIUM,
        compress: true,
        generateThumbnail: false,
        metadata: {
          uploadedDuring: 'registration',
          timestamp: new Date().toISOString(),
          appVersion: '1.0.0', // Add app version for tracking
          platform: Platform.OS
        },
        onProgress: (progress: number) => {
          // Handle progress updates
          console.log(`Profile image upload progress: ${(progress * 100).toFixed(1)}%`);
        }
      };
      
      // Use direct uploadImage method for more control
      const result = await enhancedImageService.uploadImage(
        imageUri,
        ImageType.PROFILE,
        uploadOptions
      );
      
      console.log('Profile image uploaded successfully, URL:', result.url);
      
      // Store the pendingPath flag in userData for later use after registration
      if (result.pendingPath) {
        console.log('Image uploaded to pending path, will be moved after registration');
        // You could store this information in AsyncStorage if needed for recovery
      }
      
      return result.url;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      
      // Provide user-friendly error message
      let errorMessage = 'There was a problem uploading your profile image. You can continue registration and add a photo later.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload images.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'An unknown error occurred during upload. Please try again.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please try a smaller image.';
      }
      
      Alert.alert('Upload Error', errorMessage);
      
      // Allow registration to continue without image
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Helper function to check image size - now using the enhanced image service
  const checkImageSize = async (uri: string): Promise<boolean> => {
    try {
      // Get file info to check size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('Image file info:', fileInfo);
      
      if (!fileInfo.exists) {
        console.warn('File does not exist');
        return false;
      }
      
      // Check if file is too large (>5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
        console.warn(`Image is large: ${(fileInfo.size/1024/1024).toFixed(2)}MB`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking image size:', error);
      return false;
    }
  };
  // Pick profile image using the enhanced image service
  const pickImage = async () => {
    try {
      // Use the enhanced image service
      
      // Use the enhanced service to pick an image
      const selectedImageUri = await enhancedImageService.pickImage({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        exif: false
      });
      
      if (selectedImageUri) {
        console.log('Selected image URI:', selectedImageUri);
        handleChange('profileImage', selectedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
      // Phone validation using the dedicated validation function
      if (userData.phoneNumber) {
        const phoneValidation = validationUtils.validatePhoneNumber(userData.phoneNumber);
        if (!phoneValidation.isValid) {
          newErrors.phoneNumber = phoneValidation.errors.join(', ');
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
  
  // Async validations for step-specific checks (email availability, compromised password)
  const validateStepAsync = async (): Promise<boolean> => {
    let isValid = validateStep();
    if (!isValid) return false;
    if (currentStep === 1) {
      try {
        // Check if email already in use
        setCheckingEmail(true);
        const methods = await checkExistingAccount(userData.email);
        setCheckingEmail(false);
        if (methods && methods.length > 0) {
          setErrors(prev => ({ ...prev, email: 'Email already in use' }));
          isValid = false;
        }
      } catch {
        setCheckingEmail(false);
      }
      try {
        setCheckingPassword(true);
        const compromised = await isPasswordCompromised(userData.password);
        setCheckingPassword(false);
        setPwnedWarning(compromised ? 'This password appears in known data breaches. Consider using a different one.' : '');
      } catch {
        setCheckingPassword(false);
      }
    }
    return isValid;
  };

  // Navigate to next step
  const nextStep = async () => {
    const stepValid = await validateStepAsync();
    if (stepValid) {
      if (currentStep < 3) {
        // Don't upload the image when transitioning between steps
        // We'll only upload once during final registration
        // This prevents duplicate processing and UI freezing
        
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
        // Process image in the background to avoid UI freezing
        // Note: We don't need to set loading state manually as it's handled by signUp function
        let profileImageUrl = userData.profileImageUrl;
        let imageUploadPromise: Promise<string | null> = Promise.resolve(null);
        
        if (userData.profileImage && !profileImageUrl) {
          console.log('Starting profile image upload in background');
          
          // Start the upload process but don't await it yet
          // This allows us to continue with registration while image uploads
          const profileImage = userData.profileImage; // Create a local non-null reference
          imageUploadPromise = (async () => {
            try {
              // Check image size first
              const isValidSize = await checkImageSize(profileImage);
              if (!isValidSize) {
                console.warn('Large image detected, continuing with upload anyway');
              }
              
              return await uploadProfileImage(profileImage);
            } catch (uploadError) {
              console.error('Failed to upload profile image during registration:', uploadError);
              return null;
            }
          })();
        }
        
        // Format phone number for consistent storage if provided
        const formattedPhoneNumber = userData.phoneNumber ?
          formatPhoneNumber(userData.phoneNumber) : null;
        
        // Prepare user data
        const userProfileData = {
          name: userData.name,
          email: userData.email,
          phoneNumber: formattedPhoneNumber,
          city: userData.city || null,
          country: userData.country || null,
          interests: userData.interests,
          userType: userData.userType,
          organizationName: userData.organizationName || null,
          profileImageUrl: null as string | null, // Will be updated after upload completes
          createdAt: new Date().toISOString()
        };
        
        // Now wait for the image upload to complete
        if (userData.profileImage && !profileImageUrl) {
          profileImageUrl = await imageUploadPromise;
          if (profileImageUrl) {
            console.log('Profile image uploaded successfully, URL:', profileImageUrl);
            userProfileData.profileImageUrl = profileImageUrl;
          }
        }
        
        // Register the user with Firebase Authentication
        await signUp(userData.email, userData.password, userData.name, userProfileData);
        
        // The profile document will be created in AuthContext or we can implement it here if needed
        // For example, we could add code here to update the user profile after registration
        // if the AuthContext doesn't do this automatically
        
        // If we needed to update the profile separately:
        // const user = auth.currentUser;
        // if (user) {
        //   const userDocRef = doc(db, "users", user.uid);
        //   await setDoc(userDocRef, {
        //     name: userData.name,
        //     email: userData.email,
        //     phoneNumber: userData.phoneNumber || null,
        //     city: userData.city || null,
        //     country: userData.country || null,
        //     interests: userData.interests,
        //     userType: userData.userType,
        //     organizationName: userData.organizationName || null,
        //     profileImageUrl: profileImageUrl,
        //     createdAt: new Date().toISOString()
        //   });
        // }
        
        console.log('Registration successful');
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
  
  // Handle Google Sign-Up
  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      // Navigation will be handled by AuthContext
    } catch (err) {
      // Error handling is done in AuthContext
      setGoogleLoading(false);
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
            {!!pwnedWarning && (
              <Text style={[styles.errorText, { marginTop: 6 }]}>{pwnedWarning}</Text>
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
        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickImage}
          disabled={isLoading || uploadingImage}
        >
          {uploadingImage ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#F97316" /> {/* Vibrant warm orange */}
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : userData.profileImage ? (
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
      
      <View style={styles.locationContainer}>
        <View style={styles.locationHeader}>
          <Text style={styles.inputLabel}>Location (Optional)</Text>
          <TouchableOpacity
            style={styles.detectLocationButton}
            onPress={detectLocation}
            disabled={isLoading || userData.locationLoading}
          >
            {userData.locationLoading ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : (
              <>
                <MaterialIcons name="my-location" size={16} color="#F97316" />
                <Text style={styles.detectLocationText}>Detect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.rowContainer}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={userData.city}
              onChangeText={(text) => handleChange('city', text)}
              editable={!isLoading && !userData.locationLoading}
            />
          </View>
          
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8, marginBottom: 0 }]}>
            <TextInput
              style={styles.input}
              placeholder="Country"
              value={userData.country}
              onChangeText={(text) => handleChange('country', text)}
              editable={!isLoading && !userData.locationLoading}
            />
          </View>
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
              <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>
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
                    <MaterialIcons name="check" size={20} color="#F97316" />
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
      <ImageBackground
        source={require('../../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 191, 166, 0.7)', 'rgba(252, 211, 77, 0.8)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={prevStep}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join Our Island</Text>
            <View style={{ width: 24 }} />
          </View>
      
          {renderStepIndicator()}
          
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <WaveAnimation />
              
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              }) }] }}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </Animated.View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, (isLoading || uploadingImage) && styles.buttonDisabled]}
              onPress={nextStep}
              disabled={isLoading || uploadingImage}
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
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <TouchableOpacity
                  style={[styles.googleButton, (isLoading || googleLoading || uploadingImage) && styles.buttonDisabled]}
                  onPress={handleGoogleSignUp}
                  disabled={isLoading || googleLoading || uploadingImage}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome name="google" size={20} color="#FFFFFF" style={styles.googleIcon} />
                      <Text style={styles.googleButtonText}>Sign up with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
          </View>
            </View>
          </ScrollView>
          
          {renderInterestsModal()}
          <PrivacyTermsModal
            visible={showPrivacyModal}
            onClose={() => setShowPrivacyModal(false)}
            type="privacy"
          />
          <PrivacyTermsModal
            visible={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            type="terms"
          />
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
    backgroundColor: 'rgba(0, 191, 166, 0.3)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stepIndicatorContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#00BFA6', // Tropical teal
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  activeStep: {
    backgroundColor: '#00BFA6', // Tropical teal
    borderColor: '#00BFA6', // Tropical teal
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFA6', // Tropical teal
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stepDescription: {
    fontSize: 16,
    color: '#166534', // Deep green
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0', // Soft mint
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
  uploadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#6B7280',
    marginTop: 8,
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
    borderColor: '#00BFA6', // Tropical teal
    backgroundColor: 'rgba(0, 191, 166, 0.1)', // Tropical teal with transparency
  },
  userTypeText: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  userTypeTextSelected: {
    color: '#00BFA6', // Tropical teal
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
    backgroundColor: '#00BFA6', // Tropical teal
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
    backgroundColor: '#00BFA6', // Tropical teal
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
  locationContainer: {
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 191, 166, 0.1)', // Tropical teal with transparency
  },
  detectLocationText: {
    color: '#00BFA6', // Tropical teal
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    backgroundColor: '#00BFA6', // Tropical teal
    borderColor: '#00BFA6', // Tropical teal
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
    color: '#00BFA6', // Tropical teal
    fontWeight: '500',
  },
  buttonsContainer: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFA6', // Tropical teal
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
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#DB4437',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#00BFA6', // Tropical teal
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
    backgroundColor: 'rgba(0, 191, 166, 0.1)', // Tropical teal with transparency
  },
  interestOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  interestOptionTextSelected: {
    fontWeight: '600',
    color: '#00BFA6', // Tropical teal
  },
  modalDoneButton: {
    backgroundColor: '#00BFA6', // Tropical teal
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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