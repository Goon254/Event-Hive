import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { SocialPost } from '../../models/social';
import { postCardStyles as styles } from '../../(tabs)/Feed.styles';
import { Share } from 'react-native';
import { toDateObject, getRelativeTime } from '../../utils/dateUtils';

interface PostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onComment: (post: SocialPost) => void;
  onShare: (post: SocialPost) => void;
}

// Format the timestamp for display with robust error handling
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  
  try {
    // Use our robust date conversion utility
    const dateObj = toDateObject(timestamp);
    
    // If we couldn't parse the date, return a default value
    if (!dateObj) return 'Recently';
    
    // Use our utility that handles relative time formatting
    return getRelativeTime(dateObj);
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return 'Recently';
  }
};

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare }) => {
  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        {post.userAvatar ? (
          <Image source={{ uri: post.userAvatar }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatarPlaceholder, { backgroundColor: generateColorFromName(post.userName) }]}>
            <Text style={styles.avatarInitial}>{post.userName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.postHeaderInfo}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.postTime}>{formatTimestamp(post.createdAt)}</Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        {post.content && (
          <Text style={styles.postText}>{post.content}</Text>
        )}

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <Image
            source={{ uri: post.mediaUrls[0] }}
            style={styles.postImage}
            resizeMode="cover" />
        )}
      </View>

      {/* Error Banner for Like Failures */}
      {post.likeError && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#B91C1C" />
          <Text style={styles.errorText}>
            Unable to like this post. Please try again later.
          </Text>
        </View>
      )}

      {/* Post Metrics */}
      <View style={styles.postMetrics}>
        <Text style={styles.likeCount}>{post.likes} likes</Text>
        <Text style={styles.commentCount}>{post.comments} comments</Text>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <FontAwesome name="thumbs-o-up" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(post)}
        >
          <FontAwesome name="comment-o" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(post)}
        >
          <FontAwesome name="share" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Generate a consistent color based on the user's name
const generateColorFromName = (name: string): string => {
  const colors = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];
  
  // Simple hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Use memo to prevent unnecessary re-renders
export default memo(PostCard);