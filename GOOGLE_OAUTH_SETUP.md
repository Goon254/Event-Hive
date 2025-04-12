# Google OAuth 2.0 Setup Guide

This guide explains how to properly configure Google OAuth 2.0 for ScanGo to ensure compliance with Google's OAuth 2.0 policy for keeping apps secure.

## Prerequisites

- Google Cloud Platform account
- Access to the Google Cloud Console
- Your app's package name/bundle identifier

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click on "New Project"
4. Enter a project name (e.g., "ScanGo")
5. Click "Create"

## Step 2: Configure the OAuth Consent Screen

1. In your Google Cloud Project, navigate to "APIs & Services" > "OAuth consent screen"
2. Select the appropriate user type (External or Internal)
3. Fill in the required information:
   - App name: "ScanGo"
   - User support email: Your support email
   - Developer contact information: Your contact email
4. Click "Save and Continue"
5. Add the following scopes:
   - `openid`
   - `profile`
   - `email`
6. Click "Save and Continue"
7. Add test users if needed (for External user type)
8. Click "Save and Continue"
9. Review your settings and click "Back to Dashboard"

## Step 3: Create OAuth 2.0 Client IDs

### For Android

1. In your Google Cloud Project, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Android" as the application type
4. Enter a name (e.g., "ScanGo Android Client")
5. Enter your app's package name (e.g., "com.yourcompany.scango")
6. Generate a SHA-1 certificate fingerprint:

   **For Windows:**
   ```bash
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```

   **For macOS/Linux:**
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   **If the debug.keystore file doesn't exist**, you need to create it first:
   
   **For Windows:**
   
   If you encounter permission issues with the default location, you can create the keystore in a different location:
   
   ```bash
   # Create a directory in a location where you have write permissions
   mkdir C:\Android-Keys

   # Generate the keystore in that location
   keytool -genkey -v -keystore C:\Android-Keys\debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
   
   # Then use this location when listing the SHA-1
   keytool -list -v -keystore C:\Android-Keys\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   **For macOS/Linux:**
   ```bash
   mkdir -p ~/.android
   keytool -genkey -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
   ```

   **For Expo projects**, you can get the SHA-1 certificate fingerprint using:
   ```bash
   expo fetch:android:hashes
   ```
   Note: You need to have `eas-cli` installed and be logged in to your Expo account.
7. Enter the SHA-1 certificate fingerprint
8. Click "Create"
9. Copy the generated client ID and save it for later

### For iOS

1. In your Google Cloud Project, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "iOS" as the application type
4. Enter a name (e.g., "ScanGo iOS Client")
5. Enter your app's bundle identifier (e.g., "com.yourcompany.scango")
6. Click "Create"
7. Copy the generated client ID and save it for later

### For Web

1. In your Google Cloud Project, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "ScanGo Web Client")
5. Add authorized JavaScript origins:
   - For development: `http://localhost:19006`
   - For production: Your web domain (e.g., `https://scango.yourcompany.com`)
6. Add authorized redirect URIs:
   - For development: `http://localhost:19006/oauth-callback`
   - For production: Your web domain redirect URI (e.g., `https://scango.yourcompany.com/oauth-callback`)
7. Click "Create"
8. Copy the generated client ID and save it for later

### For Expo Go (Development)

1. In your Google Cloud Project, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "ScanGo Expo Client")
5. Add authorized JavaScript origins:
   - `https://auth.expo.io`
6. Add authorized redirect URIs:
   - `https://auth.expo.io/@your-expo-username/scango`
7. Click "Create"
8. Copy the generated client ID and save it for later

## Step 4: Update App Configuration

1. Open the `app.config.js` file in your project
2. Update the Google OAuth client IDs with the ones you generated:

```javascript
// app.config.js
module.exports = {
  expo: {
    // ... other config
    extra: {
      googleClientIdAndroid: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdIos: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdWeb: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdExpo: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
      // ... other config
    }
  }
};
```

## Step 5: Configure Redirect URIs

Ensure your app's redirect URIs match what you configured in the Google Cloud Console:

### For Android

In your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "scango",
    "android": {
      "package": "com.yourcompany.scango"
    }
  }
}
```

### For iOS

In your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "scango",
    "ios": {
      "bundleIdentifier": "com.yourcompany.scango"
    }
  }
}
```

## Step 6: Implement Privacy Policy and Terms of Service

To comply with Google's OAuth 2.0 policy, you must have a privacy policy and terms of service that:

1. Clearly disclose how your app collects, uses, and shares user data
2. Explain how users can revoke access to their data
3. Include links to Google's Privacy Policy

Add these URLs to your `app.config.js`:

```javascript
// app.config.js
module.exports = {
  expo: {
    // ... other config
    extra: {
      // ... other config
      privacyPolicyUrl: "https://www.yourcompany.com/privacy",
      termsOfServiceUrl: "https://www.yourcompany.com/terms",
    }
  }
};
```

## Step 7: Implement Proper OAuth Flow

Our app already implements the proper OAuth flow with:

1. PKCE (Proof Key for Code Exchange) for enhanced security
2. State parameter to prevent CSRF attacks
3. Secure token storage
4. Proper error handling
5. Clear user consent for data access

## Step 8: Test Your Implementation

1. Run your app in development mode
2. Test the Google Sign-In functionality
3. Verify that the authentication flow works correctly
4. Check for any error messages or warnings

## Troubleshooting

### Common Issues

1. **"Error 400: invalid_request"**
   - Check that your redirect URIs are correctly configured
   - Verify that your client IDs are correct
   - Ensure your app is using HTTPS for web redirects
   - Make sure you've added the correct SHA-1 fingerprint for Android

2. **"Keystore file does not exist" error when generating SHA-1**
   - Follow the instructions above to create a debug.keystore file
   - For production apps, use your release keystore instead
   - For Expo managed projects, use `expo fetch:android:hashes` command

2. **"Error 401: unauthorized_client"**
   - Verify that your client IDs are correct
   - Check that your app is properly registered in the Google Cloud Console

3. **"Error 403: access_denied"**
   - The user denied access to your app
   - Review your OAuth consent screen to make it more user-friendly

4. **"Error: redirect_uri_mismatch"**
   - The redirect URI in your app doesn't match the one configured in the Google Cloud Console
   - Update your redirect URI configuration

5. **"Access denied" or permission errors on Windows**
   - Run Command Prompt or PowerShell as Administrator
   - Create the keystore in a different location where you have write permissions (like C:\Android-Keys)
   - Make sure you're using the correct path with proper escaping of backslashes
   - If using PowerShell, you might need to use different escaping: `keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore"`
   - For the mkdir command, try creating directories in a location where you have permissions

## Additional Resources

- [Google OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Sign-In for Expo](https://docs.expo.dev/guides/authentication/#google)
- [OAuth 2.0 for Mobile Applications Best Practices](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce)