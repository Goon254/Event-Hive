// app/utils/googleAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform, Alert } from 'react-native';
import { useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import Constants from 'expo-constants';
import * as googleOAuthCompliance from './googleOAuthCompliance';
import { sanitizeForFirestore } from '../services/migrationService';

// Register for the authentication callback
WebBrowser.maybeCompleteAuthSession();

// Get client IDs from app config
const getGoogleClientId = () => {
  const {
    googleClientIdIos,
    googleClientIdAndroid,
    googleClientIdWeb,
    googleClientIdExpo
  } = Constants.expoConfig?.extra || {};
  
  if (Platform.OS === 'ios') return googleClientIdIos;
  if (Platform.OS === 'android') return googleClientIdAndroid;
  if (Platform.OS === 'web') return googleClientIdWeb;
  return googleClientIdExpo; // For Expo Go
};

// Fallback values in case config is missing
const googleClientIdAndroid = Constants.expoConfig?.extra?.googleClientIdAndroid || 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const googleClientIdIos = Constants.expoConfig?.extra?.googleClientIdIos || 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const googleClientIdWeb = Constants.expoConfig?.extra?.googleClientIdWeb || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
const googleClientIdExpo = Constants.expoConfig?.extra?.googleClientIdExpo || 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com';

/**
 * Hook to use Google authentication with OAuth 2.0 compliance
 */
export const useGoogleAuth = () => {
  // Validate OAuth configuration
  const { valid, issues } = googleOAuthCompliance.validateOAuthConfig();
  if (!valid) {
    console.error('Google OAuth configuration issues:', issues);
  }
  
  // Use the enhanced auth request with PKCE and state parameter
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleClientIdAndroid,
    iosClientId: googleClientIdIos,
    webClientId: googleClientIdWeb,
    clientId: googleClientIdExpo, // For Expo Go
    scopes: googleOAuthCompliance.getScopes(),
    redirectUri: googleOAuthCompliance.getRedirectUri(),
    // Use PKCE for enhanced security (handled by Expo Auth Session)
    responseType: 'code', // Use authorization code flow for better security
  });

  // Log client IDs for debugging
  useEffect(() => {
    console.log('Current platform:', Platform.OS);
    console.log('Using client ID:', getGoogleClientId());
    console.log('Android client ID:', googleClientIdAndroid);
    console.log('iOS client ID:', googleClientIdIos);
    console.log('Web client ID:', googleClientIdWeb);
    console.log('Expo client ID:', googleClientIdExpo);
  }, []);

  /**
   * Sign in with Google and link with Firebase with enhanced security
   */
  const signInWithGoogle = async () => {
    try {
      // Check if OAuth configuration is valid before proceeding
      if (!valid) {
        throw new Error(`Google OAuth configuration issues: ${issues.join(', ')}`);
      }
      
      // Get the appropriate client ID for the current platform
      const clientId = getGoogleClientId();
      if (!clientId || clientId.includes('YOUR_') || clientId === '') {
        throw new Error('Missing Google OAuth client ID for this platform');
      }
      
      // Generate PKCE and state parameters for enhanced security
      const { codeVerifier, codeChallenge } = await googleOAuthCompliance.generatePKCE();
      const state = await googleOAuthCompliance.generateSecureState();
      
      // Generate state for CSRF protection (stored internally)
      await googleOAuthCompliance.generateSecureState();
      
      // Prompt the user to authenticate with Google with enhanced security
      const result = await promptAsync({
        // No additional options needed, Expo Auth Session handles this
      });
      
      if (result.type === 'success') {
        // Verify state parameter to prevent CSRF attacks
        const isStateValid = await googleOAuthCompliance.verifyState(result.params.state);
        if (!isStateValid) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }
        // Get the access token from the authentication result
        const { authentication } = result;
        if (!authentication) {
          throw new Error('No authentication object returned from Google');
        }
        
        // Store tokens securely
        await googleOAuthCompliance.storeTokens(authentication);
        
        
        // Create a Google credential with the token
        const { accessToken, idToken } = authentication;
        const auth = getAuth();
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        
        // Sign in to Firebase with the Google credential
        const userCredential = await signInWithCredential(auth, credential);
        const { user } = userCredential;
        
        // Check if this is a new user
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // If this is a new user, create a profile document
        if (!userDoc.exists()) {
          // Extract user information from Google profile
          const userData = {
            name: user.displayName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || null,
            city: null,
            country: null,
            interests: [],
            userType: 'attendee',
            organizationName: null,
            profileImageUrl: user.photoURL || null,
            createdAt: new Date().toISOString(),
            uid: user.uid,
            authProvider: 'google'
          };
          
          // Sanitize the data to remove any undefined values
          const sanitizedData = sanitizeForFirestore(userData);
          
          // Save to Firestore
          await setDoc(userDocRef, {
            ...sanitizedData,
            // Add OAuth compliance metadata
            authMetadata: {
              lastSignIn: new Date().toISOString(),
              signInMethod: 'google',
              termsAccepted: true,
              privacyPolicyAccepted: true
            }
          });
        }
        
        return user;
      } else if (result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled by the user');
      } else if (result.type === 'dismiss') {
        throw new Error('Google sign-in was dismissed');
      } else if (result.type === 'error') {
        // Provide more detailed error information
        const errorCode = result.error?.code || 'unknown';
        const errorMessage = result.error?.message || 'Unknown error occurred';
        
        // Check for common OAuth errors
        if (errorCode === 'ERR_CANCELED') {
          throw new Error('Authentication was canceled by the user');
        } else if (errorMessage.includes('invalid_client')) {
          throw new Error('Invalid client ID - check your Google Cloud Console configuration');
        } else if (errorMessage.includes('unauthorized_client')) {
          throw new Error('Unauthorized client - check your Google Cloud Console configuration');
        } else {
          throw new Error(`Google sign-in failed: ${errorCode} - ${errorMessage}`);
        }
      } else {
        throw new Error(`Google sign-in failed with unexpected result type: ${result.type}`);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  /**
   * Link existing account with Google
   * @param currentUser The currently authenticated Firebase user
   */
  const linkWithGoogle = async (currentUser: any) => {
    try {
      // Generate PKCE and state parameters for enhanced security
      const { codeVerifier, codeChallenge } = await googleOAuthCompliance.generatePKCE();
      const state = await googleOAuthCompliance.generateSecureState();
      
      // Generate state for CSRF protection (stored internally)
      await googleOAuthCompliance.generateSecureState();
      
      // Prompt the user to authenticate with Google with enhanced security
      const result = await promptAsync({
        // No additional options needed, Expo Auth Session handles this
      });
      
      if (result.type === 'success') {
        // Verify state parameter to prevent CSRF attacks
        const isStateValid = await googleOAuthCompliance.verifyState(result.params.state);
        if (!isStateValid) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }
        // Get the access token from the authentication result
        const { authentication } = result;
        if (!authentication) {
          throw new Error('No authentication object returned from Google');
        }
        
        // Store tokens securely
        await googleOAuthCompliance.storeTokens(authentication);
        
        
        // Create a Google credential with the token
        const { accessToken, idToken } = authentication;
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        
        // Link the current user with the Google credential
        await currentUser.linkWithCredential(credential);
        
        // Update the user document to indicate Google linking
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, {
          linkedProviders: ['google'],
          lastUpdated: new Date().toISOString(),
          // Add OAuth compliance metadata
          authMetadata: {
            linkedAt: new Date().toISOString(),
            linkMethod: 'google',
            termsAccepted: true,
            privacyPolicyAccepted: true
          }
        }, { merge: true });
        
        return currentUser;
      } else if (result.type === 'cancel') {
        throw new Error('Google account linking was cancelled');
      } else {
        throw new Error(`Google account linking failed: ${result.type}`);
      }
    } catch (error) {
      console.error('Error linking with Google:', error);
      throw error;
    }
  };

  return {
    request,
    response,
    signInWithGoogle,
    linkWithGoogle,
    promptAsync
  };
};

/**
 * Checks if the error is related to an existing account with different credentials
 * @param error The error object from Firebase
 * @returns The email address if found, null otherwise
 */
export const getExistingAccountEmail = (error: any): string | null => {
  if (error.code === 'auth/account-exists-with-different-credential') {
    // Extract email from error message
    const match = error.message.match(/email address: ([^\s]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};