// app/services/socialService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db, auth, storage } from '../../lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  SocialPost, 
  Connection, 
  ConnectionStatus, 
  SocialProfile, 
  ContentType, 
  PrivacyLevel,
  SocialNotification,
  Comment
} from '../models/social';

class SocialService {
  // Post Creation and Management
  async createPost(postData: Omit<SocialPost, 'id' | 'createdAt'>, mediaFiles?: File[] | string[]): Promise<SocialPost> {
    try {
      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          if (typeof file === 'string') {
            // If it's already a URL or local URI, use it directly for demo
            mediaUrls.push(file);
          } else {
            // If it's a File, upload it
            const storageRef = ref(storage, `posts/${auth.currentUser?.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            mediaUrls.push(downloadUrl);
          }
        }
      }
  
      // Prepare post data
      const postToSave = {
        ...postData,
        mediaUrls: mediaUrls,
        createdAt: Timestamp.now(),
        likes: 0,
        comments: 0,
        shares: 0
      };
  
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'socialPosts'), postToSave);
      
      return { 
        id: docRef.id, 
        ...postToSave 
      } as SocialPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Fetch Posts with Advanced Filtering
  async fetchPosts(
    options: {
      userId?: string, 
      connectionIds?: string[], 
      contentTypes?: ContentType[], 
      privacyLevel?: PrivacyLevel,
      lastDoc?: any,
      pageSize?: number
    } = {}
  ): Promise<{ posts: SocialPost[], lastDoc: any }> {
    try {
      // For this demo, we'll return mock data instead of hitting Firestore
      // This is because you're still setting up the social functionality

      // In a real app, this would use Firebase queries
      const mockPosts: SocialPost[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Alex Johnson',
          content: 'Just joined a new event! Looking forward to meeting everyone there.',
          contentType: ContentType.TEXT,
          privacyLevel: PrivacyLevel.PUBLIC,
          likes: 15,
          comments: 3,
          shares: 1,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)) // 2 hours ago
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Sarah Wilson',
          userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          content: 'Great time at the tech conference yesterday! Here are some photos:',
          contentType: ContentType.MIXED,
          mediaUrls: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'],
          privacyLevel: PrivacyLevel.PUBLIC,
          likes: 42,
          comments: 7,
          shares: 3,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 5)) // 5 hours ago
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Michael Brown',
          content: 'Looking for recommendations on good networking events in the area. Any suggestions?',
          contentType: ContentType.TEXT,
          privacyLevel: PrivacyLevel.PUBLIC,
          likes: 8,
          comments: 12,
          shares: 0,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 12)) // 12 hours ago
        }
      ];

      // Add a couple more posts if this is an initial fetch rather than pagination
      if (!options.lastDoc) {
        mockPosts.push(
          {
            id: '4',
            userId: 'user4',
            userName: 'Emily Davis',
            userAvatar: 'https://randomuser.me/api/portraits/women/32.jpg',
            content: 'Just confirmed my ticket for the Summer Music Festival! Who else is going?',
            contentType: ContentType.TEXT,
            privacyLevel: PrivacyLevel.PUBLIC,
            likes: 27,
            comments: 14,
            shares: 2,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 24)) // 1 day ago
          },
          {
            id: '5',
            userId: 'user5',
            userName: 'Robert Miller',
            content: 'Excited to announce that I\'ll be speaking at the upcoming business conference next month!',
            contentType: ContentType.TEXT,
            privacyLevel: PrivacyLevel.PUBLIC,
            likes: 54,
            comments: 8,
            shares: 7,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 36)) // 1.5 days ago
          }
        );
      }

      return {
        posts: mockPosts,
        lastDoc: options.lastDoc ? null : 'dummyLastDoc' // Return null to indicate no more pagination
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Interaction Methods
  async likePost(postId: string): Promise<void> {
    try {
      // In a real app, this would update Firestore
      // For the demo, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app:
      // const postRef = doc(db, 'socialPosts', postId);
      // await updateDoc(postRef, {
      //   likes: increment(1)
      // });
      
      console.log(`Liked post: ${postId}`);
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async commentOnPost(
    postId: string, 
    content: string, 
    parentCommentId?: string
  ): Promise<Comment> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // For the demo, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a mock comment
      const commentData = {
        id: Date.now().toString(),
        postId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userAvatar: currentUser.photoURL || undefined,
        content,
        createdAt: Timestamp.now(),
        likes: 0,
        parentCommentId
      };

      // In a real app:
      // const docRef = await addDoc(
      //   collection(db, 'socialPosts', postId, 'comments'), 
      //   commentData
      // );
      // 
      // await updateDoc(doc(db, 'socialPosts', postId), {
      //   comments: increment(1)
      // });

      console.log(`Added comment to post: ${postId}`);

      return commentData as Comment;
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  }

  // Get comments for a post
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      // For the demo, return mock comments
      return [
        {
          id: '1',
          postId,
          userId: 'user7',
          userName: 'Jane Smith',
          content: 'Great post!',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1800000)), // 30 minutes ago
          likes: 2
        },
        {
          id: '2',
          postId,
          userId: 'user8',
          userName: 'John Doe',
          content: 'I completely agree with this!',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
          likes: 1
        }
      ] as Comment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  // Share a post
  async sharePost(postId: string): Promise<void> {
    try {
      // For the demo, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app:
      // const postRef = doc(db, 'socialPosts', postId);
      // await updateDoc(postRef, {
      //   shares: increment(1)
      // });

      console.log(`Shared post: ${postId}`);
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  // Delete a post
  async deletePost(postId: string): Promise<void> {
    try {
      // For the demo, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app:
      // await deleteDoc(doc(db, 'socialPosts', postId));

      console.log(`Deleted post: ${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

const socialService = new SocialService();
export default socialService;