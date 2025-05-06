/**
 * Script to generate and populate the userSuggestions collection in Firebase
 * 
 * This script:
 * 1. Fetches all users from the users collection
 * 2. For each user, generates suggestions based on various criteria
 * 3. Stores the suggestions in the userSuggestions collection
 * 
 * Run with: node scripts/generateSuggestions.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Constants
const BATCH_SIZE = 500; // Number of users to process in each batch
const MAX_SUGGESTIONS_PER_USER = 50; // Maximum number of suggestions to generate per user

/**
 * Main function to generate suggestions
 */
async function generateSuggestions() {
  try {
    console.log('Starting suggestion generation process...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${users.length} users`);
    
    // Process users in batches to avoid memory issues
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} users)`);
      
      // Process each user in the batch
      for (const user of batch) {
        await generateSuggestionsForUser(user, users);
      }
      
      console.log(`Completed batch ${i / BATCH_SIZE + 1}`);
    }
    
    console.log('Suggestion generation process completed successfully');
  } catch (error) {
    console.error('Error generating suggestions:', error);
  }
}

/**
 * Generate suggestions for a specific user
 * @param {Object} user User to generate suggestions for
 * @param {Array} allUsers All users in the system
 */
async function generateSuggestionsForUser(user, allUsers) {
  try {
    console.log(`Generating suggestions for user ${user.id} (${user.name || 'Unknown'})`);
    
    // Get existing connections for this user
    const connectionsSnapshot = await db.collection('connections')
      .where('userId', '==', user.id)
      .get();
    
    const existingConnectionIds = new Set();
    
    connectionsSnapshot.forEach(doc => {
      const connection = doc.data();
      existingConnectionIds.add(connection.connectionId);
    });
    
    // Also check connections where user is the connectionId
    const reverseConnectionsSnapshot = await db.collection('connections')
      .where('connectionId', '==', user.id)
      .get();
    
    reverseConnectionsSnapshot.forEach(doc => {
      const connection = doc.data();
      existingConnectionIds.add(connection.userId);
    });
    
    console.log(`Found ${existingConnectionIds.size} existing connections`);
    
    // Generate suggestions
    const suggestions = [];
    
    for (const potentialMatch of allUsers) {
      // Skip self
      if (potentialMatch.id === user.id) continue;
      
      // Skip existing connections
      if (existingConnectionIds.has(potentialMatch.id)) continue;
      
      // Calculate match score
      const matchScore = calculateMatchScore(user, potentialMatch);
      
      // Only include if score is above threshold
      if (matchScore.score > 0.2) {
        suggestions.push({
          userId: user.id,
          suggestedUserId: potentialMatch.id,
          score: matchScore.score,
          reason: matchScore.reasons[0] || 'Suggested for you',
          mutualConnectionCount: await getMutualConnectionCount(user.id, potentialMatch.id),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Limit number of suggestions
      if (suggestions.length >= MAX_SUGGESTIONS_PER_USER) break;
    }
    
    // Sort suggestions by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);
    
    // Store suggestions in Firestore
    const batch = db.batch();
    
    // Delete existing suggestions for this user
    const existingSuggestionsSnapshot = await db.collection('userSuggestions')
      .where('userId', '==', user.id)
      .get();
    
    existingSuggestionsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new suggestions
    for (const suggestion of suggestions) {
      const suggestionRef = db.collection('userSuggestions').doc();
      batch.set(suggestionRef, suggestion);
    }
    
    await batch.commit();
    
    console.log(`Stored ${suggestions.length} suggestions for user ${user.id}`);
  } catch (error) {
    console.error(`Error generating suggestions for user ${user.id}:`, error);
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
  
  // Match on user type
  if (user.userType && potentialMatch.userType && user.userType === potentialMatch.userType) {
    score += 0.05;
    reasons.push(`Both ${user.userType}s`);
  }
  
  // Match on event attendance
  // This would require additional queries to check events both users have attended
  // For simplicity, we'll skip this for now
  
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

// Run the script
generateSuggestions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });