/**
 * Test script for connection suggestions functionality
 * 
 * This script:
 * 1. Fetches suggestions for a test user
 * 2. Verifies the suggestion data structure
 * 3. Tests privacy settings
 * 
 * Run with: node scripts/testSuggestions.js [userId]
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Get user ID from command line arguments or use a default test user
const userId = process.argv[2] || 'testUserId';

/**
 * Test fetching suggestions for a user
 */
async function testSuggestions(userId) {
  console.log(`Testing suggestions for user: ${userId}`);
  
  try {
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} not found`);
      return;
    }
    
    console.log(`Found user: ${userDoc.data().name || 'Unknown'}`);
    
    // Check privacy settings
    const privacyDoc = await db.collection('privacySettings').doc(userId).get();
    let allowRecommendations = true;
    
    if (privacyDoc.exists) {
      const privacySettings = privacyDoc.data();
      allowRecommendations = privacySettings.allowRecommendations !== false;
      console.log(`Privacy settings: allowRecommendations = ${allowRecommendations}`);
    } else {
      console.log('No privacy settings found, using default (recommendations enabled)');
    }
    
    if (!allowRecommendations) {
      console.log('Recommendations are disabled for this user');
      return;
    }
    
    // Get existing connections
    const connectionsSnapshot = await db.collection('connections')
      .where('userId', '==', userId)
      .get();
    
    const existingConnectionIds = new Set();
    
    connectionsSnapshot.forEach(doc => {
      const connection = doc.data();
      existingConnectionIds.add(connection.connectionId);
    });
    
    // Also check connections where user is the connectionId
    const reverseConnectionsSnapshot = await db.collection('connections')
      .where('connectionId', '==', userId)
      .get();
    
    reverseConnectionsSnapshot.forEach(doc => {
      const connection = doc.data();
      existingConnectionIds.add(connection.userId);
    });
    
    console.log(`Found ${existingConnectionIds.size} existing connections`);
    
    // Get suggestions from userSuggestions collection
    const suggestionsSnapshot = await db.collection('userSuggestions')
      .where('userId', '==', userId)
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    
    if (suggestionsSnapshot.empty) {
      console.log('No pre-computed suggestions found');
      
      // Test fallback to generating suggestions on-the-fly
      console.log('Testing fallback suggestion generation...');
      
      // Get all users
      const usersSnapshot = await db.collection('users')
        .limit(20)
        .get();
      
      const users = [];
      usersSnapshot.forEach(doc => {
        if (doc.id !== userId && !existingConnectionIds.has(doc.id)) {
          users.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      console.log(`Found ${users.length} potential users for suggestions`);
      
      // Generate suggestions
      const suggestions = [];
      
      for (const potentialMatch of users) {
        // Calculate match score
        const matchScore = calculateMatchScore(userDoc.data(), potentialMatch);
        
        // Get mutual connections
        const mutualConnectionCount = await getMutualConnectionCount(userId, potentialMatch.id);
        
        suggestions.push({
          userId: userId,
          suggestedUserId: potentialMatch.id,
          name: potentialMatch.name || potentialMatch.displayName || 'Unknown',
          score: matchScore.score,
          reason: matchScore.reasons[0] || 'Suggested for you',
          mutualConnectionCount: mutualConnectionCount
        });
      }
      
      // Sort by score
      suggestions.sort((a, b) => b.score - a.score);
      
      console.log('Generated suggestions:');
      suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.name} (Score: ${suggestion.score.toFixed(2)}, Reason: ${suggestion.reason})`);
      });
    } else {
      console.log(`Found ${suggestionsSnapshot.size} pre-computed suggestions`);
      
      // Process suggestions
      const suggestions = [];
      
      for (const doc of suggestionsSnapshot.docs) {
        const suggestion = doc.data();
        
        // Skip if already connected
        if (existingConnectionIds.has(suggestion.suggestedUserId)) {
          console.log(`Skipping suggestion for ${suggestion.suggestedUserId} (already connected)`);
          continue;
        }
        
        // Get user details
        const suggestedUserDoc = await db.collection('users').doc(suggestion.suggestedUserId).get();
        
        if (!suggestedUserDoc.exists) {
          console.log(`Suggested user ${suggestion.suggestedUserId} not found, skipping`);
          continue;
        }
        
        const suggestedUser = suggestedUserDoc.data();
        
        // Check privacy settings
        const suggestedUserPrivacyDoc = await db.collection('privacySettings').doc(suggestion.suggestedUserId).get();
        let canBeRecommended = true;
        
        if (suggestedUserPrivacyDoc.exists) {
          const suggestedUserPrivacy = suggestedUserPrivacyDoc.data();
          
          if (suggestedUserPrivacy.profileVisibility === 'private') {
            console.log(`Skipping suggestion for ${suggestedUser.name || 'Unknown'} (private profile)`);
            canBeRecommended = false;
          }
        }
        
        if (!canBeRecommended) continue;
        
        suggestions.push({
          id: doc.id,
          userId: suggestion.userId,
          suggestedUserId: suggestion.suggestedUserId,
          name: suggestedUser.name || suggestedUser.displayName || 'Unknown',
          score: suggestion.score,
          reason: suggestion.reason || 'Suggested for you',
          mutualConnectionCount: suggestion.mutualConnectionCount || 0
        });
      }
      
      console.log('Processed suggestions:');
      suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.name} (Score: ${suggestion.score.toFixed(2)}, Reason: ${suggestion.reason})`);
      });
    }
  } catch (error) {
    console.error('Error testing suggestions:', error);
  }
}

/**
 * Calculate match score between two users
 * @param {Object} user Current user
 * @param {Object} potentialMatch Potential match
 * @returns {Object} Object with score and reasons
 */
function calculateMatchScore(user, potentialMatch) {
  let score = 0;
  const reasons = [];
  
  // Match on interests
  const userInterests = user.interests || [];
  const potentialInterests = potentialMatch.interests || [];
  
  const commonInterests = userInterests.filter(interest => 
    potentialInterests.includes(interest)
  );
  
  if (commonInterests.length > 0) {
    score += commonInterests.length * 0.1;
    reasons.push(`${commonInterests.length} shared interests`);
  }
  
  // Match on location
  if (user.location && potentialMatch.location && user.location === potentialMatch.location) {
    score += 0.15;
    reasons.push(`Same location: ${user.location}`);
  }
  
  // Match on industry
  if (user.industry && potentialMatch.industry && user.industry === potentialMatch.industry) {
    score += 0.2;
    reasons.push(`Same industry: ${user.industry}`);
  }
  
  // If no specific matches, add a generic reason
  if (reasons.length === 0) {
    reasons.push('Based on your profile');
    // Add a small base score
    score += 0.1;
  }
  
  // Cap score at 1.0
  score = Math.min(score, 1.0);
  
  return { score, reasons };
}

/**
 * Get mutual connection count between two users
 * @param {string} userId1 First user ID
 * @param {string} userId2 Second user ID
 * @returns {Promise<number>} Number of mutual connections
 */
async function getMutualConnectionCount(userId1, userId2) {
  try {
    // Get connections for first user
    const connections1Snapshot = await db.collection('connections')
      .where('userId', '==', userId1)
      .where('status', '==', 'accepted')
      .get();
    
    const connections1 = new Set();
    
    connections1Snapshot.forEach(doc => {
      const connection = doc.data();
      connections1.add(connection.connectionId);
    });
    
    // Get connections for second user
    const connections2Snapshot = await db.collection('connections')
      .where('userId', '==', userId2)
      .where('status', '==', 'accepted')
      .get();
    
    const connections2 = new Set();
    
    connections2Snapshot.forEach(doc => {
      const connection = doc.data();
      connections2.add(connection.connectionId);
    });
    
    // Count mutual connections
    let mutualCount = 0;
    
    for (const connectionId of connections1) {
      if (connections2.has(connectionId)) {
        mutualCount++;
      }
    }
    
    return mutualCount;
  } catch (error) {
    console.error('Error getting mutual connections:', error);
    return 0;
  }
}

// Run the test
testSuggestions(userId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });