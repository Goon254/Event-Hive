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
    writeBatch
  } from 'firebase/firestore';
  import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, auth } from '../../lib/firebaseConfig';
  import { 
    SocialPost, 
    Connection, 
    ConnectionStatus, 
    SocialProfile, 
    ContentType, 
    PrivacyLevel,
    SocialNotification
  } from '../models/social';
  
  class SocialService {
    // Post Creation and Management
    async createPost(postData: Omit<SocialPost, 'id' | 'createdAt'>, mediaFiles?: File[]): Promise<SocialPost> {
      try {
        // Upload media files if any
        let mediaUrls: string[] = [];
        if (mediaFiles && mediaFiles.length > 0) {
          const storage = getStorage();
          const uploadPromises = mediaFiles.map(async (file) => {
            const storageRef = ref(storage, `posts/${auth.currentUser?.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
          });
          
          mediaUrls = await Promise.all(uploadPromises);
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
        const { 
          userId, 
          connectionIds = [], 
          contentTypes = [], 
          privacyLevel,
          lastDoc,
          pageSize = 10 
        } = options;
  
        let q = query(
          collection(db, 'socialPosts'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
  
        // Apply filters
        const filters: any[] = [];
        
        if (userId) {
          filters.push(where('userId', '==', userId));
        }
  
        if (connectionIds.length > 0) {
          filters.push(where('userId', 'in', connectionIds));
        }
  
        if (contentTypes.length > 0) {
          filters.push(where('contentType', 'in', contentTypes));
        }
  
        if (privacyLevel) {
          filters.push(where('privacyLevel', '==', privacyLevel));
        }
  
        // If there's a last document for pagination
        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
  
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as SocialPost));
  
        return {
          posts,
          lastDoc: snapshot.docs[snapshot.docs.length - 1]
        };
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    }
  
    // Connection Management
    async sendConnectionRequest(targetUserId: string): Promise<Connection> {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
  
        const connectionData: Connection = {
          id: `${currentUser.uid}_${targetUserId}`,
          userId: currentUser.uid,
          connectionId: targetUserId,
          status: ConnectionStatus.PENDING,
          connectionRequest: {
            sentBy: currentUser.uid,
            sentAt: Timestamp.now()
          }
        };
  
        // Save connection request
        await addDoc(collection(db, 'connections'), connectionData);
  
        return connectionData;
      } catch (error) {
        console.error('Error sending connection request:', error);
        throw error;
      }
    }
  
    // Fetch User Connections
    async fetchUserConnections(
      userId: string, 
      status: ConnectionStatus = ConnectionStatus.ACCEPTED
    ): Promise<Connection[]> {
      try {
        const q = query(
          collection(db, 'connections'),
          where('userId', '==', userId),
          where('status', '==', status)
        );
  
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Connection));
      } catch (error) {
        console.error('Error fetching connections:', error);
        throw error;
      }
    }
  
    // Interaction Methods
    async likePost(postId: string): Promise<void> {
      try {
        const postRef = doc(db, 'socialPosts', postId);
        
        // Atomic increment of likes
        await updateDoc(postRef, {
          likes: increment(1)
        });
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
  
        const commentData = {
          postId,
          userId: currentUser.uid,
          content,
          createdAt: Timestamp.now(),
          likes: 0,
          parentCommentId
        };
  
        const docRef = await addDoc(
          collection(db, 'socialPosts', postId, 'comments'), 
          commentData
        );
  
        // Increment comment count on post
        const postRef = doc(db, 'socialPosts', postId);
        await updateDoc(postRef, {
          comments: increment(1)
        });
  
        return { 
          id: docRef.id, 
          ...commentData 
        };
      } catch (error) {
        console.error('Error commenting on post:', error);
        throw error;
      }
    }
  
    // Notification Management
    async fetchNotifications(
      userId: string, 
      unreadOnly: boolean = false
    ): Promise<SocialNotification[]> {
      try {
        let q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
  
        if (unreadOnly) {
          q = query(q, where('read', '==', false));
        }
  
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as SocialNotification));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    }
  }
  
  // Helper function for atomic increments
  function increment(amount: number) {
    return { 
      increment: amount 
    };
  }
  
  const socialService = new SocialService();
  export default socialService;