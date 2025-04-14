// app.config.js - Expo configuration
module.exports = {
  expo: {
    name: "ScanGo",
    slug: "scango",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.scango"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.scango"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow ScanGo to use your location to find nearby events."
        }
      ]
    ],
    scheme: "scango",
    // Extra configuration values
    extra: {
      // Google OAuth Client IDs - Replace these with your actual client IDs from Google Cloud Console
      googleClientIdAndroid: "497459597632-vtssep6l01js6dkmmq67m1n8e77992ad.apps.googleusercontent.com",
      googleClientIdIos: "497459597632-paclojt4v25cvnpfo8uduvf36hjfrrmr.apps.googleusercontent.com",
      googleClientIdWeb: "497459597632-sfq9jl0v6q0esclvbuk6noeehu4mi3qt.apps.googleusercontent.com",
      googleClientIdExpo: "497459597632-cshdrp5ebi25bqcglp83bo16kscgs6fa.apps.googleusercontent.com",
      // Google Maps API Key - Replace with your actual API key
      googleMapsApiKey: "AIzaSyB6WigBJ6UcGdXYKNuc7hXiG8P87ucRhzc",
      // OAuth redirect URIs
      oauthRedirectUriIos: "com.yourcompany.scango://oauth",
      oauthRedirectUriAndroid: "com.yourcompany.scango://oauth-callback",
      oauthRedirectUriWeb: "http://localhost:19006/oauth-callback",
      // Privacy policy and terms of service URLs
      privacyPolicyUrl: "https://www.yourcompany.com/privacy",
      termsOfServiceUrl: "https://www.yourcompany.com/terms",
      // Other configuration values
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  }
};