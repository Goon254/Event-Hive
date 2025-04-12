# Authentication Implementation Guide

This document provides a comprehensive overview of the authentication implementation in the ScanGo application, including Google Sign-In, error handling, profile image upload, phone number validation, geolocation services, and privacy policy/terms of service integration.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Google Sign-In Implementation](#google-sign-in-implementation)
4. [Error Handling](#error-handling)
5. [Profile Image Upload](#profile-image-upload)
6. [Phone Number Validation](#phone-number-validation)
7. [Geolocation Services](#geolocation-services)
8. [Privacy Policy and Terms of Service](#privacy-policy-and-terms-of-service)
9. [File Structure](#file-structure)
10. [Setup Instructions](#setup-instructions)
11. [Troubleshooting](#troubleshooting)

## Overview

The authentication system in ScanGo provides a secure, user-friendly way for users to sign up, sign in, and manage their accounts. It supports both email/password authentication and Google Sign-In, with proper error handling, account linking capabilities, and compliance with privacy regulations.

## Authentication Flow

### Email/Password Authentication Flow

1. User enters email and password
2. Client-side validation is performed
3. Firebase Authentication is used to authenticate the user
4. User profile is created/retrieved from Firestore
5. User is redirected to the main app

### Google Sign-In Authentication Flow

1. User clicks the "Sign in with Google" button
2. OAuth 2.0 flow is initiated with PKCE for enhanced security
3. User selects their Google account
4. Firebase Authentication is used to authenticate the user with Google credentials
5. User profile is created/retrieved from Firestore
6. User is redirected to the main app

## Google Sign-In Implementation

The Google Sign-In implementation follows Google's OAuth 2.0 policy for keeping apps secure. It includes:

- PKCE (Proof Key for Code Exchange) for enhanced security
- State parameter validation to prevent CSRF attacks
- Secure token storage
- Proper error handling
- Clear user consent for data access

Key files:
- `app/utils/googleAuth.ts`: Main Google authentication utility
- `app/utils/googleOAuthCompliance.ts`: Compliance utilities for Google OAuth
- `app.config.js`: Configuration for Google OAuth client IDs
- `GOOGLE_OAUTH_SETUP.md`: Detailed setup instructions

## Error Handling

The authentication system includes comprehensive error handling for:

- Invalid credentials
- Network issues
- Account existence checks
- Password strength validation
- Email format validation
- Phone number validation
- OAuth-specific errors

Error messages are user-friendly and provide clear guidance on how to resolve issues.

## Profile Image Upload

The profile image upload functionality includes:

- Image selection from device gallery
- Image validation (size, format)
- Image compression
- Secure upload to Firebase Storage
- Progress tracking
- Error handling

Key files:
- `app/utils/fileUtils.ts`: Utilities for file handling
- `app/(auth)/register.tsx`: Profile image upload UI

## Phone Number Validation

Phone number validation ensures that:

- Phone numbers are in a valid format
- Phone numbers are properly formatted for storage
- International phone numbers are supported
- Phone numbers are optional but validated if provided

Key files:
- `app/utils/validation.ts`: Validation utilities including phone number validation

## Geolocation Services

Geolocation services are implemented with:

- User permission requests
- Privacy-compliant location detection
- City and country detection
- Error handling for location services

Key files:
- `app/utils/geolocationUtils.ts`: Geolocation utilities

## Privacy Policy and Terms of Service

The app includes:

- Comprehensive privacy policy
- Detailed terms of service
- Proper consent mechanisms
- Clear explanations of data usage

Key files:
- `app/components/PrivacyPolicy.tsx`: Privacy policy component
- `app/components/TermsOfService.tsx`: Terms of service component
- `app/components/PrivacyTermsModal.tsx`: Modal for displaying privacy policy and terms

## File Structure

```
app/
├── (auth)/
│   ├── login.tsx             # Login screen
│   ├── register.tsx          # Registration screen
│   └── reset-password.tsx    # Password reset screen
├── components/
│   ├── PrivacyPolicy.tsx     # Privacy policy component
│   ├── PrivacyTermsModal.tsx # Modal for privacy/terms
│   └── TermsOfService.tsx    # Terms of service component
├── utils/
│   ├── fileUtils.ts          # File handling utilities
│   ├── geolocationUtils.ts   # Geolocation utilities
│   ├── googleAuth.ts         # Google authentication
│   ├── googleOAuthCompliance.ts # OAuth compliance
│   └── validation.ts         # Validation utilities
├── AuthContext.tsx           # Authentication context
└── index.tsx                 # Landing page
```

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password and Google Sign-In)
3. Create a Firestore database
4. Create a Storage bucket
5. Add your app to the Firebase project
6. Copy the Firebase configuration to `lib/firebaseConfig.tsx`

### 2. Google OAuth Setup

Follow the instructions in `GOOGLE_OAUTH_SETUP.md` to:

1. Create a Google Cloud Project
2. Configure the OAuth consent screen
3. Create OAuth 2.0 client IDs for each platform
4. Update `app.config.js` with your client IDs

### 3. Environment Configuration

Update `app.config.js` with:

- Google OAuth client IDs
- Google Maps API key
- OAuth redirect URIs
- Privacy policy and terms of service URLs

## Troubleshooting

### Common Issues

1. **"Error 400: invalid_request"**
   - Check that your redirect URIs are correctly configured
   - Verify that your client IDs are correct
   - Ensure your app is using HTTPS for web redirects
   - Make sure you've added the correct SHA-1 fingerprint for Android

2. **"Keystore file does not exist" error when generating SHA-1**
   - Follow the instructions in `GOOGLE_OAUTH_SETUP.md` to create a debug.keystore file
   - For production apps, use your release keystore instead
   - For Expo managed projects, use `expo fetch:android:hashes` command

3. **"Access denied" or permission errors on Windows**
   - Run Command Prompt or PowerShell as Administrator
   - Create the keystore in a different location where you have write permissions
   - Make sure you're using the correct path with proper escaping of backslashes

4. **Profile image upload fails**
   - Check Firebase Storage rules
   - Verify that the app has permission to access the device's photo library
   - Check network connectivity

5. **Geolocation not working**
   - Ensure location permissions are granted
   - Check if location services are enabled on the device
   - Verify Google Maps API key is valid

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for Expo](https://docs.expo.dev/guides/authentication/#google)
- [OAuth 2.0 for Mobile Applications Best Practices](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce)
- [Expo Image Picker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)