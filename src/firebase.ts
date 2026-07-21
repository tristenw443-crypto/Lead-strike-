import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log("Firebase initialized with DB ID:", firestoreDbId);

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firestoreDbId);
export const auth = getAuth();
