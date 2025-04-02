//app/context/AuthContext.tsx
// Code for the AuthContext component
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect 
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
import { auth } from '../lib/firebaseConfig'; // Your Firebase config

interface User {
  avatar: undefined;
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          avatar: undefined,
        };
        await AsyncStorage.setItem('authToken', JSON.stringify(user));
        setState({ ...state, user, isAuthenticated: true, isLoading: false });
      } else {
        await AsyncStorage.removeItem('authToken');
        setState({ ...state, user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState({ ...state, isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setState({ 
        ...state, 
        error: handleAuthError(error), 
        isLoading: false 
      });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setState({ ...state, isLoading: true, error: null });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Update user profile with name
      await updateProfile(user, { displayName: name });
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setState({ 
        ...state, 
        error: handleAuthError(error), 
        isLoading: false 
      });
    }
  };

  const signOut = async () => {
    setState({ ...state, isLoading: true });
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle the rest
      router.replace('/(auth)/login');
    } catch (error) {
      setState({ 
        ...state, 
        error: handleAuthError(error), 
        isLoading: false 
      });
    }
  };

  const clearError = () => {
    setState({ ...state, error: null });
  };

  const resetPassword = async (email: string) => {
    setState({ ...state, isLoading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      setState({ ...state, isLoading: false });
    } catch (error) {
      setState({ 
        ...state, 
        error: handleAuthError(error), 
        isLoading: false 
      });
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

// Helper function for Firebase auth errors
function handleAuthError(error: unknown): string {
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
      default:
        return 'Authentication failed';
    }
  }
  return 'An unknown error occurred';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}