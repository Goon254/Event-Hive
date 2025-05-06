// app/services/recommendationService.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy, 
  startAfter,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { EnhancedConnection, ConnectionStatus } from '../models/connection/types';
import { connectionService } from './connectionService';

// Constants
const RECOMMENDATIONS_PER_PAGE = 10;
const RECOMMENDATION_CACHE_KEY = 'user_recommendations_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Service for generating connection recommendations
 */
export class RecommendationService {
  /**
   * Get connection recommendations for a user
   * @param userId User ID
   * @param existingConnectionIds Array of existing connection IDs to exclude
   * @param lastRecommendation Last recommendation for pagination
   * @param count Number of recommendations to fetch
   * @returns Promise resolving to recommended connections
   */
  /**
   * Get connection recommendations for a user from Firebase
   * This optimized implementation fetches suggestions from a dedicated collection
   * and applies filtering based on user privacy settings
   *
   * @param userId User ID
   * @param existingConnectionIds Array of existing connection IDs to exclude
   * @param lastRecommendation Last recommendation for pagination
   * @param count Number of recommendations to fetch
   * @returns Promise resolving to recommended connections
   */
  async getRecommendations(
    userId: string,
    existingConnectionIds: string[] = [],
    lastRecommendation: any = null,
    count: number = RECOMMENDATIONS_PER_PAGE
  ): Promise<EnhancedConnection[]> {
    try {
      // Get user profile to verify user exists and check privacy settings
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Check if user has recommendations enabled in privacy settings
      const privacySettingsRef = doc(db, 'privacySettings', userId);
      const privacySettingsDoc = await getDoc(privacySettingsRef);
      
      // Default to enabled if no privacy settings found
      let recommendationsEnabled = true;
      
      if (privacySettingsDoc.exists()) {
        const privacySettings = privacySettingsDoc.data();
        recommendationsEnabled = privacySettings.allowRecommendations !== false;
      }
      
      if (!recommendationsEnabled) {
        console.log('User has disabled recommendations in privacy settings');
        return [];
      }
      
      // Build query to fetch suggestions from the userSuggestions collection
      // This collection stores pre-computed suggestions for each user
      const suggestionsRef = collection(db, 'userSuggestions');
      let suggestionsQuery;
      
      if (lastRecommendation) {
        suggestionsQuery = query(
          suggestionsRef,
          where('userId', '==', userId),
          orderBy('score', 'desc'),
          startAfter(lastRecommendation),
          limit(count * 2) // Fetch more to account for filtering
        );
      } else {
        suggestionsQuery = query(
          suggestionsRef,
          where('userId', '==', userId),
          orderBy('score', 'desc'),
          limit(count * 2) // Fetch more to account for filtering
        );
      }
      
      // Get suggestions
      const suggestionsSnapshot = await getDocs(suggestionsQuery);
      
      if (suggestionsSnapshot.empty) {
        console.log('No suggestions found for this user');
        
        // Fall back to generating suggestions on-the-fly
        return this.generateSuggestionsFromUsers(userId, existingConnectionIds, lastRecommendation, count);
      }
      
      console.log(`Found ${suggestionsSnapshot.docs.length} suggestions`);
      
      // Convert to EnhancedConnection objects
      const recommendations: EnhancedConnection[] = [];
      
      for (const docSnapshot of suggestionsSnapshot.docs) {
        const suggestion = docSnapshot.data();
        const suggestedUserId = suggestion.suggestedUserId;
        
        // Skip if already in existing connections
        if (existingConnectionIds.includes(suggestedUserId)) continue;
        
        // Get user details
        const suggestedUserDoc = await getDoc(doc(db, 'users', suggestedUserId));
        
        if (!suggestedUserDoc.exists()) {
          console.log(`Suggested user ${suggestedUserId} not found, skipping`);
          continue;
        }
        
        const suggestedUser = suggestedUserDoc.data();
        
        // Check if suggested user allows being recommended
        const suggestedUserPrivacyRef = doc(db, 'privacySettings', suggestedUserId);
        const suggestedUserPrivacyDoc = await getDoc(suggestedUserPrivacyRef);
        
        let canBeRecommended = true;
        
        if (suggestedUserPrivacyDoc.exists()) {
          const suggestedUserPrivacy = suggestedUserPrivacyDoc.data();
          
          // Skip users who have set their profile to private
          if (suggestedUserPrivacy.profileVisibility === 'private') {
            canBeRecommended = false;
          }
        }
        
        if (!canBeRecommended) continue;
        
        // Create recommendation reason based on suggestion data
        let recommendationReason = suggestion.reason || 'Suggested for you';
        
        // If mutual connections are specified in the suggestion, use that
        if (suggestion.mutualConnectionCount > 0) {
          recommendationReason = `${suggestion.mutualConnectionCount} mutual connection${suggestion.mutualConnectionCount > 1 ? 's' : ''}`;
        } else {
          // Otherwise, calculate mutual connections
          const mutualConnections = await this.getMutualConnections(userId, suggestedUserId);
          suggestion.mutualConnectionCount = mutualConnections.length;
          
          if (mutualConnections.length > 0) {
            recommendationReason = `${mutualConnections.length} mutual connection${mutualConnections.length > 1 ? 's' : ''}`;
          }
        }
        
        recommendations.push({
          id: docSnapshot.id,
          userId: userId,
          connectionId: suggestedUserId,
          status: ConnectionStatus.PENDING,
          name: suggestedUser.name || suggestedUser.displayName || 'Unknown',
          avatar: suggestedUser.profileImageUrl || suggestedUser.photoURL,
          role: suggestedUser.userType || suggestedUser.role || 'User',
          mutualConnections: suggestion.mutualConnectionCount || 0,
          recommendationScore: suggestion.score || 0.5,
          recommendationReason: recommendationReason,
          lastSeen: suggestedUser.lastActive || null,
        });
        
        // Stop once we have enough recommendations
        if (recommendations.length >= count) {
          break;
        }
      }
      
      // If we don't have enough recommendations, fall back to generating more
      if (recommendations.length < count) {
        const additionalRecommendations = await this.generateSuggestionsFromUsers(
          userId,
          [...existingConnectionIds, ...recommendations.map(r => r.connectionId)],
          lastRecommendation,
          count - recommendations.length
        );
        
        recommendations.push(...additionalRecommendations);
      }
      
      console.log(`Returning ${recommendations.length} recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
  
  /**
   * Generate suggestions from users collection as a fallback
   * This is used when no pre-computed suggestions are available
   *
   * @param userId User ID
   * @param existingConnectionIds Array of existing connection IDs to exclude
   * @param lastRecommendation Last recommendation for pagination
   * @param count Number of recommendations to fetch
   * @returns Promise resolving to recommended connections
   */
  async generateSuggestionsFromUsers(
    userId: string,
    existingConnectionIds: string[] = [],
    lastRecommendation: any = null,
    count: number = RECOMMENDATIONS_PER_PAGE
  ): Promise<EnhancedConnection[]> {
    try {
      console.log('Falling back to generating suggestions from users collection');
      
      // Query users collection
      let usersQuery;
      
      if (lastRecommendation) {
        usersQuery = query(
          collection(db, 'users'),
          orderBy('id'),
          startAfter(lastRecommendation),
          limit(count * 2)
        );
      } else {
        usersQuery = query(
          collection(db, 'users'),
          orderBy('id'),
          limit(count * 2)
        );
      }
      
      // Get users
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        console.log('No users found in the database');
        return [];
      }
      
      // Convert to EnhancedConnection objects
      const recommendations: EnhancedConnection[] = [];
      
      for (const docSnapshot of usersSnapshot.docs) {
        const user = docSnapshot.data();
        
        // Skip current user
        if (user.id === userId) continue;
        
        // Skip if already in existing connections
        if (existingConnectionIds.includes(user.id)) continue;
        
        // Check user privacy settings
        const userPrivacyRef = doc(db, 'privacySettings', user.id);
        const userPrivacyDoc = await getDoc(userPrivacyRef);
        
        let canBeRecommended = true;
        
        if (userPrivacyDoc.exists()) {
          const userPrivacy = userPrivacyDoc.data();
          
          // Skip users who have set their profile to private
          if (userPrivacy.profileVisibility === 'private') {
            canBeRecommended = false;
          }
        }
        
        if (!canBeRecommended) continue;
        
        // Get mutual connections
        const mutualConnections = await this.getMutualConnections(userId, user.id);
        
        // Create recommendation reason
        let recommendationReason = 'Suggested for you';
        
        if (mutualConnections.length > 0) {
          recommendationReason = `${mutualConnections.length} mutual connection${mutualConnections.length > 1 ? 's' : ''}`;
        }
        
        // Calculate recommendation score based on mutual connections
        const recommendationScore = Math.min(0.5 + (mutualConnections.length * 0.1), 1);
        
        recommendations.push({
          id: `rec_${user.id}`,
          userId: userId,
          connectionId: user.id,
          status: ConnectionStatus.PENDING,
          name: user.name || user.displayName || 'Unknown',
          avatar: user.profileImageUrl || user.photoURL,
          role: user.userType || user.role || 'User',
          mutualConnections: mutualConnections.length,
          recommendationScore: recommendationScore,
          recommendationReason: recommendationReason,
          lastSeen: user.lastActive || null,
        });
        
        // Stop once we have enough recommendations
        if (recommendations.length >= count) {
          break;
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating suggestions from users:', error);
      return [];
    }
  }
  
  /**
   * Calculate match score between two users
   * @param currentUser Current user data
   * @param potentialMatch Potential match user data
   * @param userInterests Current user interests
   * @param userSkills Current user skills
   * @param userIndustry Current user industry
   * @param userLocation Current user location
   * @returns Object with score and match reasons
   */
  private calculateMatchScore(
    currentUser: any,
    potentialMatch: any,
    userInterests: string[],
    userSkills: string[],
    userIndustry: string,
    userLocation: string
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    
    // Match on interests
    const potentialInterests = potentialMatch.interests || [];
    const commonInterests = userInterests.filter(interest => 
      potentialInterests.includes(interest)
    );
    
    if (commonInterests.length > 0) {
      score += commonInterests.length * 10;
      reasons.push(`${commonInterests.length} shared interests`);
    }
    
    // Match on skills
    const potentialSkills = potentialMatch.skills || [];
    const commonSkills = userSkills.filter(skill => 
      potentialSkills.includes(skill)
    );
    
    if (commonSkills.length > 0) {
      score += commonSkills.length * 8;
      reasons.push(`${commonSkills.length} shared skills`);
    }
    
    // Match on industry
    if (userIndustry && potentialMatch.industry === userIndustry) {
      score += 15;
      reasons.push(`Same industry: ${userIndustry}`);
    }
    
    // Match on location
    if (userLocation && potentialMatch.location === userLocation) {
      score += 12;
      reasons.push(`Same location: ${userLocation}`);
    }
    
    // Match on education
    if (currentUser.education && potentialMatch.education) {
      const userSchools = Array.isArray(currentUser.education) 
        ? currentUser.education.map((e: any) => e.school) 
        : [currentUser.education.school];
      
      const potentialSchools = Array.isArray(potentialMatch.education) 
        ? potentialMatch.education.map((e: any) => e.school) 
        : [potentialMatch.education.school];
      
      const commonSchools = userSchools.filter((school: string) =>
        potentialSchools.includes(school)
      );
      
      if (commonSchools.length > 0) {
        score += 20;
        reasons.push(`Attended same school`);
      }
    }
    
    // Match on company
    if (currentUser.workExperience && potentialMatch.workExperience) {
      const userCompanies = Array.isArray(currentUser.workExperience) 
        ? currentUser.workExperience.map((w: any) => w.company) 
        : [currentUser.workExperience.company];
      
      const potentialCompanies = Array.isArray(potentialMatch.workExperience) 
        ? potentialMatch.workExperience.map((w: any) => w.company) 
        : [potentialMatch.workExperience.company];
      
      const commonCompanies = userCompanies.filter((company: string) =>
        potentialCompanies.includes(company)
      );
      
      if (commonCompanies.length > 0) {
        score += 25;
        reasons.push(`Worked at same company`);
      }
    }
    
    // If no specific matches, add a generic reason
    if (reasons.length === 0) {
      reasons.push('Based on your profile');
    }
    
    // Normalize score to 0-1 range
    const normalizedScore = Math.min(score / 100, 1);
    
    return { score: normalizedScore, reasons };
  }
  
  /**
   * Get mutual connections between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Promise resolving to array of mutual connection IDs
   */
  async getMutualConnections(userId1: string, userId2: string): Promise<string[]> {
    try {
      // Get connections for both users
      const connections1 = await connectionService.fetchConnections(userId1);
      const connections2 = await connectionService.fetchConnections(userId2);
      
      // Extract connection IDs
      const connectionIds1 = connections1
        .filter(c => c.status === ConnectionStatus.ACCEPTED)
        .map(c => c.userId === userId1 ? c.connectionId : c.userId);
      
      const connectionIds2 = connections2
        .filter(c => c.status === ConnectionStatus.ACCEPTED)
        .map(c => c.userId === userId2 ? c.connectionId : c.userId);
      
      // Find mutual connections
      const mutualConnectionIds = connectionIds1.filter(id => 
        connectionIds2.includes(id)
      );
      
      return mutualConnectionIds;
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      return [];
    }
  }
}

// Create singleton instance
export const recommendationService = new RecommendationService();

/**
 * Hook for using recommendations in components
 * @param user User object
 * @returns Recommendation state and functions
 */
/**
 * Enhanced hook for using recommendations in components
 * Includes better error handling, privacy checks, and performance optimizations
 *
 * @param user User object
 * @returns Recommendation state and functions
 */
export function useRecommendations(user: any) {
  const [recommendations, setRecommendations] = useState<EnhancedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true);
  const [lastRecommendation, setLastRecommendation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [privacyEnabled, setPrivacyEnabled] = useState<boolean>(true);
  
  // Check privacy settings
  useEffect(() => {
    if (!user) return;
    
    const checkPrivacySettings = async () => {
      try {
        const privacySettingsRef = doc(db, 'privacySettings', user.id);
        const privacySettingsDoc = await getDoc(privacySettingsRef);
        
        if (privacySettingsDoc.exists()) {
          const settings = privacySettingsDoc.data();
          setPrivacyEnabled(settings.allowRecommendations !== false);
        } else {
          // Default to enabled if no settings found
          setPrivacyEnabled(true);
        }
      } catch (error) {
        console.error('Error checking privacy settings:', error);
        // Default to enabled on error
        setPrivacyEnabled(true);
      }
    };
    
    checkPrivacySettings();
  }, [user]);
  
  // Fetch recommendations with improved error handling and caching
  const fetchRecommendations = useCallback(async (refresh: boolean = false) => {
    if (!user) return;
    
    // Don't fetch if recommendations are disabled in privacy settings
    if (!privacyEnabled) {
      setError('Recommendations are disabled in your privacy settings');
      setRecommendations([]);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }
    
    try {
      setError(null);
      
      if (refresh) {
        setIsLoading(true);
        setLastRecommendation(null);
      } else {
        setIsLoadingMore(true);
      }
      
      // Get existing connection IDs to exclude
      const connections = await connectionService.fetchConnections(user.id);
      const existingConnectionIds = connections.map(c =>
        c.userId === user.id ? c.connectionId : c.userId
      );
      
      console.log(`Fetching recommendations for user ${user.id}`);
      console.log(`Excluding ${existingConnectionIds.length} existing connections`);
      
      // Get recommendations with timeout handling
      const fetchPromise = recommendationService.getRecommendations(
        user.id,
        existingConnectionIds,
        refresh ? null : lastRecommendation
      );
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<EnhancedConnection[]>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });
      
      const newRecommendations = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`Received ${newRecommendations.length} recommendations`);
      
      // Update state
      if (refresh) {
        setRecommendations(newRecommendations);
      } else {
        // Deduplicate recommendations when appending
        const existingIds = new Set(recommendations.map(r => r.connectionId));
        const uniqueNewRecommendations = newRecommendations.filter(
          r => !existingIds.has(r.connectionId)
        );
        
        setRecommendations(prev => [...prev, ...uniqueNewRecommendations]);
      }
      
      // Update pagination state
      if (newRecommendations.length < RECOMMENDATIONS_PER_PAGE) {
        setHasMoreRecommendations(false);
      } else {
        setHasMoreRecommendations(true);
        setLastRecommendation(newRecommendations[newRecommendations.length - 1]);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setError(error.message || 'Failed to load recommendations');
      
      // Don't clear existing recommendations on error when loading more
      if (refresh) {
        setRecommendations([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, lastRecommendation, recommendations, privacyEnabled]);
  
  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRecommendations(true);
    }
  }, [user, fetchRecommendations]);
  
  return {
    recommendations,
    isLoading,
    isLoadingMore,
    hasMoreRecommendations,
    fetchRecommendations,
    loadMoreRecommendations: () => fetchRecommendations(false),
    error
  };
}

// Add default export
export default RecommendationService;