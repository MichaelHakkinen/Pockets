import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function savePwaPreferences(userId, theme, notes) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    theme,
    notes,
    lastUpdated: serverTimestamp(),
  }, { merge: true });
}

export async function loadPwaPreferences(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}
