// app/(tabs)/Connections.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import { createShadow } from '../utils/platformUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the Connection interface
interface Connection {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  mutualConnections?: number;
  recentEvent?: string;
  status: 'pending' | 'connected' | 'suggested';
  lastInteraction?: Date;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

export default function ConnectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested'>('connections');
  
  // Animation values
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.8, 0.6],
    extrapolate: 'clamp',
  });
  
  // Fetch connections data
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call to your backend
      // This is mock data for demonstration
      const mockConnections: Connection[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Event Organizer',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          mutualConnections: 12,
          recentEvent: 'Tech Conference 2023',
          status: 'connected',
          lastInteraction: new Date(2023, 3, 15)
        },
        {
          id: '2',
          name: 'Michael Chen',
          role: 'Marketing Director',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          mutualConnections: 8,
          recentEvent: 'Networking Mixer',
          status: 'connected',
          lastInteraction: new Date(2023, 4, 20)
        },
        {
          id: '3',
          name: 'Aisha Patel',
          role: 'UX Designer',
          avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
          mutualConnections: 5,
          recentEvent: 'Design Summit',
          status: 'connected',
          lastInteraction: new Date(2023, 5, 1)
        },
        {
          id: '4',
          name: 'James Wilson',
          role: 'Software Engineer',
          avatar: 'https://randomuser.me/api/portraits/men/91.jpg',
          mutualConnections: 3,
          recentEvent: 'Hackathon 2023',
          status: 'connected',
          lastInteraction: new Date(2023, 5, 10)
        },
        {
          id: '5',
          name: 'Elena Rodriguez',
          role: 'Community Manager',
          avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
          mutualConnections: 15,
          recentEvent: 'Community Meetup',
          status: 'connected',
          lastInteraction: new Date(2023, 5, 22)
        }
      ];
      
      const mockPendingConnections: Connection[] = [
        {
          id: '6',
          name: 'David Kim',
          role: 'Product Manager',
          avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
          mutualConnections: 7,
          status: 'pending'
        },
        {
          id: '7',
          name: 'Olivia Taylor',
          role: 'Event Coordinator',
          avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
          mutualConnections: 4,
          status: 'pending'
        }
      ];
      
      const mockSuggestedConnections: Connection[] = [
        {
          id: '8',
          name: 'Carlos Mendez',
          role: 'Startup Founder',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          mutualConnections: 9,
          status: 'suggested'
        },
        {
          id: '9',
          name: 'Priya Singh',
          role: 'Data Scientist',
          avatar: 'https://randomuser.me/api/portraits/women/57.jpg',
          mutualConnections: 6,
          status: 'suggested'
        },
        {
          id: '10',
          name: 'Robert Lee',
          role: 'Venture Capitalist',
          avatar: 'https://randomuser.me/api/portraits/men/29.jpg',
          mutualConnections: 3,
          status: 'suggested'
        }
      ];
      
      setConnections(mockConnections);
      setPendingConnections(mockPendingConnections);
      setSuggestedConnections(mockSuggestedConnections);
      
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConnections();
  }, [fetchConnections]);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  const handleConnect = (id: string, action: 'accept' | 'reject' | 'connect' | 'message') => {
    if (action === 'accept') {
      // Accept connection request
      setPendingConnections(prev => prev.filter(conn => conn.id !== id));
      setConnections(prev => [...prev, pendingConnections.find(conn => conn.id === id)!]);
    } else if (action === 'reject') {
      // Reject connection request
      setPendingConnections(prev => prev.filter(conn => conn.id !== id));
    } else if (action === 'connect') {
      // Send connection request to suggested user
      setSuggestedConnections(prev => prev.filter(conn => conn.id !== id));
      setPendingConnections(prev => [
        ...prev,
        { ...suggestedConnections.find(conn => conn.id === id)!, status: 'pending' }
      ]);
    } else if (action === 'message') {
      // Open message screen
      router.push(`//screens/messages?userId=${id}`);
    }
  };
  
  // Filter connections based on search query
  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPendingConnections = pendingConnections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSuggestedConnections = suggestedConnections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Render individual connection card
  const renderConnectionCard = ({ item }: { item: Connection }) => (
    <TouchableOpacity 
      style={styles.connectionCard}
      onPress={() => router.push(`//screens/profile/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.connectionContent}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.connectionInfo}>
          <Text style={styles.name}>{item.name}</Text>
          {item.role && <Text style={styles.role}>{item.role}</Text>}
          
          {item.mutualConnections !== undefined && (
            <View style={styles.mutualContainer}>
              <Ionicons name="people" size={14} color="#6B7280" />
              <Text style={styles.mutualText}>
                {item.mutualConnections} mutual connection{item.mutualConnections !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {item.recentEvent && (
            <View style={styles.eventContainer}>
              <MaterialIcons name="event" size={14} color="#6B7280" />
              <Text style={styles.eventText} numberOfLines={1}>
                Last seen at: {item.recentEvent}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        {activeTab === 'pending' ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleConnect(item.id, 'accept')}
            >
              <MaterialIcons name="check" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleConnect(item.id, 'reject')}
            >
              <MaterialIcons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : activeTab === 'suggested' ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.connectButton]}
            onPress={() => handleConnect(item.id, 'connect')}
          >
            <MaterialIcons name="person-add" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.messageButton]}
            onPress={() => handleConnect(item.id, 'message')}
          >
            <MaterialIcons name="chat" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={
          activeTab === 'connections' ? 'people' : 
          activeTab === 'pending' ? 'time' : 'compass'
        } 
        size={60} 
        color="#CBD5E1" 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'connections' ? 'No connections yet' : 
         activeTab === 'pending' ? 'No pending requests' : 
         'No suggestions available'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'connections' ? 
          'Start connecting with other attendees and event organizers!' : 
         activeTab === 'pending' ? 
          'You don\'t have any pending connection requests.' : 
          'Check back later for personalized connection suggestions.'}
      </Text>
      
      {activeTab === 'connections' && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => setActiveTab('suggested')}
        >
          <Text style={styles.emptyButtonText}>Explore Suggestions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Render header with animated effects
  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header,
        { 
          paddingTop: Math.max(insets.top, 40), 
          opacity: headerOpacity 
        }
      ]}
    >
      <Text style={styles.headerTitle}>Your Network</Text>
      
      {pendingConnections.length > 0 && (
        <TouchableOpacity 
          style={styles.pendingBadge}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.pendingBadgeText}>{pendingConnections.length}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
  
  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search connections..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
        onPress={() => setActiveTab('connections')}
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'connections' && styles.activeTabText
          ]}
        >
          Connected
        </Text>
        {activeTab === 'connections' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
        onPress={() => setActiveTab('pending')}
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'pending' && styles.activeTabText
          ]}
        >
          Pending
          {pendingConnections.length > 0 && (
            <Text style={styles.tabBadge}> {pendingConnections.length}</Text>
          )}
        </Text>
        {activeTab === 'pending' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'suggested' && styles.activeTab]}
        onPress={() => setActiveTab('suggested')}
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'suggested' && styles.activeTabText
          ]}
        >
          Suggested
        </Text>
        {activeTab === 'suggested' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
  
  const getDataSource = () => {
    switch (activeTab) {
      case 'connections':
        return filteredConnections;
      case 'pending':
        return filteredPendingConnections;
      case 'suggested':
        return filteredSuggestedConnections;
      default:
        return filteredConnections;
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {renderHeader()}
      {renderSearchBar()}
      {renderTabs()}
      
      <Animated.FlatList
        data={getDataSource()}
        renderItem={renderConnectionCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
      
      {/* Floating action button for scanning business cards */}
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => router.push('/screens/scan-business-card')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#007AFF', '#4F46E5']}
          style={styles.scanButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#1F2937',
  },
  pendingBadge: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 48 : 28,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...cardShadow,
  },
  connectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectionInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  mutualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mutualText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...buttonShadow,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  messageButton: {
    backgroundColor: '#3B82F6',
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    ...buttonShadow,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    ...buttonShadow,
  },
  scanButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});