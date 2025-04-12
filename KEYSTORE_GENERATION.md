# Android Keystore Generation Guide

This guide explains how to use the provided scripts to generate an Android debug keystore and obtain the SHA-1 fingerprint needed for Google Sign-In integration.

## Overview

The SHA-1 certificate fingerprint is required when setting up Google Sign-In for Android applications. This fingerprint is derived from the keystore used to sign your Android app. For development purposes, Android Studio typically uses a debug keystore located at:

- Windows: `%USERPROFILE%\.android\debug.keystore`
- macOS/Linux: `~/.android/debug.keystore`

If this file doesn't exist (which is the error you're encountering), you need to generate it.

## Using the Scripts

We've provided two scripts to help you generate the debug keystore and extract the SHA-1 fingerprint:

1. `generate-keystore.bat` - For Windows users
2. `generate-keystore.sh` - For macOS/Linux users

### For Windows Users

1. Right-click on `generate-keystore.bat` and select "Run as administrator" (recommended to avoid permission issues)
2. The script will:
   - Create a directory for the keystore (default: `C:\Android-Keys`)
   - Generate a debug keystore
   - Extract and display the SHA-1 fingerprint
   - Create a shortcut to the keystore directory on your desktop

If the script encounters permission issues, it will try alternative locations or prompt you to enter a directory path where you have write permissions.

### For macOS/Linux Users

1. Open Terminal
2. Navigate to the directory containing the script:
   ```
   cd path/to/script/directory
   ```
3. Make the script executable (if it's not already):
   ```
   chmod +x generate-keystore.sh
   ```
4. Run the script:
   ```
   ./generate-keystore.sh
   ```

The script will:
- Create the `.android` directory if it doesn't exist
- Generate a debug keystore
- Extract and display the SHA-1 fingerprint

## Troubleshooting

### Common Issues on Windows

1. **"Access denied" errors**:
   - Run the script as Administrator
   - The script will try to create the keystore in alternative locations if the default location fails

2. **"'keytool' is not recognized as an internal or external command"**:
   - Make sure Java is installed and added to your PATH
   - You can download Java from [oracle.com](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)

3. **Windows Security warnings**:
   - You might see a security warning when running the script
   - Click "More info" and then "Run anyway" if you trust the script

### Common Issues on macOS/Linux

1. **Permission denied**:
   - Make sure the script is executable: `chmod +x generate-keystore.sh`
   - If you're still having issues, try running with sudo: `sudo ./generate-keystore.sh`

2. **Command not found**:
   - Make sure Java is installed: `java -version`
   - Install Java if needed:
     - macOS: `brew install openjdk@11`
     - Ubuntu/Debian: `sudo apt install openjdk-11-jdk`
     - Fedora: `sudo dnf install java-11-openjdk`

## Using the SHA-1 Fingerprint

After running the script, you'll see output that includes the SHA-1 fingerprint. It will look something like:

```
Certificate fingerprint (SHA-1): 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

Use this fingerprint (without the colons) when configuring your Google Cloud Console project:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project
3. Go to "APIs & Services" > "Credentials"
4. Create or edit your Android OAuth client
5. Enter your app's package name and the SHA-1 fingerprint

## For Expo Users

If you're using Expo, you can also get your app hashes using:

```
expo fetch:android:hashes
```

Note: You need to have `eas-cli` installed and be logged in to your Expo account.

## Updating Your Configuration

After obtaining the SHA-1 fingerprint and creating the OAuth client in Google Cloud Console, update your `app.config.js` file with the client ID:

```javascript
// app.config.js
module.exports = {
  expo: {
    // ... other config
    extra: {
      googleClientIdAndroid: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
      // ... other config
    }
  }
};
```

## Additional Resources

- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/authentication/#google)
- [Android Keystore System](https://developer.android.com/training/articles/keystore)