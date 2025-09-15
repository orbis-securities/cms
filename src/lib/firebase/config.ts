import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase app and services initialization
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

// Initialize Firebase only in browser environment or development
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
    // 더미 객체들을 생성해서 타입 오류 방지
    app = {} as FirebaseApp;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
  }
} else {
  // 서버 사이드에서는 더미 객체 생성
  console.log('🏗️ 서버 환경 감지, Firebase 초기화 스킵');
  app = {} as FirebaseApp;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

export { db, storage };
export default app;