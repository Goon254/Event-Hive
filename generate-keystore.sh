#!/bin/bash

echo "==================================================="
echo "Android Debug Keystore Generator and SHA-1 Extractor"
echo "==================================================="
echo

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed or not in PATH"
    echo "Please install Java and try again"
    exit 1
fi

# Check if keytool is installed
if ! command -v keytool &> /dev/null; then
    echo "Error: keytool is not installed or not in PATH"
    echo "Please install Java JDK and try again"
    exit 1
fi

# Create .android directory if it doesn't exist
echo "Creating .android directory if it doesn't exist..."
mkdir -p ~/.android

# Check if debug.keystore already exists
if [ -f ~/.android/debug.keystore ]; then
    echo "Debug keystore already exists at: ~/.android/debug.keystore"
    read -p "Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Using existing keystore."
    else
        # Generate the debug keystore
        echo "Generating new debug keystore..."
        keytool -genkey -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
        if [ $? -ne 0 ]; then
            echo "Failed to generate keystore."
            echo
            echo "This might be due to:"
            echo "1. Permission issues"
            echo "2. Keytool errors"
            echo
            exit 1
        fi
    fi
else
    # Generate the debug keystore
    echo "Generating debug keystore..."
    keytool -genkey -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    if [ $? -ne 0 ]; then
        echo "Failed to generate keystore."
        echo
        echo "This might be due to:"
        echo "1. Permission issues"
        echo "2. Keytool errors"
        echo
        
        # Try alternative location
        echo "Trying alternative location..."
        mkdir -p ~/Android-Keys
        keytool -genkey -v -keystore ~/Android-Keys/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
        if [ $? -ne 0 ]; then
            echo "Failed to generate keystore in alternative location."
            exit 1
        else
            echo "Debug keystore generated successfully at: ~/Android-Keys/debug.keystore"
            echo "You'll need to specify this path when building your app."
            KEYSTORE_PATH=~/Android-Keys/debug.keystore
        fi
    else
        KEYSTORE_PATH=~/.android/debug.keystore
    fi
fi

# Default keystore path if not set above
KEYSTORE_PATH=${KEYSTORE_PATH:-~/.android/debug.keystore}

echo
echo "Debug keystore location: $KEYSTORE_PATH"
echo

# Extract SHA-1 fingerprint
echo "Extracting SHA-1 fingerprint..."
echo
keytool -list -v -keystore "$KEYSTORE_PATH" -alias androiddebugkey -storepass android -keypass android
if [ $? -ne 0 ]; then
    echo "Failed to extract SHA-1 fingerprint."
    exit 1
fi

echo
echo "==================================================="
echo "IMPORTANT: Use the SHA-1 fingerprint shown above in your Google Cloud Console."
echo
echo "For your app.config.js, update the following:"
echo
echo "googleClientIdAndroid: \"YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com\""
echo
echo "When using this keystore for signing, use:"
echo
echo "keytool -list -v -keystore \"$KEYSTORE_PATH\" -alias androiddebugkey -storepass android -keypass android"
echo "==================================================="
echo

# For Expo users
echo "If you're using Expo, you can also get your app hashes using:"
echo "expo fetch:android:hashes"
echo "Note: You need to have eas-cli installed and be logged in to your Expo account."
echo

# Make the script executable
chmod +x "$0"

echo "Press Enter to exit..."
read