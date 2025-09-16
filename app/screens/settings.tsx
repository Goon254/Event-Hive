// app/screens/settings.tsx
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Switch,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenWrapper from '../components/common/ScreenWrapper';
import DSButton from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import Divider from '../components/design-system/Divider';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoCheckIn: boolean;
  locationServices: boolean;
  dateFormat: '12h' | '24h';
  distanceUnit: 'km' | 'mi';
  fontScale: number;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  
  // App settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'English',
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    soundEffects: true,
    hapticFeedback: true,
    autoCheckIn: false,
    locationServices: true,
    dateFormat: '12h',
    distanceUnit: 'mi',
    fontScale: 1.0,
  });
  
  // Fetch app settings from database
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settingsRef = doc(db, 'appSettings', user.id);
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as AppSettings;
          setSettings(data);
        } else {
          // Create default settings if they don't exist
          await setDoc(settingsRef, settings);
        }
        
        // Get app version
        const version = await Application.nativeApplicationVersion || '1.0.0';
        const buildNumber = await Application.nativeBuildVersion || '1';
        setAppVersion(`${version} (${buildNumber})`);
        
        // Get device info
        const deviceName = await Device.deviceName || 'Unknown Device';
        const deviceType = Device.deviceType === Device.DeviceType.PHONE ? 'Phone' : 'Tablet';
        const osName = Device.osName || Platform.OS;
        const osVersion = Device.osVersion || 'Unknown';
        
        setDeviceInfo(`${deviceName} • ${deviceType} • ${osName} ${osVersion}`);
      } catch (error) {
        console.error('Error fetching app settings:', error);
        Alert.alert('Error', 'Failed to load app settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // Update an app setting
  const updateSetting = async (
    setting: keyof AppSettings, 
    value: any
  ) => {
    if (!user) return;
    
    // Update local state immediately for responsive UI
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    try {
      const settingsRef = doc(db, 'appSettings', user.id);
      await updateDoc(settingsRef, {
        [setting]: value
      });
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
      Alert.alert('Error', `Failed to update ${setting}`);
      
      // Revert UI state if there was an error
      setSettings(prev => ({
        ...prev,
        [setting]: settings[setting]
      }));
    }
  };
  
  // Share app with friends
  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'ScanGo',
        message: 'Check out ScanGo, a great app for event management and QR code check-ins! Download it now: https://scangoapp.com',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };
  
  // Open email app for feedback
  const handleSendFeedback = () => {
    Linking.openURL('mailto:feedback@scangoapp.com?subject=ScanGo%20App%20Feedback');
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  // Create back button for header
  const headerBackButton = (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
        title: "Settings",
        rightContent: <View style={{ width: 40 }} />,
        gradientColors: ['#2563EB', '#4F46E5']
      }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Preferences Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              const themes = ['light', 'dark', 'system'];
              const currentIndex = themes.indexOf(settings.theme);
              const nextIndex = (currentIndex + 1) % themes.length;
              updateSetting('theme', themes[nextIndex]);
            }}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons 
                name={settings.theme === 'dark' ? 'moon' : settings.theme === 'light' ? 'sunny' : 'contrast'} 
                size={22} 
                color="#6366F1" 
              />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Theme</Text>
                <View style={styles.valueSelector}>
                  <Text style={styles.valueSelectorText}>
                    {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.settingDescription}>
                Choose between light, dark, or system theme
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              const languages = ['English', 'Spanish', 'French', 'German', 'Japanese'];
              const currentIndex = languages.indexOf(settings.language);
              const nextIndex = (currentIndex + 1) % languages.length;
              updateSetting('language', languages[nextIndex]);
            }}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="language" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Language</Text>
                <View style={styles.valueSelector}>
                  <Text style={styles.valueSelectorText}>{settings.language}</Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.settingDescription}>
                Select your preferred language
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              // Toggle between 12h and 24h
              updateSetting('dateFormat', settings.dateFormat === '12h' ? '24h' : '12h');
            }}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Time Format</Text>
                <View style={styles.valueSelector}>
                  <Text style={styles.valueSelectorText}>
                    {settings.dateFormat === '12h' ? '12-hour' : '24-hour'}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.settingDescription}>
                Choose how times are displayed in the app
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              // Toggle between km and mi
              updateSetting('distanceUnit', settings.distanceUnit === 'km' ? 'mi' : 'km');
            }}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="map-marker-distance" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Distance Unit</Text>
                <View style={styles.valueSelector}>
                  <Text style={styles.valueSelectorText}>
                    {settings.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
                  </Text>
                  <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.settingDescription}>
                Set your preferred unit for distances
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
        
        {/* Notification Preferences */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications" size={22} color="#3B82F6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={(value) => updateSetting('pushNotifications', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.pushNotifications ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Receive push notifications for events and updates
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="mail" size={22} color="#EC4899" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Switch
                  value={settings.emailNotifications}
                  onValueChange={(value) => updateSetting('emailNotifications', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.emailNotifications ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Receive email notifications for events and updates
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="message-text" size={22} color="#F97316" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>SMS Notifications</Text>
                <Switch
                  value={settings.smsNotifications}
                  onValueChange={(value) => updateSetting('smsNotifications', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.smsNotifications ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Receive SMS text messages for important updates
              </Text>
            </View>
          </View>
        </Card>
        
        {/* App Experience */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>App Experience</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="volume-high" size={22} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Switch
                  value={settings.soundEffects}
                  onValueChange={(value) => updateSetting('soundEffects', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.soundEffects ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Play sounds for interactions and notifications
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={(value) => updateSetting('hapticFeedback', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.hapticFeedback ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Enable vibration feedback for interactions
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Auto Check-In</Text>
                <Switch
                  value={settings.autoCheckIn}
                  onValueChange={(value) => updateSetting('autoCheckIn', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.autoCheckIn ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Automatically check in to events when in range
              </Text>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="location" size={22} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Location Services</Text>
                <Switch
                  value={settings.locationServices}
                  onValueChange={(value) => updateSetting('locationServices', value)}
                  trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.locationServices ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <Text style={styles.settingDescription}>
                Allow the app to access your location
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Support & About */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Support & About</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('//screens/help')}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="help-circle" size={22} color="#3B82F6" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                View FAQs and get help with the app
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleSendFeedback}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="comment-text" size={22} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Send Feedback</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                Tell us what you think about the app
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleShareApp}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="share-social" size={22} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Share the App</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                Invite friends to try ScanGo
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('//screens/terms')}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="file-document" size={22} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingTitle}>Terms & Policies</Text>
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.settingDescription}>
                View our terms of service and privacy policy
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
            <Text style={styles.deviceText}>{deviceInfo}</Text>
          </View>
        </Card>
        
        {/* Logout Button */}
        <DSButton title="Logout" onPress={handleLogout} />
        
        {/* Spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
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
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingTop: 20,
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
  },
  sectionTitle: {
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
  versionInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  deviceText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    ...buttonShadow,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginLeft: 8,
  },
});