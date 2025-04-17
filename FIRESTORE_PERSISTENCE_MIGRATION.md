# Firestore Persistence Migration Guide

This document outlines the migration from the deprecated `enableIndexedDbPersistence` method to the current recommended approach using `FirestoreSettings.localCache` configuration for Firestore offline persistence.

## Table of Contents

1. [Overview](#overview)
2. [Implementation Changes](#implementation-changes)
3. [Migration Considerations](#migration-considerations)
4. [Complete Implementation Example](#complete-implementation-example)
5. [Multi-Tab Support](#multi-tab-support)
6. [Troubleshooting](#troubleshooting)

## Overview

Firebase has deprecated the `enableIndexedDbPersistence(db)` method in favor of a more flexible and robust configuration approach using `FirestoreSettings.localCache`. This new approach:

- Configures persistence at Firestore initialization time rather than after initialization
- Provides better control over cache size and behavior
- Offers improved error handling and reliability
- Supports multiple tabs more effectively (with the right configuration)

## Implementation Changes

### Before (Deprecated Approach)

```typescript
// Initialize Firestore
const db = getFirestore(app);

// Enable persistence after initialization (deprecated)
try {
  enableIndexedDbPersistence(db)
    .then(() => console.log('Offline persistence enabled'))
    .catch(error => {
      if (error.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (error.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      } else {
        console.error('Error enabling offline persistence:', error);
      }
    });
} catch (error) {
  console.error('Error initializing persistence:', error);
}
```

### After (Current Recommended Approach)

```typescript
import { 
  initializeFirestore, 
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";

// Initialize Firestore with persistence configuration
const db = initializeFirestore(app, {
  // Configure persistent local cache
  localCache: persistentLocalCache({
    // Set cache size to unlimited for better offline experience
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});
```

## Migration Considerations

### Breaking Changes

1. **Initialization Timing**: Persistence must now be configured at initialization time, not after. This means you need to use `initializeFirestore` instead of `getFirestore`.

2. **Error Handling**: The new approach doesn't use promises for enabling persistence. Errors related to persistence will be thrown during initialization, so you should wrap the initialization in a try-catch block.

3. **Multiple Tabs**: The default `persistentLocalCache` only supports a single tab. For multi-tab support, you would need to use a different configuration (see Multi-Tab Support section).

### Data Migration

Existing data stored in IndexedDB should be automatically migrated when switching to the new approach. However, it's recommended to:

1. Test the migration thoroughly in a development environment
2. Consider adding code to clear persistence if issues arise:

```typescript
import { clearIndexedDbPersistence } from "firebase/firestore";

// Only use this if you encounter persistence issues after migration
async function clearPersistenceIfNeeded(db) {
  try {
    await clearIndexedDbPersistence(db);
    console.log("Persistence cleared successfully");
  } catch (error) {
    console.error("Error clearing persistence:", error);
  }
}
```

## Complete Implementation Example

Here's a complete example showing how to properly configure Firestore with persistent local caching:

```typescript
// firebaseConfig.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import NetInfo from '@react-native-community/netinfo';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase with proper error handling
let app: FirebaseApp;
let db: Firestore;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  
  // Initialize Firestore with persistent cache configuration
  db = initializeFirestore(app, {
    // Use persistentLocalCache for offline support
    localCache: persistentLocalCache({
      // Set cache size to unlimited for better offline experience
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
  
  console.log("Firebase initialized successfully with persistence enabled");
  
  // Monitor network status and adjust Firestore network state
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      enableNetwork(db)
        .then(() => console.log('Firestore online mode enabled'))
        .catch(error => console.error('Error enabling online mode:', error));
    } else {
      disableNetwork(db)
        .then(() => console.log('Firestore offline mode enabled'))
        .catch(error => console.error('Error enabling offline mode:', error));
    }
  });
  
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Initialize with default values to prevent runtime errors
  app = {} as FirebaseApp;
  db = {} as Firestore;
}

export { db };
export default app;
```

## Multi-Tab Support

For applications that need to support multiple browser tabs accessing Firestore simultaneously, you need to use a different configuration. As of the latest Firebase JS SDK, you can use `memoryLocalCache` for multi-tab scenarios, but this doesn't provide offline persistence.

For true multi-tab persistence support, you would need to implement a custom solution or use Firebase's recommended patterns for multi-tab applications:

1. Use a service worker to coordinate between tabs
2. Use a single "master" tab for Firestore operations
3. Use browser storage events to communicate between tabs

## Troubleshooting

### Common Issues

1. **Persistence Not Working**: Ensure you're using `initializeFirestore` with the correct cache configuration.

2. **Multiple Tab Errors**: If you're seeing errors related to multiple tabs, ensure you're using the appropriate cache configuration for your use case.

3. **Data Not Persisting**: Check that `cacheSizeBytes` is set appropriately. Using `CACHE_SIZE_UNLIMITED` ensures maximum offline capability.

4. **Initialization Errors**: If you encounter errors during initialization, check that your browser supports IndexedDB and that it's not being blocked by privacy settings.

### Debugging

To debug persistence issues, you can:

1. Check the browser's IndexedDB storage in DevTools
2. Enable verbose Firestore logging:

```typescript
import { setLogLevel } from "firebase/firestore";
setLogLevel("debug"); // Options: debug, error, silent
```

---

For more information, refer to the [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore/manage-data/enable-offline).