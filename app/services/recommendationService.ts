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
  async getRecommendations(
    userId: string,
    existingConnectionIds: string[] = [],
    lastRecommendation: any = null,
    count: number = RECOMMENDATIONS_PER_PAGE
  ): Promise<EnhancedConnection[]> {
    try {
      // Get user profile to verify user exists
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      // Firestore doesn't support != queries directly
      // Instead, we'll fetch all users and filter out the current user
      let usersQuery;
      
      if (lastRecommendation) {
        usersQuery = query(
          collection(db, 'users'),
          orderBy('id'), // Need to order by the field we're using for pagination
          startAfter(lastRecommendation),
          limit(count * 2) // Fetch more to account for filtering
        );
      } else {
        usersQuery = query(
          collection(db, 'users'),
          orderBy('id'), // Need to order by the field we're using for pagination
          limit(count * 2) // Fetch more to account for filtering
        );
      }
      
      // Get all users
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        console.log('No users found in the database');
        return [];
      }
      
      console.log(`Found ${usersSnapshot.docs.length} potential users`);
      
      // Convert to EnhancedConnection objects
      const recommendations: EnhancedConnection[] = [];
      
      for (const docSnapshot of usersSnapshot.docs) {
        const user = docSnapshot.data();
        
        // Skip current user
        if (user.id === userId) continue;
        
        // Skip if already in existing connections
        if (existingConnectionIds.includes(user.id)) continue;
        
        // Get mutual connections
        const mutualConnections = await this.getMutualConnections(userId, user.id);
        
        // Create recommendation reason
        let recommendationReason = 'Suggested for you';
        
        if (mutualConnections.length > 0) {
          recommendationReason = `${mutualConnections.length} mutual connection${mutualConnections.length > 1 ? 's' : ''}`;
        }
        
        recommendations.push({
          id: `rec_${user.id}`,
          userId: userId,
          connectionId: user.id,
          status: ConnectionStatus.PENDING,
          name: user.name || user.displayName || 'Unknown',
          avatar: user.profileImageUrl || user.photoURL,
          role: user.userType || user.role || 'User',
          mutualConnections: mutualConnections.length,
          recommendationScore: 1, // Set a default high score since we're not calculating scores
          recommendationReason: recommendationReason,
          lastSeen: user.lastActive || null,
        });
        
        // Stop once we have enough recommendations
        if (recommendations.length >= count) {
          break;
        }
      }
      
      console.log(`Returning ${recommendations.length} recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
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
export function useRecommendations(user: any) {
  const [recommendations, setRecommendations] = useState<EnhancedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true);
  const [lastRecommendation, setLastRecommendation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch recommendations
  const fetchRecommendations = useCallback(async (refresh: boolean = false) => {
    if (!user) return;
    
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
      
      // Get recommendations
      const newRecommendations = await recommendationService.getRecommendations(
        user.id,
        existingConnectionIds,
        refresh ? null : lastRecommendation
      );
      
      console.log(`Received ${newRecommendations.length} recommendations`);
      
      // Update state
      if (refresh) {
        setRecommendations(newRecommendations);
      } else {
        setRecommendations(prev => [...prev, ...newRecommendations]);
      }
      
      // Update pagination state
      if (newRecommendations.length < RECOMMENDATIONS_PER_PAGE) {
        setHasMoreRecommendations(false);
      } else {
        setHasMoreRecommendations(true);
        setLastRecommendation(newRecommendations[newRecommendations.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, lastRecommendation]);
  
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