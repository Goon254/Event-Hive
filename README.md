# ScanGo

ScanGo is a mobile application for event management and social networking, built with React Native and Firebase.

## Features

- User authentication and profile management
- Event creation and management
- Social posts and interactions
- Image uploads and management
- Payment processing

## Technology Stack

- **Frontend**: React Native, Expo
- **Backend**: Firebase
  - Authentication
  - Firestore Database
  - Storage
  - Cloud Functions
- **State Management**: React Context API
- **Navigation**: Expo Router

## Firebase Integration

ScanGo uses several Firebase services:

- **Authentication**: User sign-up, sign-in, and profile management
- **Firestore**: Database for storing user data, events, posts, etc.
- **Storage**: Image storage for profiles, posts, and events
- **Cloud Functions**: Backend processing for various features

For detailed information about specific integrations, see:

- [Firebase Storage Integration](./FIREBASE_STORAGE_INTEGRATION.md)
- [Firestore Implementation](./FIRESTORE_IMPLEMENTATION.md)
- [Auth Implementation](./AUTH_IMPLEMENTATION.md)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ScanGo.git
   cd ScanGo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Firebase project and configure it:
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Add a web app to your Firebase project
   - Copy the Firebase config to `lib/firebaseConfig.tsx`

4. Start the development server:
   ```
   npx expo start
   ```

## Project Structure

- `app/`: Main application code
  - `(auth)/`: Authentication screens
  - `(tabs)/`: Main tab screens
  - `components/`: Reusable components
  - `hooks/`: Custom React hooks
  - `models/`: TypeScript interfaces and types
  - `services/`: Service layer for API interactions
  - `utils/`: Utility functions
- `assets/`: Static assets like images and fonts
- `lib/`: Library configurations

## Testing

To test the Firebase Storage integration, navigate to the Image Upload Test screen:

```javascript
import { router } from 'expo-router';

// Navigate to the test screen
router.push('/screens/ImageUploadTest');
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
