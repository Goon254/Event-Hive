# ScanGo

ScanGo is a mobile application for event management and social networking, built with React Native and Firebase.

## Documentation

This repository contains comprehensive documentation for the ScanGo project:

- [Technical Documentation](./ScanGo_Technical_Documentation.md) - Detailed technical overview of the project architecture, implementation details, and technical considerations
- [Project Report](./ScanGo_Project_Report.md) - Concise summary of the project focusing on business value, features, and future roadmap
- [User Guide](./ScanGo_User_Guide.md) - User-focused guide explaining how to use the application

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
