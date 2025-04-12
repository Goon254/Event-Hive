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
      googleClientIdAndroid: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdIos: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdWeb: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
      googleClientIdExpo: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
      // Google Maps API Key - Replace with your actual API key
      googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY",
      // OAuth redirect URIs
      oauthRedirectUriIos: "com.yourcompany.scango://oauth",
      oauthRedirectUriAndroid: "com.yourcompany.scango://oauth-callback",
      oauthRedirectUriWeb: "https://your-web-domain.com/oauth-callback",
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