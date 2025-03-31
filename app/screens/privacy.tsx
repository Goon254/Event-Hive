// app/screens/privacy.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  locationSharing: boolean;
  activitySharing: boolean;
  eventVisibility: 'public' | 'private' | 'friends';
  dataCollection: boolean;
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  lastPasswordChange: Timestamp | null;
  securityUpdates: boolean;
}

export default function PrivacyScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Privacy and security settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    locationSharing: true,
    activitySharing: true,
    eventVisibility: 'public',
    dataCollection: true,
    twoFactorAuth: false,
    loginNotifications: true,
    lastPasswordChange: null,
    securityUpdates: true,
  });
  
  // Password change modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordIsChanging, setPasswordIsChanging] = useState(false);
  
  // Activity log
  const [activityLog, setActivityLog] = useState<{ action: string; timestamp: Timestamp; device?: string; location?: string }[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  // Fetch privacy settings from database
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settingsRef = doc(db, 'privacySettings', user.id);
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as PrivacySettings;
          setPrivacySettings(data);
        } else {
          // Create default settings if they don't exist
          await setDoc(settingsRef, {
            profileVisibility: 'public',
            locationSharing: true,
            activitySharing: true,
            eventVisibility: 'public',
            dataCollection: true,
            twoFactorAuth: false,
            loginNotifications: true,
            lastPasswordChange: null,
            securityUpdates: true,
          });
        }
        
        // Fetch activity log
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().activityLog) {
          // Sort by timestamp in descending order (newest first)
          const logEntries = userDoc.data().activityLog.sort(
            (a: { timestamp: Timestamp }, b: { timestamp: Timestamp }) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
          );
          setActivityLog(logEntries);
        }
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
        Alert.alert('Error', 'Failed to load privacy settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // Update a privacy setting
  const updateSetting = async (
    setting: keyof PrivacySettings, 
    value: any
  ) => {
    if (!user) return;
    
    // Update local state immediately for responsive UI
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    try {
      const settingsRef = doc(db, 'privacySettings', user.id);
      await updateDoc(settingsRef, {
        [setting]: value
      });
      
      // Log this activity
      await logActivity(`Updated ${setting} setting`);
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
      Alert.alert('Error', `Failed to update ${setting}`);
      
      // Revert UI state if there was an error
      setPrivacySettings(prev => ({
        ...prev,
        [setting]: privacySettings[setting]
      }));
    }
  };
  
  // Log user activity to the database
  const logActivity = async (action: string) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      
      // Get approximate location
      let locationStr = 'Unknown';
      
      // In a real app, you might use geolocation
      // For now we'll simulate it
      locationStr = 'San Francisco, CA';
      
      // Get device info
      const deviceStr = Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
      
      const activityEntry = {
        action,
        timestamp: Timestamp.now(),
        device: deviceStr,
        location: locationStr
      };
      
      // Add to database
      await updateDoc(userRef, {
        activityLog: arrayUnion(activityEntry)
      });
      
      // Add to local state
      setActivityLog([activityEntry, ...activityLog]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    if (!auth.currentUser || !user) return;
    
    // Reset error state
    setPasswordError('');
    
    // Validate input
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordIsChanging(true);
    
    try {
      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Now change password
      await updatePassword(auth.currentUser, newPassword);
      
      // Update last password change timestamp
      const settingsRef = doc(db, 'privacySettings', user.id);
      await updateDoc(settingsRef, {
        lastPasswordChange: Timestamp.now()
      });
      
      // Update local state
      setPrivacySettings(prev => ({
        ...prev,
        lastPasswordChange: Timestamp.now()
      }));
      
      // Log this activity
      await logActivity('Changed account password');
      
      // Success message and close modal
      Alert.alert('Success', 'Your password has been updated');
      setPasswordModalVisible(false);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please ensure your current password is correct.');
    } finally {
      setPasswordIsChanging(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate days since last password change
  const getDaysSincePasswordChange = () => {
    if (!privacySettings.lastPasswordChange) return 'Never';
    
    const now = new Date();
    const changeDate = privacySettings.lastPasswordChange.toDate();
    const diffTime = Math.abs(now.getTime() - changeDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="form-textbox-password" size={22} color="#6366F1" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Password</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                Last changed: {getDaysSincePasswordChange()}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="two-factor-authentication" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Switch
                  value={privacySettings.twoFactorAuth}
                  onValueChange={(value) => updateSetting('twoFactorAuth', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.twoFactorAuth ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="mail" size={22} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Login Notifications</Text>
                <Switch
                  value={privacySettings.loginNotifications}
                  onValueChange={(value) => updateSetting('loginNotifications', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.loginNotifications ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Get notified when someone logs into your account
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowActivityLog(!showActivityLog)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="history" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Activity Log</Text>
                <FontAwesome name={showActivityLog ? "chevron-up" : "chevron-down"} size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                View recent account activity
              </Text>
            </View>
          </TouchableOpacity>
          
          {showActivityLog && activityLog.length > 0 && (
            <View style={styles.activityLogContainer}>
              {activityLog.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <MaterialCommunityIcons name="shield-account" size={16} color="#6B7280" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.action}</Text>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                      {activity.device && (
                        <Text style={styles.activityDevice}>{activity.device}</Text>
                      )}
                    </View>
                    {activity.location && (
                      <Text style={styles.activityLocation}>{activity.location}</Text>
                    )}
                  </View>
                </View>
              ))}
              {activityLog.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => router.push('//screens/activity-log')}
                >
                  <Text style={styles.viewMoreText}>View Full Activity Log</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Privacy Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="account-eye" size={22} color="#3B82F6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Profile Visibility</Text>
                <TouchableOpacity 
                  style={styles.valueSelector}
                  onPress={() => {
                    // Toggle between public, friends, private
                    const currentValue = privacySettings.profileVisibility;
                    let newValue: 'public' | 'private' | 'friends';
                    
                    if (currentValue === 'public') newValue = 'friends';
                    else if (currentValue === 'friends') newValue = 'private';
                    else newValue = 'public';
                    
                    updateSetting('profileVisibility', newValue);
                  }}
                >
                  <Text style={styles.valueSelectorText}>
                    {privacySettings.profileVisibility.charAt(0).toUpperCase() + 
                     privacySettings.profileVisibility.slice(1)}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Control who can see your profile information
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="location" size={22} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Location Sharing</Text>
                <Switch
                  value={privacySettings.locationSharing}
                  onValueChange={(value) => updateSetting('locationSharing', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.locationSharing ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Allow the app to access your location for events
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={22} color="#EC4899" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Activity Sharing</Text>
                <Switch
                  value={privacySettings.activitySharing}
                  onValueChange={(value) => updateSetting('activitySharing', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.activitySharing ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Share your event activity with connections
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="calendar-search" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Event Visibility</Text>
                <TouchableOpacity 
                  style={styles.valueSelector}
                  onPress={() => {
                    // Toggle between public, friends, private
                    const currentValue = privacySettings.eventVisibility;
                    let newValue: 'public' | 'private' | 'friends';
                    
                    if (currentValue === 'public') newValue = 'friends';
                    else if (currentValue === 'friends') newValue = 'private';
                    else newValue = 'public';
                    
                    updateSetting('eventVisibility', newValue);
                  }}
                >
                  <Text style={styles.valueSelectorText}>
                    {privacySettings.eventVisibility.charAt(0).toUpperCase() + 
                     privacySettings.eventVisibility.slice(1)}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Control who can see events you've created
              </Text>
            </View>
          </View>
        </View>
        
        {/* Data & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="chart-bar" size={22} color="#6366F1" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Analytics & Improvements</Text>
                <Switch
                  value={privacySettings.dataCollection}
                  onValueChange={(value) => updateSetting('dataCollection', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.dataCollection ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Help improve the app by sharing usage data
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Security Updates</Text>
                <Switch
                  value={privacySettings.securityUpdates}
                  onValueChange={(value) => updateSetting('securityUpdates', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : privacySettings.securityUpdates ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Receive notifications about security updates
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('//screens/privacy-policy')}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="file-document" size={22} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                Read our privacy policy
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('//screens/data-deletion')}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="delete" size={22} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Data Deletion</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                Request to delete your account and data
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Password Change Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity 
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <FontAwesome name="times" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {passwordError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your current password"
                  secureTextEntry={true}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter your new password"
                  secureTextEntry={true}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your new password"
                  secureTextEntry={true}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <View style={styles.requirementItem}>
                  <MaterialCommunityIcons 
                    name={newPassword.length >= 8 ? "check-circle" : "circle-outline"} 
                    size={14} 
                    color={newPassword.length >= 8 ? "#10B981" : "#6B7280"} 
                  />
                  <Text style={styles.requirementText}>At least 8 characters</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialCommunityIcons 
                    name={/[A-Z]/.test(newPassword) ? "check-circle" : "circle-outline"} 
                    size={14} 
                    color={/[A-Z]/.test(newPassword) ? "#10B981" : "#6B7280"} 
                  />
                  <Text style={styles.requirementText}>At least one uppercase letter</Text>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialCommunityIcons 
                    name={/[0-9]/.test(newPassword) ? "check-circle" : "circle-outline"} 
                    size={14} 
                    color={/[0-9]/.test(newPassword) ? "#10B981" : "#6B7280"} 
                  />
                  <Text style={styles.requirementText}>At least one number</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
                disabled={passwordIsChanging}
              >
                {passwordIsChanging ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...cardShadow,
  },sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  valueSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  valueSelectorText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 6,
  },
  activityLogContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityDevice: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  activityLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    ...cardShadow,
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
  modalBody: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
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
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordRequirements: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  changePasswordButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonShadow,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
});