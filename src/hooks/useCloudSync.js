import { useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sanitizeState } from '../utils/storage';

const PUSH_DELAY_MS = 800;

// JSON with sorted keys, so the same data compares equal no matter what order
// Firestore (or sanitizeState) returns the keys in.
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter(k => value[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stable(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

const canon = (state) => stable(sanitizeState(state));

// Mirrors the app state to users/{uid} while signed in. The cloud copy wins when
// signing in on a device; after that, local edits are pushed (debounced) and edits
// from other devices are applied live. Signed out, nothing leaves the device.
export function useCloudSync(state, applyRemote) {
  const stateRef = useRef(state);
  const applyRef = useRef(applyRemote);
  const userRef = useRef(null);
  const readyRef = useRef(false);
  const lastSyncedRef = useRef(null);
  const timerRef = useRef(null);

  const push = useCallback(async () => {
    const user = userRef.current;
    if (!user || !readyRef.current) return;
    const current = canon(stateRef.current);
    if (current === lastSyncedRef.current) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        state: JSON.parse(JSON.stringify(sanitizeState(stateRef.current))),
        updatedAt: serverTimestamp(),
      });
      lastSyncedRef.current = current;
    } catch (e) {
      console.error('Cloud save failed:', e);
    }
  }, []);

  // Local edits -> cloud
  useEffect(() => {
    stateRef.current = state;
    applyRef.current = applyRemote;
    if (!userRef.current || !readyRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(), PUSH_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  });

  // Cloud -> local, and start/stop with the signed-in user
  useEffect(() => {
    let unsubSnapshot = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnapshot?.();
      unsubSnapshot = null;
      clearTimeout(timerRef.current);
      userRef.current = user;
      readyRef.current = false;
      lastSyncedRef.current = null;
      if (!user) return;

      unsubSnapshot = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          // Our own not-yet-confirmed write echoing back
          if (snap.metadata.hasPendingWrites) return;

          if (!snap.exists()) {
            // A cache miss while offline doesn't mean there's no cloud copy; wait for the server
            if (snap.metadata.fromCache) return;
            readyRef.current = true;
            push();
            return;
          }

          const remote = sanitizeState(snap.data().state);
          if (!remote) {
            readyRef.current = true;
            push();
            return;
          }
          readyRef.current = true;
          const remoteCanon = stable(remote);
          lastSyncedRef.current = remoteCanon;
          if (remoteCanon !== canon(stateRef.current)) applyRef.current(remote);
        },
        (e) => console.error('Cloud sync failed:', e)
      );
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
      clearTimeout(timerRef.current);
    };
  }, [push]);
}
