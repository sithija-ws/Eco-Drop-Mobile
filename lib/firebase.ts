import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import * as firebaseAuth from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingEnv = Object.entries(firebaseConfig).filter(([, value]) => !value);

if (missingEnv.length > 0) {
  console.warn(
    `[Firebase] Missing environment variables: ${missingEnv
      .map(([key]) => key)
      .join(", ")}. Check your .env file and restart Expo.`
  );
}

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;

try {
  /**
   * Some Firebase versions do not expose getReactNativePersistence
   * in TypeScript definitions, so we safely access it using "any".
   */
  const getReactNativePersistence = (firebaseAuth as any)
    .getReactNativePersistence;

  if (getReactNativePersistence) {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } else {
    authInstance = getAuth(app);
  }
} catch {
  // initializeAuth can only run once during fast refresh.
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);