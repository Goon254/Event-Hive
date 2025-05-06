# Connection Suggestions Implementation

This document outlines the implementation of the connection suggestions feature in the ScanGo application. The feature is designed to provide users with relevant connection suggestions based on their profile, mutual connections, and other factors.

## Overview

The connection suggestions feature consists of several components:

1. **Firebase Data Structure**: A dedicated `userSuggestions` collection to store pre-computed suggestions
2. **Recommendation Service**: Enhanced service to fetch and filter suggestions
3. **Privacy Controls**: User settings to control suggestion visibility
4. **UI Components**: Display of suggestions in the Connections tab

## Firebase Data Structure

### userSuggestions Collection

Each document in this collection represents a suggestion for a specific user:

```
userSuggestions/{document_id}
{
  userId: string,              // ID of the user receiving the suggestion
  suggestedUserId: string,     // ID of the suggested user
  score: number,               // Relevance score (0.0 to 1.0)
  reason: string,              // Human-readable reason for the suggestion
  mutualConnectionCount: number, // Number of mutual connections
  createdAt: timestamp         // When the suggestion was created
}
```

## Recommendation Service

The `RecommendationService` class in `app/services/recommendationService.ts` has been enhanced to:

1. Check user privacy settings before fetching suggestions
2. Query the `userSuggestions` collection for pre-computed suggestions
3. Filter out users who have set their profile to private
4. Fall back to generating suggestions on-the-fly if no pre-computed suggestions exist
5. Include mutual connections information

### Key Methods

- `getRecommendations`: Main method to fetch suggestions from Firebase
- `generateSuggestionsFromUsers`: Fallback method to generate suggestions on-the-fly
- `getMutualConnections`: Helper method to find mutual connections between users

## Privacy Controls

Users can control their suggestion visibility through privacy settings:

- `allowRecommendations`: Controls whether a user receives suggestions
- `profileVisibility`: Controls whether a user appears in others' suggestions

These settings are stored in the `privacySettings` collection in Firebase.

## Suggestion Generation Script

A script has been created to pre-compute and store suggestions for all users:

- Location: `scripts/generateSuggestions.js`
- Purpose: Generate high-quality suggestions based on various matching criteria
- Execution: Run periodically to keep suggestions fresh

### Running the Script

```bash
# Ensure you have the Firebase Admin SDK service account key
# Place it at the root of the project as serviceAccountKey.json

# Install dependencies if needed
npm install firebase-admin

# Run the script
node scripts/generateSuggestions.js
```

The script processes users in batches to avoid memory issues and can handle large user bases efficiently.

### Matching Criteria

Suggestions are generated based on several factors:

1. **Mutual Connections**: Users who share connections with the current user
2. **Shared Interests**: Users with similar interests
3. **Location**: Users in the same geographic area
4. **Industry**: Users in the same professional industry
5. **User Type**: Users of the same type (e.g., attendees, organizers)

Each factor contributes to a relevance score, which is used to rank suggestions.

## UI Implementation

The connection suggestions are displayed in the "Suggested" tab of the Connections screen. The UI shows:

- User's name and profile picture
- Mutual connections count
- Reason for the suggestion
- Action buttons to connect or dismiss

## Performance Considerations

1. **Pagination**: Suggestions are loaded in batches to improve performance
2. **Caching**: Suggestions are cached to reduce database reads
3. **Timeout Handling**: Requests have timeouts to prevent hanging
4. **Deduplication**: Duplicate suggestions are filtered out

## Privacy Implications

1. Users can opt out of receiving suggestions
2. Users can set their profile to private to not appear in suggestions
3. Only public profile information is used for generating suggestions
4. Mutual connections are only counted if both users have accepted the connection

## Future Enhancements

1. **Machine Learning**: Implement ML-based suggestion algorithms
2. **Event-Based Suggestions**: Suggest connections based on event attendance
3. **Interaction History**: Consider past interactions when ranking suggestions
4. **Real-time Updates**: Update suggestions in real-time as user networks change