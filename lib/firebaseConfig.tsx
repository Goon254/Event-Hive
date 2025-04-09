// lib/firebaseConfig.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzZkNsIRJtryo5elbn7GCmx0EOLepFHX0",
  authDomain: "event-hive-887eb.firebaseapp.com",
  projectId: "event-hive-887eb",
  storageBucket: "event-hive-887eb.firebasestorage.app",
  messagingSenderId: "559026210442",
  appId: "1:559026210442:web:436fbe7653fc1207150f73",
  measurementId: "G-36842L8XXG"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;