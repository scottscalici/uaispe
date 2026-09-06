import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Add Central Calendar App Initialization
const centralConfig = {
  apiKey: import.meta.env.VITE_CENTRAL_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_CENTRAL_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_CENTRAL_FIREBASE_PROJECT_ID,
};

// Initialize as a secondary app by giving it a specific name ('CentralApp')
const centralApp = initializeApp(centralConfig, 'CentralApp');

// Export the central database instance
export const centralDb = getFirestore(centralApp);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
