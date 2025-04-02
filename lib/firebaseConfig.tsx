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
  apiKey: "AIzaSyD0tQSu3VwqjLRdE1QW1L4y-2Q-VkHAh68",
  authDomain: "scanngo-c3bf7.firebaseapp.com",
  projectId: "scanngo-c3bf7",
  storageBucket: "scanngo-c3bf7.appspot.com",
  messagingSenderId: "936316225705",
  appId: "1:936316225705:web:ca7c6cab343d735e43c1b8",
  measurementId: "G-SN3STFQ2ZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;