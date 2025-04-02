// app/(tabs)/Connections.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { createShadow } from '../utils/platformUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import socialService from '../services/socialService';
import { 
  Connection, 
  ConnectionStatus, 
  SocialProfile 
} from '../models/social';

// Screen Dimensions
const { width, height } = Dimensions.get('window');

// Recommended Connections Component
const RecommendedConnections = () => {
  const [recommendations, setRecommendations] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // TODO: Implement real recommendation logic
        // Placeholder mock data
        const mockRecommendations: SocialProfile[] = [
          {
            id: '1',
            username: 'johndoe',
            displayName: 'John Doe',
            profileImage: 'https://via.placeholder.com/150',
            followers: 500,
            following: 300,
            totalPosts: 42,
            professionalInfo: {
              company: 'Tech Innovators',
              position: 'Senior Product Manager',
              industry: 'Technology'
            },
            interests: ['Product Management', 'Tech Innovation', 'Networking']
          },
          // Add more mock recommendations
        ];
        
        setRecommendations(mockRecommendations);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const renderRecommendation = ({ item }: { item: SocialProfile }) => (
    <TouchableOpacity 
      style={styles.recommendationCard}
      onPress={() => router.push(`/profile?${item.id}`)}
    >
      <View style={styles.recommendationImageContainer}>
        <Image 
          source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }} 
          style={styles.recommendationAvatar} 
        />
        {item.verificationStatus === 'verified' && (
          <View style={styles.verificationBadge}>
            <MaterialIcons name="verified" size={16} color="#007AFF" />
          </View>
        )}
      </View>
      <View style={styles.recommendationDetails}>
        <Text style={styles.recommendationName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.recommendationSubtext} numberOfLines={1}>
          {item.professionalInfo?.position} at {item.professionalInfo?.company}
        </Text>
        <View style={styles.recommendationStats}>
          <View style={styles.statContainer}>
            <Text style={styles.statValue}>{item.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statValue}>{item.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.recommendationsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>People You May Know</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderRecommendation}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendationsList}
        />
      )}
    </View>
  );
};

// Main Connections Screen Component
export default function ConnectionsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ConnectionStatus>(ConnectionStatus.ACCEPTED);

  // Fetch user connections
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      const fetchedConnections = await socialService.fetchUserConnections(
        user.id, 
        activeFilter
      );
      
      setConnections(fetchedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeFilter]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConnections();
  }, [fetchConnections]);

  // Effect to fetch connections
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Render connection item
  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity 
      style={styles.connectionCard}
      onPress={() => router.push(`/profile?${item.connectionId}`)}
    >
      <View style={styles.connectionAvatarContainer}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/150' }} 
          style={styles.connectionAvatar} 
        />
        {item.status === ConnectionStatus.ACCEPTED && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.connectionDetails}>
        <Text style={styles.connectionName} numberOfLines={1}>
          Connection Name
        </Text>
        <Text style={styles.connectionSubtext} numberOfLines={1}>
          Job Title at Company
        </Text>
        <View style={styles.connectionActions}>
          {item.status === ConnectionStatus.PENDING && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
          {item.status === ConnectionStatus.ACCEPTED && (
            <>
              <TouchableOpacity style={styles.messageButton}>
                <MaterialIcons name="message" size={16} color="#007AFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.networkButton}>
                <MaterialIcons name="group" size={16} color="#10B981" />
                <Text style={styles.networkButtonText}>Network</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/connections/add')}
          >
            <MaterialIcons name="person-add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/connections/requests')}
          >
            <MaterialIcons name="notifications" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search connections"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Recommended Connections */}
      <RecommendedConnections />

      {/* Connections Filters */}
      <View style={styles.filtersContainer}>
        {Object.values(ConnectionStatus)
          .filter(status => status !== ConnectionStatus.BLOCKED)
          .map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                activeFilter === status && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(status)}
            >
              <Text 
                style={[
                  styles.filterButtonText,
                  activeFilter === status && styles.activeFilterButtonText
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Connections List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={connections}
          renderItem={renderConnectionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.connectionsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Connections</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === ConnectionStatus.PENDING 
                  ? "You have no pending connection requests" 
                  : "Start expanding your professional network"}
              </Text>
              <TouchableOpacity 
                style={styles.findConnectionsButton}
                onPress={() => router.push('/connections/discover')}
              >
                <Text style={styles.findConnectionsButtonText}>
                  Find Connections
                </Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
    </View>
  );
}

// Styles continue...
const styles = StyleSheet.create({
  // Implement comprehensive styles here
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    ...createShadow(1),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
    ...createShadow(1),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  recommendationsContainer: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  recommendationsList: {
    paddingHorizontal: 16,
  },
  recommendationCard: {
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'center',
    ...createShadow(2),
  },
  recommendationImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  recommendationAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  recommendationDetails: {
    alignItems: 'center',
    width: '100%',
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recommendationSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  recommendationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  statContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  connectButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  connectionsList: {
    padding: 16,
  },
  connectionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...createShadow(2),
  },
  connectionAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  connectionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  connectionDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  connectionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 4,
  },
  connectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#D97706',
    fontSize: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#007AFF',
    marginLeft: 4,
    fontSize: 12,
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  networkButtonText: {
    color: '#10B981',
    marginLeft: 4,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  findConnectionsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  findConnectionsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});