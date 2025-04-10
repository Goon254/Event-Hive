import { 
  createContext, 
  useContext, 
  useState, 
  useEffect,
  useCallback
} from 'react';
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
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { auth, db } from '../lib/firebaseConfig';

// Constants
const AUTH_STORAGE_KEY = 'auth_user_data';

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
}

const INITIAL_STATE: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  // Load stored authentication data on startup
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedAuth) {
          const userData = JSON.parse(storedAuth) as User;
          
          // Optional: Check if the stored auth data is still valid (not expired)
          // For example, you could check if it's been more than X days since authentication
          const now = Date.now();
          const authAge = now - (userData.lastAuthenticated || now);
          const isStillValid = authAge < 30 * 24 * 60 * 60 * 1000; // 30 days for example
          
          if (isStillValid) {
            setState(prevState => ({
              ...prevState,
              user: userData,
              isAuthenticated: true,
              isLoading: false
            }));
          } else {
            // Auth data expired, clear it
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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
            lastAuthenticated: Date.now()
          };
          
          // Store auth data with timestamp
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          
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
            },
            isAuthenticated: true,
            isLoading: false
          }));
        }
      } else {
        try {
          // User is signed out
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setState(prevState => ({ 
        ...prevState, 
        error: handleAuthError(error), 
        isLoading: false 
      }));
    }
  };

  const signUp = async (email: string, password: string, name: string, userProfile?: UserProfile) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Update user profile with name
      await updateProfile(user, { 
        displayName: name,
        ...(userProfile?.profileImageUrl && { photoURL: userProfile.profileImageUrl })
      });

      // Create user document in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          phoneNumber: userProfile?.phoneNumber || null,
          city: userProfile?.city || null,
          country: userProfile?.country || null,
          interests: userProfile?.interests || [],
          userType: userProfile?.userType || 'attendee',
          organizationName: userProfile?.organizationName || null,
          profileImageUrl: userProfile?.profileImageUrl || null,
          createdAt: userProfile?.createdAt || new Date().toISOString(),
          uid: user.uid
        });
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
      // Also manually clear the stored auth data
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        clearError,
        resetPassword
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
    switch ((error as { code: string }).code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'Account disabled';
      case 'auth/user-not-found':
        return 'No user found with this email address';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later';
      case 'auth/invalid-credential':
        return 'Invalid login credentials';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please log in again';
      case 'auth/missing-android-pkg-name':
      case 'auth/missing-continue-uri':
      case 'auth/missing-ios-bundle-id':
      case 'auth/invalid-continue-uri':
      case 'auth/unauthorized-continue-uri':
        return 'The authentication request configuration is invalid';
      default:
        return `Authentication failed: ${(error as { code: string }).code}`;
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