// app/screens/personal-information.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import * as ImagePicker from 'expo-image-picker';

interface UserInformation {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  dateOfBirth: string;
  profilePicture: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export default function PersonalInformationScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // User information state
  const [userInfo, setUserInfo] = useState<UserInformation>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    profilePicture: '',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  });

  // Fetch user data
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // Simulate API call to fetch user details
      setTimeout(() => {
        setUserInfo({
          name: user.name || 'Your Name',
          email: user.email || 'email@example.com',
          phone: '+1 (555) 123-4567',
          bio: 'Event enthusiast and networking professional.',
          location: 'San Francisco, CA',
          dateOfBirth: '1990-01-01',
          profilePicture: user.avatar || 'https://via.placeholder.com/150',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        });
        setProfileImage(user.avatar || 'https://via.placeholder.com/150');
        setIsLoading(false);
      }, 800);
    }
  }, [user]);

  const handleGoBack = () => {
    if (isEditMode) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Validate inputs
    if (!userInfo.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      setIsSaving(false);
      return;
    }
    
    // Simulate API call to update user profile
    setTimeout(() => {
      setIsSaving(false);
      setIsEditMode(false);
      Alert.alert('Success', 'Your profile has been updated successfully');
    }, 1000);
  };

  const pickImage = async () => {
    if (!isEditMode) return;
    
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setIsImageChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // If leaving edit mode without saving
      if (isImageChanged) {
        Alert.alert(
          'Discard Changes?',
          'You have unsaved changes. Are you sure you want to discard them?',
          [
            { text: 'Stay Editing', style: 'cancel' },
            { 
              text: 'Discard', 
              style: 'destructive', 
              onPress: () => {
                setIsEditMode(false);
                setProfileImage(userInfo.profilePicture);
                setIsImageChanged(false);
              } 
            }
          ]
        );
      } else {
        setIsEditMode(false);
      }
    } else {
      setIsEditMode(true);
    }
  };

  // Handle text input changes
  const handleInputChange = (field: keyof UserInformation, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (type: keyof UserInformation['notifications']) => {
    setUserInfo(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  if (isLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <TouchableOpacity 
          onPress={handleGoBack}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Personal Information</Text>
        
        <TouchableOpacity 
          onPress={toggleEditMode}
          disabled={isSaving}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {isEditMode ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImage || userInfo.profilePicture }}
              style={styles.profileImage}
              accessibilityLabel="Profile picture"
            />
            {isEditMode && (
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={pickImage}
              >
                <FontAwesome name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.changePhotoText}>
            {isEditMode ? 'Tap to change profile photo' : ''}
          </Text>
        </View>
        
        {/* Personal Information Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.textInput, !isEditMode && styles.disabledInput]}
              value={userInfo.name}
              onChangeText={(text) => handleInputChange('name', text)}
              editable={isEditMode}
              placeholder="Your full name"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={userInfo.email}
              editable={false} // Email should not be editable
              keyboardType="email-address"
              placeholder="Your email address"
            />
            <Text style={styles.inputHelperText}>
              Email cannot be changed for security reasons
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, !isEditMode && styles.disabledInput]}
              value={userInfo.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              editable={isEditMode}
              keyboardType="phone-pad"
              placeholder="Your phone number"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TextInput
              style={[styles.textInput, !isEditMode && styles.disabledInput]}
              value={userInfo.dateOfBirth}
              onChangeText={(text) => handleInputChange('dateOfBirth', text)}
              editable={isEditMode}
              placeholder="YYYY-MM-DD"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={[styles.textInput, !isEditMode && styles.disabledInput]}
              value={userInfo.location}
              onChangeText={(text) => handleInputChange('location', text)}
              editable={isEditMode}
              placeholder="City, State"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textArea, !isEditMode && styles.disabledInput]}
              value={userInfo.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              editable={isEditMode}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tell us about yourself"
            />
          </View>
        </View>
        
        {/* Notification Preferences */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Email Notifications</Text>
              <Text style={styles.toggleDescription}>
                Receive event updates and reminders via email
              </Text>
            </View>
            <Switch
              value={userInfo.notifications.email}
              onValueChange={() => handleNotificationToggle('email')}
              disabled={!isEditMode}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : userInfo.notifications.email ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleDescription}>
                Receive alerts and reminders on your device
              </Text>
            </View>
            <Switch
              value={userInfo.notifications.push}
              onValueChange={() => handleNotificationToggle('push')}
              disabled={!isEditMode}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : userInfo.notifications.push ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>SMS Notifications</Text>
              <Text style={styles.toggleDescription}>
                Receive important event updates via text message
              </Text>
            </View>
            <Switch
              value={userInfo.notifications.sms}
              onValueChange={() => handleNotificationToggle('sms')}
              disabled={!isEditMode}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : userInfo.notifications.sms ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>
        
        {/* Save Button */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Spacer for keyboard */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...cardShadow,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileImageSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...cardShadow,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  formSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  inputHelperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonShadow,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
});