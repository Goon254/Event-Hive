// app/services/oauthService.ts
import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';

// Constants
const API_BASE_URL = 'https://api.scangoapp.com';
const OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'linkedin'];

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

/**
 * Service for handling OAuth authentication
 */
export class OAuthService {
  /**
   * Sign in with OAuth provider
   * @param provider OAuth provider (google, facebook, twitter, linkedin)
   * @param userId User ID
   * @returns Promise resolving to success status
   */
  async signIn(provider: string, userId: string): Promise<boolean> {
    try {
      // Define redirect URI
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'scangoapp',
        path: 'oauth',
      });
      
      // Define auth endpoints based on provider
      let authUrl = '';
      let tokenUrl = '';
      let clientId = '';
      
      switch (provider) {
        case 'google':
          authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
          tokenUrl = 'https://oauth2.googleapis.com/token';
          clientId = '559026210442-abc123def456.apps.googleusercontent.com'; // Replace with actual client ID
          break;
        case 'facebook':
          authUrl = 'https://www.facebook.com/v12.0/dialog/oauth';
          tokenUrl = 'https://graph.facebook.com/v12.0/oauth/access_token';
          clientId = '123456789012345'; // Replace with actual client ID
          break;
        case 'twitter':
          // Twitter uses OAuth 1.0a which is more complex
          // For simplicity, we'll use a placeholder flow
          authUrl = 'https://twitter.com/i/oauth2/authorize';
          tokenUrl = 'https://api.twitter.com/2/oauth2/token';
          clientId = 'twitter-client-id'; // Replace with actual client ID
          break;
        case 'linkedin':
          authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
          tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
          clientId = 'linkedin-client-id'; // Replace with actual client ID
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Create auth request
      const discovery = {
        authorizationEndpoint: authUrl,
        tokenEndpoint: tokenUrl,
      };
      
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['profile', 'email'],
        redirectUri,
      });
      
      // Start auth flow
      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success') {
        // Exchange code for token
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: result.params.code,
            redirect_uri: redirectUri,
            client_id: clientId,
          }).toString(),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Get user profile from provider
        const userProfileResponse = await fetch(`${API_BASE_URL}/auth/${provider}/profile`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        const userProfile = await userProfileResponse.json();
        
        // Link social account to user
        await fetch(`${API_BASE_URL}/users/${userId}/social`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            providerId: userProfile.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
          }),
        });
        
        // Fetch connections from this social network
        await this.fetchSocialConnections(provider, tokenData.access_token, userId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error with ${provider} OAuth:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch connections from social network
   * @param provider OAuth provider
   * @param accessToken Access token
   * @param userId User ID
   * @returns Promise resolving to success status
   */
  async fetchSocialConnections(provider: string, accessToken: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/social/${provider}/connections`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${provider} connections`);
      }
      
      const data = await response.json();
      
      // Process social connections
      const socialConnections = data.connections.map((conn: any) => ({
        id: `${provider}_${conn.id}`,
        userId: userId,
        connectionId: conn.id,
        status: 'accepted',
        name: conn.name,
        avatar: conn.avatar,
        role: conn.occupation || conn.title,
        mutualConnections: conn.mutualConnections || 0,
        connectionDate: new Date(),
        lastInteraction: new Date(),
        recommendationScore: 0.9,
        recommendationReason: `Connected on ${provider}`,
        isOnline: false,
      }));
      
      // Store social connections
      await fetch(`${API_BASE_URL}/users/${userId}/social-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connections: socialConnections }),
      });
      
      return true;
    } catch (error) {
      console.error(`Error fetching ${provider} connections:`, error);
      throw error;
    }
  }
  
  /**
   * Get provider color
   * @param provider OAuth provider
   * @returns Color string
   */
  getProviderColor(provider: string): string {
    switch (provider) {
      case 'google': return '#DB4437';
      case 'facebook': return '#4267B2';
      case 'twitter': return '#1DA1F2';
      case 'linkedin': return '#0077B5';
      default: return '#007AFF';
    }
  }
  
  /**
   * Get available OAuth providers
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    return OAUTH_PROVIDERS;
  }
}

// Create singleton instance
export const oauthService = new OAuthService();

/**
 * Hook for using OAuth in components
 * @param user User object
 * @returns OAuth state and functions
 */
export function useOAuth(user: any) {
  const [oauthLoading, setOauthLoading] = useState(false);
  
  // Sign in with OAuth provider
  const oauthSignIn = useCallback(async (provider: string) => {
    if (!user) return;
    
    try {
      setOauthLoading(true);
      
      const success = await oauthService.signIn(provider, user.id);
      
      if (success) {
        Alert.alert('Success', `Connected with ${provider}`);
      }
      
    } catch (error) {
      console.error(`Error with ${provider} OAuth:`, error);
      Alert.alert('Error', `Failed to connect with ${provider}. Please try again later.`);
    } finally {
      setOauthLoading(false);
    }
  }, [user]);
  
  return {
    oauthLoading,
    oauthSignIn,
    providers: oauthService.getAvailableProviders(),
    getProviderColor: oauthService.getProviderColor,
  };
}