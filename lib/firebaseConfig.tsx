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
  apiKey: "AIzaSyCzZkNsIRJtryo5elbn7GCmx0EOLepFHX0",
  authDomain: "event-hive-887eb.firebaseapp.com",
  projectId: "event-hive-887eb",
  storageBucket: "event-hive-887eb.appspot.com", // Fixed storage bucket URL format
  messagingSenderId: "559026210442",
  appId: "1:559026210442:web:436fbe7653fc1207150f73",
  measurementId: "G-36842L8XXG"
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