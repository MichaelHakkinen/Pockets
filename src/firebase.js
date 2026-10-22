import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Firebase web config is public (not a secret); access is enforced by
// Firebase Auth + Security Rules, so it is safe to commit.
const firebaseConfig = {
  apiKey: 'AIzaSyCwaB8l-OO2p_xEzHfYTssRZaCuohZEozE',
  authDomain: 'pockets-e1f0b.firebaseapp.com',
  projectId: 'pockets-e1f0b',
  storageBucket: 'pockets-e1f0b.firebasestorage.app',
  messagingSenderId: '1056303106595',
  appId: '1:1056303106595:web:d757c4845db17beb81ff96',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Offline-first: reads/writes hit the local cache and sync when back online,
// shared across open tabs.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
