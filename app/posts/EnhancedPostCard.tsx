// app/posts/EnhancedPostCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SocialPost } from '../models/social';
import { COLORS } from '../theme/constants';
import { createShadow } from '../utils/platformUtils';
import { format } from 'date-fns';
import { enhancedImageService } from '../services/enhancedImageService';
import { checkFileExists } from '../utils/fileUtils';
import { useAuth } from '../AuthContext';

// Updated theme colors
const THEME = {
  ...COLORS,
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  text: '#1F2937',
  secondaryText: '#6B7280',
  primary: '#2563EB',
  error: '#EF4444',
  success: '#10B981',
};

interface EnhancedPostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  onPress: () => void;
}

// Define valid privacy icon names to fix TypeScript error
type PrivacyIconName = 'globe' | 'lock-closed' | 'people';

const { width } = Dimensions.get('window');
const MAX_CAPTION_LENGTH = 150;

const EnhancedPostCard = ({ post, onLike, onComment, onShare, onPress }: EnhancedPostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaStatus, setMediaStatus] = useState<{[key: string]: boolean}>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  
  // Check if the current user has liked this post
  const isLiked = user && post.userLikes?.includes(user.id);
  
  // Verify media URLs on component mount
  useEffect(() => {
    const verifyMediaUrls = async () => {
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const statusMap: {[key: string]: boolean} = {};
        
        // Check each URL in parallel
        await Promise.all(
          post.mediaUrls.map(async (url, index) => {
            try {
              const exists = await checkFileExists(url);
              statusMap[url] = exists;
            } catch (error) {
              console.error(`Error verifying media URL ${url}:`, error);
              statusMap[url] = false;
            }
          })
        );
        
        setMediaStatus(statusMap);
      }
    };
    
    verifyMediaUrls();
  }, [post.mediaUrls]);
  
  // Format the timestamp
  const formatTimestamp = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      
      // If it's less than 24 hours ago, show relative time
      if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
        // Calculate hours difference
        const hoursDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (hoursDiff < 1) {
          // Less than an hour ago
          const minutesDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
          return minutesDiff <= 1 ? 'Just now' : `${minutesDiff} minutes ago`;
        } else {
          // Hours ago
          return hoursDiff === 1 ? '1 hour ago' : `${hoursDiff} hours ago`;
        }
      }
      
      // If it's this year, show month and day
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'MMM d');
      }
      
      // Show full date for older posts
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Recently';
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const needsReadMore = post.content && post.content.length > MAX_CAPTION_LENGTH;
  
  const renderCaption = () => {
    if (!post.content) return null;
    
    if (needsReadMore && !expanded) {
      return (
        <View>
          <Text style={styles.postText}>
            {post.content.substring(0, MAX_CAPTION_LENGTH)}
            <Text style={styles.ellipsis}>...</Text>
          </Text>
          <TouchableOpacity onPress={toggleExpanded}>
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <Text style={styles.postText}>
        {post.content}
        {needsReadMore && expanded && (
          <TouchableOpacity onPress={toggleExpanded}>
            <Text style={styles.readLessText}> Show less</Text>
          </TouchableOpacity>
        )}
      </Text>
    );
  };

  // Helper function to get privacy icon
  const getPrivacyIcon = (privacyLevel: string | undefined): PrivacyIconName => {
    if (!privacyLevel) return 'globe';
    
    switch (privacyLevel.toLowerCase()) {
      case 'private':
        return 'lock-closed';
      case 'connections':
        return 'people';
      default:
        return 'globe';
    }
  };
  
  // Handle image pagination
  const handleNextImage = () => {
    if (post.mediaUrls && currentImageIndex < post.mediaUrls.length - 1) {
      setImageLoaded(false);
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };
  
  const handlePreviousImage = () => {
    if (post.mediaUrls && currentImageIndex > 0) {
      setImageLoaded(false);
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.userName || 'Anonymous'}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)}</Text>
              <View style={styles.dot} />
              <Ionicons
                name={getPrivacyIcon(post.privacyLevel)}
                size={12}
                color={THEME.secondaryText}
              />
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color={THEME.secondaryText} />
        </TouchableOpacity>
      </View>
      
      {/* Post Caption */}
      {renderCaption()}
      
      {/* Post Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPress}
          style={styles.mediaContainer}
        >
          <View style={styles.imageWrapper}>
            {!imageLoaded && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="small" color={THEME.primary} />
              </View>
            )}
            
            {post.mediaUrls[currentImageIndex] && (
              <Animated.Image
                source={{ uri: post.mediaUrls[currentImageIndex] }}
                style={[
                  styles.media,
                  { opacity: fadeAnim }
                ]}
                onLoad={handleImageLoad}
                onError={() => console.error(`Failed to load image: ${post.mediaUrls?.[currentImageIndex]}`)}
                resizeMode="cover"
              />
            )}
            
            {/* Image pagination controls */}
            {post.mediaUrls.length > 1 && (
              <View style={styles.paginationContainer}>
                {/* Previous button */}
                {currentImageIndex > 0 && (
                  <TouchableOpacity
                    style={styles.paginationButton}
                    onPress={handlePreviousImage}
                  >
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {/* Next button */}
{currentImageIndex < post.mediaUrls.length - 1 && (
  <TouchableOpacity
    style={[styles.paginationButton, styles.paginationButtonRight]}
    onPress={handleNextImage}
  >
    <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
  </TouchableOpacity>
)}
                  {/* Pagination indicators */}
                  <View style={styles.paginationDots}>
                    {post.mediaUrls.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDot,
                          index === currentImageIndex && styles.paginationDotActive
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {/* Engagement Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons 
              name="heart" 
              size={14} 
              color={THEME.primary} 
            />
            <Text style={styles.statCount}>
              {post.likes || 0}
            </Text>
          </View>
          
          <View style={styles.rightStats}>
            <TouchableOpacity onPress={onComment}>
              <Text style={styles.commentCount}>
                {post.comments || 0} comments
              </Text>
            </TouchableOpacity>
            
            {post.shares > 0 && (
              <>
                <View style={styles.dot} />
                <Text style={styles.commentCount}>
                  {post.shares} shares
                </Text>
              </>
            )}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? THEME.error : THEME.text}
            />
            <Text style={[
              styles.actionText,
              isLiked ? styles.actionTextActive : null
            ]}>
              Like
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onComment}
          >
            <Ionicons name="chatbubble-outline" size={22} color={THEME.text} />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={22} color={THEME.text} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: THEME.card,
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      ...createShadow(1),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: THEME.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 18,
    },
    userInfo: {
      marginLeft: 12,
    },
    userName: {
      fontWeight: '600',
      fontSize: 16,
      color: THEME.text,
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    timestamp: {
      color: THEME.secondaryText,
      fontSize: 12,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: THEME.secondaryText,
      marginHorizontal: 5,
    },
    moreButton: {
      padding: 4,
    },
    postText: {
      fontSize: 15,
      color: THEME.text,
      lineHeight: 22,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    ellipsis: {
      fontSize: 15,
      color: THEME.secondaryText,
    },
    readMoreText: {
      color: THEME.primary,
      fontWeight: '500',
      marginLeft: 12,
      marginTop: -8,
      marginBottom: 12,
    },
    readLessText: {
      color: THEME.primary,
      fontWeight: '500',
    },
    mediaContainer: {
      width: '100%',
      marginBottom: 8,
    },
    imageWrapper: {
      width: '100%',
      aspectRatio: 4 / 3,
      backgroundColor: THEME.divider,
      position: 'relative',
    },
    imagePlaceholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: THEME.divider,
    },
    media: {
      width: '100%',
      height: '100%',
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
    },
    paginationButton: {
      position: 'absolute',
      left: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    paginationButtonRight: {
      left: undefined,
      right: 8,
    },
    paginationDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 20,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 4,
    },
    paginationDotActive: {
      backgroundColor: '#FFFFFF',
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: THEME.divider,
      borderBottomWidth: 1,
      borderBottomColor: THEME.divider,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statCount: {
      fontSize: 14,
      color: THEME.secondaryText,
      marginLeft: 4,
    },
    rightStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentCount: {
      fontSize: 14,
      color: THEME.secondaryText,
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: THEME.text,
      marginLeft: 6,
    },
    actionTextActive: {
      color: THEME.primary,
    },
  });
  
  export default EnhancedPostCard;