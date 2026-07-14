import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

// Same Firebase project as stafy-mobile ("stafy-app") — managers and
// employees share one Auth pool; the backend verifies both via the same
// Firebase Admin SDK. Keep these in sync with stafy-mobile/src/services/firebase.ts.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)
