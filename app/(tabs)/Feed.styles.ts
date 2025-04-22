import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme/constants';
import { createShadow } from '../utils/platformUtils';

// Create platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

export const styles = StyleSheet.create({
  // Enhanced Header - no borders or outlines
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Adjusted to account for status bar spacer
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30, // Extra padding at bottom
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 32, // Larger text
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 18, // Larger text
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16, // Increased spacing
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48, // Slightly larger
    height: 48, // Slightly larger
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 140 : 120, // Dynamic spacing based on platform
    marginBottom: 12,
    borderRadius: 20, // Increased border radius for a more modern look
    borderWidth: 1,
    borderColor: COLORS.border,
    ...cardShadow,
  },
  createPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take up available space
  },
  createPostPromptText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.secondaryText,
    fontWeight: '500', // Slightly bolder text
  },
  createPostOptions: {
    flexDirection: 'row',
  },
  postOptionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  postList: {
    paddingTop: Platform.OS === 'ios' ? 140 : 120, // Dynamic spacing based on platform
    paddingBottom: 80, // Increased bottom padding for better spacing with tab bar
  },
  loadingIndicator: {
    padding: 20,
  },
  paginationLoader: {
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    maxWidth: '80%',
  },
  skeletonContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    ...cardShadow,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  skeletonHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  skeletonImage: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
});

// PostCard styles
export const postCardStyles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...cardShadow,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    padding: 12,
    paddingTop: 12, // Added top padding for better spacing
  },
  postText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  postMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  likeCount: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  commentCount: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  actionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 12, // Added horizontal padding
  gap: 8, // Added gap between icon and text
},
  actionText: {
    // Removed marginLeft since we're using gap in the parent
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

// PostCreation styles
export const postCreationStyles = StyleSheet.create({
  createPostCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 16, // Increased border radius
    ...cardShadow,
    maxHeight: '90%', // Ensure it doesn't take up the entire screen
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative', // Ensure proper stacking
    zIndex: 10, // Keep header on top
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20, // More rounded corners
    ...buttonShadow,
    position: 'relative', // Ensure it stays in place
    zIndex: 20, // Keep button on top of everything
  },
  postButtonDisabled: {
    backgroundColor: COLORS.secondaryText,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createPostContent: {
    padding: 16,
    maxHeight: Platform.OS === 'ios' ? '70%' : '65%', // Limit height to ensure Post button remains visible
    overflow: 'scroll', // Allow scrolling if content exceeds the height
  },
  createPostUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  privacySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginHorizontal: 4,
  },
  privacyModal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  privacyModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...cardShadow,
  },
  privacyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  privacyOptionText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  privacyOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  postInput: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    maxHeight: 150, // Limit height to prevent overflow
    textAlignVertical: 'top',
    paddingBottom: 10, // Add some padding at the bottom
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
  },
  mediaButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// CommentsModal styles
export const commentsModalStyles = StyleSheet.create({
  commentsContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        paddingTop: 60
      },
      android: {
        paddingTop: 16
      }
    })
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  originalPost: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  originalPostText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginTop: 8,
  },
  commentsList: {
    padding: 16,
    paddingBottom: 80,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 24, // Increased spacing between comments
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 12,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  noCommentsText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16, // Added horizontal padding for breathing room
    ...Platform.select({
      ios: {
        paddingBottom: 30
      }
    })
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyCommentsImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    tintColor: '#D1D5DB',
  },
  emptyCommentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 16,
  },
  startCommentingButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    ...buttonShadow,
  },
  startCommentingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});