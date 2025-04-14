// lib/firebaseConfig.ts
// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMUu0L9RiM5Q-y0Ks5ync7GLnRws_Un1s",
  authDomain: "event-hive-992c0.firebaseapp.com",
  projectId: "event-hive-992c0",
  storageBucket: "event-hive-992c0.firebasestorage.app",
  messagingSenderId: "549671182290",
  appId: "1:549671182290:web:7eb4f50a24cccbdaaa320b",
  measurementId: "G-ERG2RHGGZH"
};

// Initialize Firebase with proper error handling
let app: FirebaseApp;
let analytics: Analytics;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize services
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  // In a production app, you might want to report this to a monitoring service
  // or display a user-friendly error message
  
  // Initialize with default values to prevent runtime errors
  app = {} as FirebaseApp;
  analytics = {} as Analytics;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Export the initialized services
export { auth, db, storage };
export default app;