import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebaseConfig';
import { sanitizeForFirestore } from './services/migrationService';
import { useGoogleAuth, getExistingAccountEmail } from './utils/googleAuth';
import { secureStore, secureRetrieve, secureDelete, isAccountLockedOut, getRemainingLockoutTime, recordFailedLoginAttempt, resetLoginAttempts } from './utils/authSecurity';
import * as googleOAuthCompliance from './utils/googleOAuthCompliance';
import { ref, getDownloadURL, uploadBytes, getStorage, listAll, deleteObject } from 'firebase/storage';
import { enhancedImageService } from './services/enhancedImageService';

// Constants
const AUTH_STORAGE_KEY = 'auth_user_data';
const AUTH_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Interfaces remain the same
interface UserProfile {
  name: string;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  userType: string;
  organizationName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  lastAuthenticated?: number; // Add timestamp for validation
  authProvider?: string; // 'password', 'google', etc.
  linkedProviders?: string[]; // List of linked authentication providers
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, userProfile?: UserProfile) => Promise<string>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkAccountWithGoogle: () => Promise<void>;
  checkExistingAccount: (email: string) => Promise<string[]>;
}

const INITIAL_STATE: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Initialize WebBrowser for OAuth redirects
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const { signInWithGoogle: googleSignIn, linkWithGoogle } = useGoogleAuth();

  // Load stored authentication data on startup
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Prefer secure storage with AsyncStorage fallback handled internally
        const storedAuth = await secureRetrieve(AUTH_STORAGE_KEY);
        
        if (storedAuth) {
          const userData = JSON.parse(storedAuth) as User;
          
          // Optional: Check if the stored auth data is still valid (not expired)
          // For example, you could check if it's been more than X days since authentication
          const now = Date.now();
          const authAge = now - (userData.lastAuthenticated || now);
          const isStillValid = authAge < AUTH_SESSION_MAX_AGE_MS; // Enforce max session age
          
          if (isStillValid) {
            setState(prevState => ({
              ...prevState,
              user: userData,
              isAuthenticated: true,
              isLoading: false
            }));
          } else {
            // Auth data expired, clear it
            await secureDelete(AUTH_STORAGE_KEY);
            setState(prevState => ({
              ...prevState,
              isLoading: false
            }));
          }
        } else {
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error loading authentication state:', error);
        setState(prevState => ({
          ...prevState,
          error: 'Failed to load authentication data',
          isLoading: false
        }));
      }
    };

    loadAuthState();
  }, []);

  // Enforce session maximum age with periodic checks
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const storedAuth = await secureRetrieve(AUTH_STORAGE_KEY);
        if (!storedAuth) return;
        const userData = JSON.parse(storedAuth) as User;
        const now = Date.now();
        const authAge = now - (userData.lastAuthenticated || 0);
        if (authAge > AUTH_SESSION_MAX_AGE_MS) {
          await firebaseSignOut(auth);
          await secureDelete(AUTH_STORAGE_KEY);
          try { await googleOAuthCompliance.clearTokens(); } catch {}
          router.replace('/(auth)/login');
        }
      } catch {}
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            avatar: firebaseUser.photoURL || undefined,
            lastAuthenticated: Date.now(),
            authProvider: firebaseUser.providerData[0]?.providerId || 'password'
          };
          
          // Store auth data with timestamp (secure storage preferred)
          await secureStore(AUTH_STORAGE_KEY, JSON.stringify(user));
          
          // Update state using function form to avoid closure issues
          setState(prevState => ({
            ...prevState,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }));
        } catch (storageError) {
          console.error('Error storing auth data:', storageError);
          // Still update the state even if storage fails
          setState(prevState => ({
            ...prevState,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              avatar: firebaseUser.photoURL || undefined,
              authProvider: firebaseUser.providerData[0]?.providerId || 'password'
            },
            isAuthenticated: true,
            isLoading: false
          }));
        }
      } else {
        try {
          // User is signed out
          await secureDelete(AUTH_STORAGE_KEY);
        } catch (storageError) {
          console.error('Error clearing auth data:', storageError);
        } finally {
          // Update state regardless of storage success
          setState(prevState => ({
            ...prevState,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          }));
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      // Enforce lockout protection before attempting sign-in
      const locked = await isAccountLockedOut();
      if (locked) {
        const remaining = await getRemainingLockoutTime();
        throw new Error(`Too many attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`);
      }

      await signInWithEmailAndPassword(auth, email, password);
      // Reset lockout counters on successful sign-in
      await resetLoginAttempts();
      // onAuthStateChanged will handle the rest
    } catch (error) {
      // Record failed attempt to support lockout/backoff
      try { await recordFailedLoginAttempt(email); } catch {}
      setState(prevState => ({ 
        ...prevState, 
        error: handleAuthError(error), 
        isLoading: false 
      }));
    }
  };

  /**
   * Move profile image from pending path to user's profile path
   * @param userId User ID
   * @param pendingImageUrl URL of the image in the pending path
   * @returns Promise resolving to the new image URL
   */
  const movePendingProfileImage = async (userId: string, pendingImageUrl: string): Promise<string | null> => {
    try {
      console.log('Moving pending profile image:', pendingImageUrl);
      
      // Check if the URL is from the pending path
      if (!pendingImageUrl || !pendingImageUrl.includes('profile_images/pending')) {
        return pendingImageUrl;
      }
      
      // Extract the filename from the URL
      const urlParts = pendingImageUrl.split('?')[0].split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (!fileName) {
        console.warn('Could not extract filename from URL:', pendingImageUrl);
        
        // Try to list all files in the pending directory as a fallback
        try {
          const pendingRef = ref(storage, 'profile_images/pending');
          const pendingFiles = await listAll(pendingRef);
          
          // Find the file that matches the URL
          let foundFileName = null;
          for (const item of pendingFiles.items) {
            const itemUrl = await getDownloadURL(item);
            if (itemUrl === pendingImageUrl) {
              foundFileName = item.name;
              break;
            }
          }
          
          if (foundFileName) {
            console.log('Found filename through listing:', foundFileName);
          } else {
            console.warn('Could not find pending profile image file');
            return pendingImageUrl;
          }
        } catch (listError) {
          console.error('Error listing pending files:', listError);
          return pendingImageUrl;
        }
      }
      
      console.log('Attempting to download file:', fileName);
      
      // Download the file
      const response = await fetch(pendingImageUrl);
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText);
        return pendingImageUrl;
      }
      
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        console.error('Downloaded blob is empty or invalid');
        return pendingImageUrl;
      }
      
      console.log('Successfully downloaded blob, size:', blob.size, 'type:', blob.type);
      
      // Generate a unique filename to avoid collisions
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${fileName || 'profile.jpg'}`;
      
      // Upload to the user's profile path
      const userProfileRef = ref(storage, `profile_images/${userId}/${uniqueFileName}`);
      
      console.log('Uploading to:', `profile_images/${userId}/${uniqueFileName}`);
      await uploadBytes(userProfileRef, blob);
      
      // Get the new URL
      const newImageUrl = await getDownloadURL(userProfileRef);
      
      // Delete the pending file if we found a filename
      if (fileName) {
        try {
          const pendingFileRef = ref(storage, `profile_images/pending/${fileName}`);
          await deleteObject(pendingFileRef);
          console.log('Deleted pending file:', fileName);
        } catch (deleteError) {
          console.warn('Error deleting pending file:', deleteError);
          // Continue even if delete fails
        }
      }
      
      console.log('Successfully moved profile image to user path:', newImageUrl);
      return newImageUrl;
    } catch (error) {
      console.error('Error moving pending profile image:', error);
      // Return the original URL if there was an error
      return pendingImageUrl;
    }
  };

  const signUp = async (email: string, password: string, name: string, userProfile?: UserProfile) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Check if profile image was uploaded to pending path and move it
      let profileImageUrl = userProfile?.profileImageUrl || null;
      if (profileImageUrl && profileImageUrl.includes('profile_images/pending')) {
        try {
          const newImageUrl = await movePendingProfileImage(user.uid, profileImageUrl);
          if (newImageUrl) {
            profileImageUrl = newImageUrl;
          }
        } catch (imageError) {
          console.error('Error moving profile image:', imageError);
          // Continue with registration even if image move fails
        }
      }
      
      // Update user profile with name and photo URL
      await updateProfile(user, {
        displayName: name,
        ...(profileImageUrl && { photoURL: profileImageUrl })
      });

      // Create user document in Firestore
      try {
        // Create user data object
        const userData = {
          name: name,
          email: email,
          phoneNumber: userProfile?.phoneNumber || null,
          city: userProfile?.city || null,
          country: userProfile?.country || null,
          interests: userProfile?.interests || [],
          userType: userProfile?.userType || 'attendee',
          organizationName: userProfile?.organizationName || null,
          profileImageUrl: profileImageUrl,
          createdAt: userProfile?.createdAt || new Date().toISOString(),
          uid: user.uid
        };
        
        // Sanitize the data to remove any undefined values
        const sanitizedData = sanitizeForFirestore(userData);
        
        // Save to Firestore
        await setDoc(doc(db, "users", user.uid), sanitizedData);
      } catch (firestoreError) {
        console.error('Error creating user document:', firestoreError);
        // Consider if you want to delete the auth user if Firestore fails
        // await user.delete();
        // throw new Error('Failed to create user profile');
      }
      
      // Return user ID
      return user.uid;
    } catch (error) {
      setState(prevState => ({ 
        ...prevState, 
        error: handleAuthError(error), 
        isLoading: false 
      }));
      throw error; // Rethrow to handle in the component
    }
  };

  const signOut = async () => {
    setState(prevState => ({ ...prevState, isLoading: true }));
    try {
      await firebaseSignOut(auth);
      // Also manually clear the stored auth data and OAuth tokens
      await secureDelete(AUTH_STORAGE_KEY);
      try { await googleOAuthCompliance.clearTokens(); } catch {}
      
      // onAuthStateChanged will handle the rest of state updates
      router.replace('/(auth)/login');
    } catch (error) {
      setState(prevState => ({ 
        ...prevState, 
        error: handleAuthError(error), 
        isLoading: false 
      }));
    }
  };

  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  const resetPassword = async (email: string) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      await sendPasswordResetEmail(auth, email);
      setState(prevState => ({ ...prevState, isLoading: false }));
    } catch (error) {
      setState(prevState => ({ 
        ...prevState, 
        error: handleAuthError(error), 
        isLoading: false 
      }));
      throw error; // Re-throw to handle in the component
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      await googleSignIn();
      // The onAuthStateChanged listener will handle updating the state
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Check if the error is due to an existing account with different credentials
      const existingEmail = getExistingAccountEmail(error);
      if (existingEmail) {
        setState(prevState => ({
          ...prevState,
          error: `An account already exists with the email ${existingEmail}. Please sign in using your original method.`,
          isLoading: false
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          error: handleAuthError(error),
          isLoading: false
        }));
      }
    }
  };

  // Link current account with Google
  const linkAccountWithGoogle = async () => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      if (!auth.currentUser) {
        throw new Error('You must be signed in to link accounts');
      }
      
      await linkWithGoogle(auth.currentUser);
      
      // Update the user state to reflect the linked account
      setState(prevState => {
        if (prevState.user) {
          const linkedProviders = prevState.user.linkedProviders || [];
          return {
            ...prevState,
            user: {
              ...prevState.user,
              linkedProviders: [...linkedProviders, 'google']
            },
            isLoading: false
          };
        }
        return { ...prevState, isLoading: false };
      });
    } catch (error) {
      console.error('Error linking with Google:', error);
      setState(prevState => ({
        ...prevState,
        error: handleAuthError(error),
        isLoading: false
      }));
    }
  };

  // Check if an email is already registered and get sign-in methods
  const checkExistingAccount = async (email: string): Promise<string[]> => {
    try {
      return await fetchSignInMethodsForEmail(auth, email);
    } catch (error) {
      console.error('Error checking existing account:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        clearError,
        resetPassword,
        signInWithGoogle,
        linkAccountWithGoogle,
        checkExistingAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Enhanced error handling function for Firebase auth errors
function handleAuthError(error: unknown): string {
  console.error('Auth error:', error);
  
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'Account disabled';
      case 'auth/user-not-found':
        return 'Invalid email or password';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password';
      case 'auth/invalid-credential':
        return 'Invalid login credentials';
      case 'auth/credential-already-in-use':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please log in again';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign in';
      case 'auth/cancelled-popup-request':
        return 'The sign-in popup was cancelled';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by the browser. Please allow popups for this site';
      case 'auth/missing-android-pkg-name':
      case 'auth/missing-continue-uri':
      case 'auth/missing-ios-bundle-id':
      case 'auth/invalid-continue-uri':
      case 'auth/unauthorized-continue-uri':
        return 'The authentication request configuration is invalid';
      default:
        return `Authentication failed: ${errorCode}`;
    }
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return 'An unknown authentication error occurred';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Add default export
export default AuthProvider;