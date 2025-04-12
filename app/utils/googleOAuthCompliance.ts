// app/utils/googleOAuthCompliance.ts
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Google OAuth 2.0 Compliance Utilities
 * 
 * This module implements the required security measures to comply with Google's OAuth 2.0 policy
 * for keeping apps secure, including:
 * 
 * 1. Proper state parameter handling to prevent CSRF attacks
 * 2. PKCE (Proof Key for Code Exchange) implementation
 * 3. Secure token storage
 * 4. Proper redirect URI validation
 * 5. Proper scopes handling
 */

// Constants for secure storage keys
const STATE_KEY = 'google_oauth_state';
const CODE_VERIFIER_KEY = 'google_oauth_code_verifier';
const TOKEN_KEY = 'google_oauth_tokens';

// Verify app is properly registered with Google
export const verifyAppConfiguration = (): boolean => {
  // Check if we have valid client IDs configured
  const { googleClientId, googleExpoClientId } = Constants.expoConfig?.extra || {};
  
  if (!googleClientId || !googleExpoClientId) {
    console.error('Missing Google OAuth client IDs in app configuration');
    return false;
  }
  
  return true;
};

/**
 * Generate a secure random state parameter to prevent CSRF attacks
 * This is required by Google's OAuth 2.0 policy
 */
export const generateSecureState = async (): Promise<string> => {
  try {
    // Generate a random string using crypto-secure random bytes
    const randomBytes = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36) + Date.now().toString(),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // Store the state parameter securely
    await SecureStore.setItemAsync(STATE_KEY, randomBytes);
    
    return randomBytes;
  } catch (error) {
    console.error('Error generating secure state:', error);
    throw new Error('Failed to generate secure state parameter');
  }
};

/**
 * Verify the state parameter returned from Google to prevent CSRF attacks
 */
export const verifyState = async (returnedState: string): Promise<boolean> => {
  try {
    const storedState = await SecureStore.getItemAsync(STATE_KEY);
    
    // Clear the stored state after verification
    await SecureStore.deleteItemAsync(STATE_KEY);
    
    return storedState === returnedState;
  } catch (error) {
    console.error('Error verifying state:', error);
    return false;
  }
};

/**
 * Generate PKCE code verifier and challenge
 * PKCE is required for public clients (like mobile apps) to enhance security
 */
export const generatePKCE = async (): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> => {
  try {
    // Generate a random code verifier
    const codeVerifier = Array(128)
      .fill(0)
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('')
      .slice(0, 128);
    
    // Store the code verifier securely
    await SecureStore.setItemAsync(CODE_VERIFIER_KEY, codeVerifier);
    
    // Generate code challenge using SHA-256
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // Base64-URL encode the code challenge
    const base64UrlCodeChallenge = codeChallenge
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return {
      codeVerifier,
      codeChallenge: base64UrlCodeChallenge
    };
  } catch (error) {
    console.error('Error generating PKCE:', error);
    throw new Error('Failed to generate PKCE parameters');
  }
};

/**
 * Get the stored code verifier for token exchange
 */
export const getCodeVerifier = async (): Promise<string | null> => {
  try {
    const codeVerifier = await SecureStore.getItemAsync(CODE_VERIFIER_KEY);
    
    // Clear the stored code verifier after retrieval
    if (codeVerifier) {
      await SecureStore.deleteItemAsync(CODE_VERIFIER_KEY);
    }
    
    return codeVerifier;
  } catch (error) {
    console.error('Error getting code verifier:', error);
    return null;
  }
};

/**
 * Securely store OAuth tokens
 */
export const storeTokens = async (tokens: any): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw new Error('Failed to securely store tokens');
  }
};

/**
 * Retrieve stored OAuth tokens
 */
export const getTokens = async (): Promise<any | null> => {
  try {
    const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return null;
  }
};

/**
 * Clear stored OAuth tokens (for logout)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Get the correct redirect URI based on platform
 * This ensures the redirect URI matches what's configured in Google Cloud Console
 */
export const getRedirectUri = (): string => {
  // For Expo Go
  if (Constants.appOwnership === 'expo') {
    return `${Constants.expoConfig?.scheme || 'exp'}://expo-development-client`;
  }
  
  // For standalone apps
  const scheme = Constants.expoConfig?.scheme;
  if (!scheme) {
    throw new Error('App scheme is not defined in app.json/app.config.js');
  }
  
  if (Platform.OS === 'web') {
    // For web, use the current origin
    return window.location.origin;
  } else {
    // For native platforms
    return `${scheme}://${Platform.OS === 'ios' ? 'oauth' : 'oauth-callback'}`;
  }
};

/**
 * Get the required and optional scopes for Google OAuth
 * Limiting scopes to only what's needed is a security best practice
 */
export const getScopes = (additionalScopes: string[] = []): string[] => {
  // Basic scopes required for authentication
  const requiredScopes = [
    'openid',
    'profile',
    'email'
  ];
  
  // Add additional scopes if needed
  return [...new Set([...requiredScopes, ...additionalScopes])];
};

/**
 * Validate the OAuth configuration against Google's requirements
 */
export const validateOAuthConfig = (): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if app is properly registered
  if (!verifyAppConfiguration()) {
    issues.push('Missing Google OAuth client IDs in app configuration');
  }
  
  // Check if redirect URI is properly configured
  try {
    getRedirectUri();
  } catch (error) {
    issues.push('Invalid redirect URI configuration: ' + (error instanceof Error ? error.message : String(error)));
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Get the complete OAuth request configuration that complies with Google's requirements
 */
export const getCompliantOAuthConfig = async (additionalScopes: string[] = []): Promise<any> => {
  // Generate state parameter for CSRF protection
  const state = await generateSecureState();
  
  // Generate PKCE for enhanced security
  const { codeVerifier, codeChallenge } = await generatePKCE();
  
  // Get the correct client ID based on platform
  const { googleClientId, googleExpoClientId } = Constants.expoConfig?.extra || {};
  const clientId = Constants.appOwnership === 'expo' ? googleExpoClientId : googleClientId;
  
  return {
    clientId,
    redirectUri: getRedirectUri(),
    scopes: getScopes(additionalScopes),
    state,
    codeChallengeMethod: 'S256',
    codeChallenge,
    usePKCE: true,
    responseType: 'code', // Use authorization code flow, not implicit flow
    prompt: 'select_account', // Always show account selector
    accessType: 'offline', // Request refresh token
  };
};