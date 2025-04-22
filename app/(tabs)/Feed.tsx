// ImprovedFeed.tsx - Enhanced visual design for social feed

import React, { useState, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Share,
  Animated,
  Platform,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../components/common/ScreenLayout';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { SocialPost } from '../models/social';
import { COLORS } from '../theme/constants';
import EnhancedPostCard from '../posts/EnhancedPostCard'; // Using the EnhancedPostCard component
import PostCreation from '../posts/PostCreation';
import CommentsModal from '../components/social/CommentsModal';
import { useFeedManager } from '../hooks/useFeedManager';
import { StatusBar } from 'expo-status-bar';
import { createShadow } from '../utils/platformUtils';

const { width, height } = Dimensions.get('window');

// Updated theme colors
const THEME = {
  ...COLORS,
  background: '#F9FAFB',
  card: '#FFFFFF',
  primaryGradientStart: '#2563EB', // Adjusted blue gradient
  primaryGradientEnd: '#4F46E5',   // Adjusted blue gradient
  border: '#E5E7EB',
  divider: '#F3F4F6',
};

const ImprovedFeed = () => {
  const router = useRouter();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = Platform.OS === 'ios' ? 130 : 110;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SocialPost[]>([]);
  
  // Dynamic header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const {
    posts,
    isLoading,
    isRefreshing,
    hasMorePosts,
    isUploading,
    uploadProgress,
    createPost,
    addPostToList,
    handleLikePost,
    sharePost,
    updatePostShareCount,
    handleRefresh,
    loadMorePosts,
  } = useFeedManager({ pageSize: 5, initialRefresh: true }); // Reduced page size for better UX

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentPost, setCurrentPost] = useState<SocialPost | null>(null);

  const submitPost = async (postText: string, postImage: string | null, postPrivacy: any) => {
    let mediaFiles: string[] = [];
    if (postImage) mediaFiles.push(postImage);
    const newPost = await createPost(postText.trim(), mediaFiles, postPrivacy);
    addPostToList(newPost);
    setIsCreatingPost(false);
  };

  const handleCommentPress = useCallback((post: SocialPost) => {
    setCurrentPost(post);
    setShowComments(true);
  }, []);

  const handleSharePress = useCallback(async (post: SocialPost) => {
    const shareContent = await sharePost(post);
    const result = await Share.share(shareContent);
    if (result.action === Share.sharedAction) updatePostShareCount(post.id);
  }, [sharePost, updatePostShareCount]);

  const renderPostItem = useCallback(({ item }: { item: SocialPost }) => (
    <EnhancedPostCard
      post={item}
      onLike={handleLikePost}
      onComment={() => handleCommentPress(item)}
      onShare={() => handleSharePress(item)}
      onPress={() => {
        // Navigate to post detail
        router.push({
          pathname: '/screens/PostDetail',
          params: { postId: item.id }
        });
      }}
    />
  ), [handleLikePost, handleCommentPress, handleSharePress, router]);

  const renderHeader = useCallback(() => (
    <View style={styles.createPostContainer}>
      <View style={styles.createPostWrapper}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => setIsCreatingPost(true)}
        >
          <Text style={styles.createPostText}>What's on your mind?</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.postTypeButtons}>
        <TouchableOpacity style={styles.postTypeButton} onPress={() => setIsCreatingPost(true)}>
          <Ionicons name="image" size={22} color="#4CAF50" />
          <Text style={styles.postTypeText}>Photo</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonDivider} />
        
        <TouchableOpacity style={styles.postTypeButton} onPress={() => setIsCreatingPost(true)}>
          <Ionicons name="videocam" size={22} color="#F44336" />
          <Text style={styles.postTypeText}>Video</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonDivider} />
        
        <TouchableOpacity style={styles.postTypeButton} onPress={() => router.push('/screens/check-in')}>
          <Ionicons name="location" size={22} color="#2196F3" />
          <Text style={styles.postTypeText}>Check In</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [user]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="large" color={THEME.primary} />
      ) : (
        <>
          <Ionicons name="chatbubble-ellipses-outline" size={70} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to share something with your community!
          </Text>
          <TouchableOpacity 
            style={styles.createFirstPostButton}
            onPress={() => setIsCreatingPost(true)}
          >
            <Text style={styles.createFirstPostText}>Create Your First Post</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  ), [isLoading]);

  return (
    <ScreenWrapper
      backgroundColor={THEME.background}
      statusBarStyle="light-content"
      header={{
        title: 'Social Feed',
        subtitle: 'Connect with your community',
        rightContent: (
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsSearching(true)}
            >
              <Ionicons name="search" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/screens/notifications')}
            >
              <Ionicons name="notifications" size={22} color="#FFF" />
            </TouchableOpacity>
          </>
        ),
        gradientColors: [THEME.primaryGradientStart, THEME.primaryGradientEnd]
      }}
    >

      {/* Search Modal */}
      {isSearching && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={THEME.secondaryText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts..."
                placeholderTextColor={THEME.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Ionicons name="close" size={20} color={THEME.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                // Filter posts based on search query
                if (searchQuery.trim()) {
                  const filtered = posts.filter(post =>
                    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.userName?.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  setSearchResults(filtered);
                } else {
                  setSearchResults([]);
                }
              }}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          
          {searchQuery.trim() ? (
            <FlatList
              data={searchResults}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResultsContainer}
              ListEmptyComponent={
                <View style={styles.emptySearchState}>
                  <Text style={styles.emptySearchText}>No posts found matching "{searchQuery}"</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptySearchState}>
              <Text style={styles.emptySearchText}>Enter a search term to find posts</Text>
            </View>
          )}
        </View>
      )}

      {isCreatingPost ? (
        <PostCreation
          onClose={() => setIsCreatingPost(false)}
          onPostCreated={(newPost) => {
            addPostToList(newPost);
            setIsCreatingPost(false);
          }}
          paddingTop={headerHeight}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={
            hasMorePosts && posts.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} size="large" color={THEME.primary} />
            ) : (
              <View style={styles.endOfFeed}>
                {posts.length > 0 && (
                  <Text style={styles.endOfFeedText}>
                    You're all caught up!
                  </Text>
                )}
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}

      <CommentsModal
        visible={showComments}
        post={currentPost}
        onClose={() => setShowComments(false)}
        userName={user?.name || 'Anonymous'}
        userAvatar={user?.avatar}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 80,
    paddingHorizontal: 16,
    backgroundColor: THEME.background,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
    backgroundColor: THEME.card,
    borderRadius: 16,
    ...createShadow(1),
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.secondaryText,
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 30,
  },
  createFirstPostButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    ...createShadow(2),
  },
  createFirstPostText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footerLoader: {
    marginVertical: 20,
  },
  endOfFeed: {
    alignItems: 'center',
    padding: 20,
  },
  endOfFeedText: {
    fontSize: 14,
    color: THEME.secondaryText,
  },
  createPostContainer: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    marginBottom: 16,
    ...createShadow(1),
  },
  createPostWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  createPostButton: {
    flex: 1,
    height: 40,
    marginLeft: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    backgroundColor: THEME.background,
  },
  createPostText: {
    color: THEME.secondaryText,
    fontSize: 16,
  },
  postTypeButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 8,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  postTypeText: {
    marginLeft: 6,
    fontSize: 14,
    color: THEME.text,
    fontWeight: '500',
  },
  buttonDivider: {
    width: 1,
    backgroundColor: THEME.border,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.background,
    zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    height: 40,
  },
  searchButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    ...createShadow(1),
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptySearchText: {
    fontSize: 16,
    color: THEME.secondaryText,
    textAlign: 'center',
  },
});

export default memo(ImprovedFeed);