// app/services/migrationService.ts
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebaseConfig';
import { SocialPost, ContentType, PrivacyLevel } from '../models/social';

// Mock data for seeding
const mockPosts: Partial<SocialPost>[] = [
  {
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
    userId: 'user3',
    userName: 'Michael Brown',
    content: 'Looking for recommendations on good networking events in the area. Any suggestions?',
    contentType: ContentType.TEXT,
    privacyLevel: PrivacyLevel.PUBLIC,
    likes: 8,
    comments: 12,
    shares: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 12)) // 12 hours ago
  },
  {
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
];

// Helper function to remove undefined values from objects before saving to Firestore
export function sanitizeForFirestore(obj: any): any {
  // If the value is null or not an object, return it as is
  if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Timestamp) {
    return obj;
  }

  // If it's an array, sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  // For objects, recursively sanitize each property and remove undefined values
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined)
    .reduce((result, [key, value]) => {
      result[key] = sanitizeForFirestore(value);
      return result;
    }, {} as Record<string, any>);
}

class MigrationService {
  // Flag to track if migration has run
  private static migrationRun = false;
  
  // Seed initial data for development/testing
  async seedInitialData(): Promise<void> {
    // Only run once per app session
    if (MigrationService.migrationRun) return;
    
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found, skipping data seeding');
        return;
      }
      
      // Check if we already have posts
      const postsRef = collection(db, 'socialPosts');
      const snapshot = await getDocs(postsRef);
      
      // If we already have posts, don't seed
      if (!snapshot.empty) {
        console.log('Data already exists, skipping seed');
        MigrationService.migrationRun = true;
        return;
      }
      
      console.log('Seeding initial data...');
      
      // Use batched writes for efficiency
      const batch = writeBatch(db);
      
      // Add mock posts to Firestore
      for (const post of mockPosts) {
        const postRef = doc(collection(db, 'socialPosts'));
        batch.set(postRef, post);
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log('Initial data seeded successfully');
      MigrationService.migrationRun = true;
    } catch (error) {
      console.error('Error seeding initial data:', error);
      // Log the error but don't throw it, allowing the app to continue
      console.log('Continuing despite data seeding error');
    }
  }
  
  // Migrate existing mock data to Firestore (for production)
  async migrateExistingData(existingPosts: SocialPost[]): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      console.log('Migrating existing data to Firestore...');
      
      // Use batched writes for efficiency
      const batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_LIMIT = 500; // Firestore batch limit
      
      for (const post of existingPosts) {
        // Check if post already exists
        const existingPostRef = doc(db, 'socialPosts', post.id);
        const existingPostDoc = await getDoc(existingPostRef);
        
        if (!existingPostDoc.exists()) {
          // Create a new document with the same ID
          const postRef = doc(db, 'socialPosts', post.id);
          batch.set(postRef, {
            ...post,
            // Ensure createdAt is a Timestamp
            createdAt: post.createdAt instanceof Timestamp ? 
              post.createdAt : 
              Timestamp.fromDate(new Date(post.createdAt))
          });
          
          batchCount++;
          
          // If we reach the batch limit, commit and start a new batch
          if (batchCount >= BATCH_LIMIT) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount} posts`);
            batchCount = 0;
          }
        }
      }
      
      // Commit any remaining posts
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} posts`);
      }
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  }
  
  // Create necessary Firestore indexes
  async createIndexes(): Promise<void> {
    // This is just informational - indexes need to be created in the Firebase console
    // or via Firebase CLI with a firestore.indexes.json file
    console.log(`
    Firestore indexes needed:
    
    1. Collection: socialPosts
       Fields: privacyLevel ASC, createdAt DESC
       
    2. Collection: socialPosts
       Fields: userId ASC, createdAt DESC
       
    3. Collection: connections
       Fields: status ASC, userId ASC
       
    4. Collection: connections
       Fields: status ASC, connectionId ASC
       
    5. Collection: notifications
       Fields: userId ASC, read ASC
       
    6. Collection: notifications
       Fields: userId ASC, createdAt DESC
    `);
  }
  
  // Initialize database with required collections and documents
  async initializeDatabase(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      
      // If user is not authenticated, we'll just log it and return successfully
      // instead of throwing an error, allowing the app to continue
      if (!currentUser) {
        console.log('No authenticated user found during database initialization');
        return;
      }
      
      // Check if user document exists
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      // Create user document if it doesn't exist
      if (!userDoc.exists()) {
        // Create user data object
        const userData = {
          id: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || 'Anonymous',
          avatar: currentUser.photoURL || null,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now(),
          followers: 0,
          following: 0,
          totalPosts: 0
        };
        
        // Sanitize the data to remove any undefined values
        const sanitizedData = sanitizeForFirestore(userData);
        
        // Save to Firestore
        await setDoc(userRef, sanitizedData);
        
        console.log('Created user document');
      }
      
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Error initializing database:', error);
      // Log the error but don't throw it, allowing the app to continue
      // This prevents the Feed from crashing due to initialization errors
      console.log('Continuing despite database initialization error');
    }
  }
}

export const migrationService = new MigrationService();
export default migrationService;