// app/screens/notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  Animated,
  Switch,
} from 'react-native';
import DSButton from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import Divider from '../components/design-system/Divider';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { formatDate, getRelativeDays } from '../utils/dateUtils';
import { doc, collection, query, where, getDocs, updateDoc, deleteDoc, orderBy, Timestamp, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'reminder' | 'system' | 'payment';
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: Timestamp;
  data?: {
    eventId?: string;
    eventTitle?: string;
    action?: string;
    [key: string]: any;
  };
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    event: true,
    reminder: true,
    system: true,
    payment: true,
  });

  // Animation for swipe to delete
  const rowTranslateAnimatedValues: { [key: string]: Animated.Value } = {};

  // Initialize notification subscription
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    
    // Create query for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Notification, 'id'>;
        notificationsList.push({
          id: doc.id,
          ...data,
        });
        
        // Initialize animation value for this notification
        if (!rowTranslateAnimatedValues[doc.id]) {
          rowTranslateAnimatedValues[doc.id] = new Animated.Value(0);
        }
      });
      
      setNotifications(notificationsList);
      setIsLoading(false);
      setIsRefreshing(false);
    }, (error) => {
      console.error('Error getting notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
      setIsLoading(false);
      setIsRefreshing(false);
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // Fetch notification preferences
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'userSettings', user.id);
        const settingsDoc = await getDocs(query(collection(db, 'userSettings'), where('userId', '==', user.id)));
        
        if (!settingsDoc.empty) {
          const data = settingsDoc.docs[0].data();
          setNotificationSettings({
            event: data.notifications?.event ?? true,
            reminder: data.notifications?.reminder ?? true,
            system: data.notifications?.system ?? true,
            payment: data.notifications?.payment ?? true,
          });
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      }
    };
    
    fetchSettings();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // The onSnapshot listener will automatically update
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      
      notifications
        .filter(notification => !notification.read)
        .forEach(notification => {
          const notificationRef = doc(db, 'notifications', notification.id);
          batch.update(notificationRef, { read: true });
        });
      
      await batch.commit();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to update notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', id);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const updateNotificationSetting = async (type: keyof typeof notificationSettings, value: boolean) => {
    if (!user) return;
    
    setNotificationSettings(prev => ({
      ...prev,
      [type]: value
    }));
    
    try {
      // Check if user settings document exists
      const settingsQuery = query(collection(db, 'userSettings'), where('userId', '==', user.id));
      const snapshot = await getDocs(settingsQuery);
      
      if (snapshot.empty) {
        // Create new settings document
        const settingsRef = doc(collection(db, 'userSettings'));
        await updateDoc(settingsRef, {
          userId: user.id,
          notifications: {
            ...notificationSettings,
            [type]: value
          }
        });
      } else {
        // Update existing settings
        const settingsDoc = snapshot.docs[0];
        const settingsRef = doc(db, 'userSettings', settingsDoc.id);
        await updateDoc(settingsRef, {
          [`notifications.${type}`]: value
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update settings');
      
      // Revert the UI change
      setNotificationSettings(prev => ({
        ...prev,
        [type]: !value
      }));
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when notification is opened
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    if (notification.type === 'event' && notification.data?.eventId) {
      router.push(`/screens/eventdetails?id=${notification.data.eventId}`);
    } else if (notification.type === 'payment' && notification.data?.action === 'view_methods') {
      router.push('/screens/payment-methods');
    } else if (notification.type === 'system' && notification.data?.action) {
      switch (notification.data.action) {
        case 'update_profile':
          router.push('/screens/personal-information');
          break;
        case 'view_settings':
          router.push('/screens/settings');
          break;
        default:
          // Just mark as read but don't navigate
          break;
      }
    }
  };

  const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
    const color = priority === 'high' ? '#EF4444' : priority === 'medium' ? '#F59E0B' : '#3B82F6';
    
    switch (type) {
      case 'event':
        return <Ionicons name="calendar" size={24} color={color} />;
      case 'reminder':
        return <Ionicons name="alarm" size={24} color={color} />;
      case 'payment':
        return <FontAwesome name="credit-card" size={22} color={color} />;
      case 'system':
        return <Ionicons name="information-circle" size={24} color={color} />;
      default:
        return <Ionicons name="notifications" size={24} color={color} />;
    }
  };

  const getTimeAgo = (timestamp: Timestamp) => {
    const now = new Date();
    const notificationDate = timestamp.toDate();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(notificationDate);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    // Filter out based on selected filter
    if (selectedFilter === 'unread' && item.read) {
      return null;
    }
    
    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            transform: [
              {
                translateX: rowTranslateAnimatedValues[item.id]
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.notification,
            !item.read && styles.unreadNotification
          ]}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.notificationIconContainer}>
            {getNotificationIcon(item.type, item.priority)}
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationTime}>{getTimeAgo(item.createdAt)}</Text>
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            
            {!item.read && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <FontAwesome name="trash" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredNotifications = selectedFilter === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

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
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <TouchableOpacity 
          onPress={() => setShowSettings(!showSettings)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.settingsButton}
        >
          <MaterialCommunityIcons 
            name={showSettings ? "bell-off" : "bell-outline"} 
            size={24} 
            color="#1F2937" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Notification Settings */}
      {showSettings && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Notification Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Event Updates</Text>
              <Text style={styles.settingDescription}>
                Changes to events you're attending
              </Text>
            </View>
            <Switch
              value={notificationSettings.event}
              onValueChange={(value) => updateNotificationSetting('event', value)}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationSettings.event ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Reminders</Text>
              <Text style={styles.settingDescription}>
                Upcoming event reminders
              </Text>
            </View>
            <Switch
              value={notificationSettings.reminder}
              onValueChange={(value) => updateNotificationSetting('reminder', value)}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationSettings.reminder ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>System Notifications</Text>
              <Text style={styles.settingDescription}>
                App updates and important alerts
              </Text>
            </View>
            <Switch
              value={notificationSettings.system}
              onValueChange={(value) => updateNotificationSetting('system', value)}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationSettings.system ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Payment Notifications</Text>
              <Text style={styles.settingDescription}>
                Payment confirmations and receipts
              </Text>
            </View>
            <Switch
              value={notificationSettings.payment}
              onValueChange={(value) => updateNotificationSetting('payment', value)}
              trackColor={{ false: '#D1D5DB', true: Platform.OS === 'ios' ? '#007AFF' : '#34D399' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationSettings.payment ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>
      )}
      
      {/* Filter and Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterText, 
              selectedFilter === 'all' && styles.filterTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'unread' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('unread')}
          >
            <Text style={[
              styles.filterText, 
              selectedFilter === 'unread' && styles.filterTextActive
            ]}>
              Unread
            </Text>
            {notifications.some(n => !n.read) && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications.filter(n => !n.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {filteredNotifications.length > 0 && (
          <DSButton title="Mark All as Read" onPress={markAllAsRead} variant="ghost" />
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all'
              ? "You don't have any notifications yet."
              : "You don't have any unread notifications."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
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
  settingsButton: {
    padding: 8,
  },
  settingsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    ...buttonShadow,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#F3F4F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllReadButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    ...buttonShadow,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  notificationContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  notification: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    ...cardShadow,
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 12,
    marginLeft: 8,
    ...buttonShadow,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '70%',
  },
});