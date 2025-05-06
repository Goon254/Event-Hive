import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import ScreenWrapper from '../components/common/ScreenWrapper';

// Define styles first to avoid "used before declaration" errors
const styles = StyleSheet.create({
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
  backButton: {
    padding: 8,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  visibilitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  visibilityText: {
    fontSize: 14,
    color: '#1F2937',
    marginRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  policyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});

// Enhanced PrivacySettings interface (we'll update the actual types file later)
interface EnhancedPrivacySettings {
  // Existing settings
  showOnlineStatus: boolean;
  allowContactDiscovery: boolean;
  allowRecommendations: boolean;
  encryptMessages: boolean;
  
  // User data controls
  allowDataCollection: boolean;
  allowUsageAnalytics: boolean;
  allowCrashReporting: boolean;
  
  // Permission management
  cameraPermission: boolean;
  locationPermission: boolean;
  contactsPermission: boolean;
  notificationsPermission: boolean;
  
  // Tracking preferences
  allowAdPersonalization: boolean;
  allowCrossSiteTracking: boolean;
  
  // Third-party data sharing
  allowThirdPartySharing: boolean;
  allowPartnerSharing: boolean;
  
  // Notification privacy
  hideNotificationContent: boolean;
  muteNotificationsWhenActive: boolean;
  
  // Content visibility
  profileVisibility: 'public' | 'connections' | 'private';
  activityVisibility: 'public' | 'connections' | 'private';
  
  // Security
  twoFactorEnabled: boolean;
  biometricLoginEnabled: boolean;
  autoLockEnabled: boolean;
  passwordChangeRequired: boolean;
}

/**
 * Privacy Settings Screen
 * Comprehensive screen for managing all privacy and security settings
 */
export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    privacySettings, 
    isLoading, 
    saveSettings, 
    updatePrivacySetting 
  } = usePrivacySettings(user as any);
  
  // State for enhanced settings not in the original PrivacySettings
  const [enhancedSettings, setEnhancedSettings] = useState({
    allowDataCollection: true,
    allowUsageAnalytics: true,
    allowCrashReporting: true,
    
    cameraPermission: true,
    locationPermission: false,
    contactsPermission: true,
    notificationsPermission: true,
    
    allowAdPersonalization: false,
    allowCrossSiteTracking: false,
    
    allowThirdPartySharing: false,
    allowPartnerSharing: false,
    
    hideNotificationContent: false,
    muteNotificationsWhenActive: true,
    
    profileVisibility: 'connections' as 'public' | 'connections' | 'private',
    activityVisibility: 'connections' as 'public' | 'connections' | 'private',
    
    twoFactorEnabled: false,
    biometricLoginEnabled: true,
    autoLockEnabled: true,
    passwordChangeRequired: false
  });
  
  // Handle toggle for original privacy settings
  const handleToggle = (key: keyof typeof privacySettings) => {
    updatePrivacySetting(key, !privacySettings[key]);
  };
  
  // Handle toggle for enhanced settings
  const handleEnhancedToggle = (key: keyof typeof enhancedSettings) => {
    setEnhancedSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // In a real app, we would save these settings to the backend
    // For now, we'll just show an alert
    Alert.alert(
      'Setting Updated',
      `${key} has been ${!enhancedSettings[key] ? 'enabled' : 'disabled'}.`,
      [{ text: 'OK' }]
    );
  };
  
  // Handle visibility selection
  const handleVisibilityChange = (
    key: 'profileVisibility' | 'activityVisibility', 
    value: 'public' | 'connections' | 'private'
  ) => {
    setEnhancedSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // In a real app, we would save these settings to the backend
    Alert.alert(
      'Visibility Updated',
      `Your ${key === 'profileVisibility' ? 'profile' : 'activity'} visibility has been set to ${value}.`,
      [{ text: 'OK' }]
    );
  };
  
  // Handle security actions
  const handleSecurityAction = (action: string) => {
    if (action === 'enable2FA') {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will redirect you to set up two-factor authentication for your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setEnhancedSettings(prev => ({
                ...prev,
                twoFactorEnabled: true
              }));
              // In a real app, this would navigate to the 2FA setup screen
            }
          }
        ]
      );
    } else if (action === 'changePassword') {
      Alert.alert(
        'Change Password',
        'This will redirect you to change your password.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // In a real app, this would navigate to the password change screen
              router.push('/screens/change-password' as any);
            }
          }
        ]
      );
    } else if (action === 'deleteAccount') {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              // In a real app, this would trigger account deletion
              Alert.alert(
                'Account Deletion Requested',
                'Your account deletion request has been submitted. You will receive an email with further instructions.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }
  
  // Create back button for header
  const headerBackButton = (
    <TouchableOpacity
      onPress={() => router.back()}
      accessibilityLabel="Go back"
      accessibilityHint="Navigates to the previous screen"
      style={styles.backButton}
    >
      <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
  
  return (
    <ScreenWrapper
      backgroundColor="#F9FAFB"
      statusBarStyle="light-content"
      header={{
        title: "Privacy & Security",
        rightContent: <View style={{ width: 40 }} />,
        gradientColors: ['#2563EB', '#4F46E5']
      }}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Show Online Status</Text>
              <Text style={styles.settingDescription}>
                Allow others to see when you're online
              </Text>
            </View>
            <Switch
              value={privacySettings.showOnlineStatus}
              onValueChange={() => handleToggle('showOnlineStatus')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacySettings.showOnlineStatus ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle show online status"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Contact Discovery</Text>
              <Text style={styles.settingDescription}>
                Allow finding connections through your contacts
              </Text>
            </View>
            <Switch
              value={privacySettings.allowContactDiscovery}
              onValueChange={() => handleToggle('allowContactDiscovery')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacySettings.allowContactDiscovery ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle contact discovery"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Connection Recommendations</Text>
              <Text style={styles.settingDescription}>
                Receive suggestions for new connections
              </Text>
            </View>
            <Switch
              value={privacySettings.allowRecommendations}
              onValueChange={() => handleToggle('allowRecommendations')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacySettings.allowRecommendations ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle connection recommendations"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Message Encryption</Text>
              <Text style={styles.settingDescription}>
                Encrypt all messages for enhanced privacy
              </Text>
            </View>
            <Switch
              value={privacySettings.encryptMessages}
              onValueChange={() => handleToggle('encryptMessages')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacySettings.encryptMessages ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle message encryption"
            />
          </View>
        </View>
        
        {/* Data Collection & Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection & Usage</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Data Collection</Text>
              <Text style={styles.settingDescription}>
                Allow collection of app usage data to improve services
              </Text>
            </View>
            <Switch
              value={enhancedSettings.allowDataCollection}
              onValueChange={() => handleEnhancedToggle('allowDataCollection')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.allowDataCollection ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle data collection"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Usage Analytics</Text>
              <Text style={styles.settingDescription}>
                Share anonymous usage statistics
              </Text>
            </View>
            <Switch
              value={enhancedSettings.allowUsageAnalytics}
              onValueChange={() => handleEnhancedToggle('allowUsageAnalytics')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.allowUsageAnalytics ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle usage analytics"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Crash Reporting</Text>
              <Text style={styles.settingDescription}>
                Send crash reports to help fix issues
              </Text>
            </View>
            <Switch
              value={enhancedSettings.allowCrashReporting}
              onValueChange={() => handleEnhancedToggle('allowCrashReporting')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.allowCrashReporting ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle crash reporting"
            />
          </View>
        </View>
        
        {/* App Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Camera Access</Text>
              <Text style={styles.settingDescription}>
                Allow the app to use your camera
              </Text>
            </View>
            <Switch
              value={enhancedSettings.cameraPermission}
              onValueChange={() => handleEnhancedToggle('cameraPermission')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.cameraPermission ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle camera permission"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Location Access</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your location
              </Text>
            </View>
            <Switch
              value={enhancedSettings.locationPermission}
              onValueChange={() => handleEnhancedToggle('locationPermission')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.locationPermission ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle location permission"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Contacts Access</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your contacts
              </Text>
            </View>
            <Switch
              value={enhancedSettings.contactsPermission}
              onValueChange={() => handleEnhancedToggle('contactsPermission')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.contactsPermission ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle contacts permission"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Allow the app to send you notifications
              </Text>
            </View>
            <Switch
              value={enhancedSettings.notificationsPermission}
              onValueChange={() => handleEnhancedToggle('notificationsPermission')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.notificationsPermission ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle notifications permission"
            />
          </View>
        </View>
        
        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
            <Switch
              value={enhancedSettings.twoFactorEnabled}
              onValueChange={() => {
                if (!enhancedSettings.twoFactorEnabled) {
                  handleSecurityAction('enable2FA');
                } else {
                  handleEnhancedToggle('twoFactorEnabled');
                }
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.twoFactorEnabled ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle two-factor authentication"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition to log in
              </Text>
            </View>
            <Switch
              value={enhancedSettings.biometricLoginEnabled}
              onValueChange={() => handleEnhancedToggle('biometricLoginEnabled')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enhancedSettings.biometricLoginEnabled ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle biometric login"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSecurityAction('changePassword')}
            accessibilityLabel="Change password"
            accessibilityHint="Navigate to change your password"
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/screens/data-export' as any)}
            accessibilityLabel="Export your data"
            accessibilityHint="Navigate to export your personal data"
          >
            <Text style={styles.actionButtonText}>Export Your Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => handleSecurityAction('deleteAccount')}
            accessibilityLabel="Delete account"
            accessibilityHint="Initiate the process to delete your account"
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
