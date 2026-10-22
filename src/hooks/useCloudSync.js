import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
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

// --- Sync status, readable from any component via useSyncStatus() ---
// 'off' (signed out) | 'connecting' | 'saving' | 'synced' | 'error'
let status = 'off';
const listeners = new Set();
function setStatus(next) {
  if (next === status) return;
  status = next;
  listeners.forEach(l => l());
}
function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}
const getStatus = () => (status !== 'off' && !navigator.onLine ? 'offline' : status);

export function useSyncStatus() {
  return useSyncExternalStore(subscribe, getStatus);
}

// Removes the signed-in user's cloud copy. Needs a connection: offline, Firestore would
// only queue the delete and report success while the data is still in the cloud.
export async function deleteCloudData() {
  const user = auth.currentUser;
  if (!user) return;
  if (!navigator.onLine) throw new Error('offline');
  await deleteDoc(doc(db, 'users', user.uid));
}

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
      setStatus('synced');
    } catch (e) {
      console.error('Cloud save failed:', e);
      setStatus('error');
    }
  }, []);

  // Local edits -> cloud
  useEffect(() => {
    stateRef.current = state;
    applyRef.current = applyRemote;
    if (!userRef.current || !readyRef.current) return;
    if (canon(state) !== lastSyncedRef.current) setStatus('saving');
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
      setStatus(user ? 'connecting' : 'off');
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
          setStatus('synced');
        },
        (e) => {
          console.error('Cloud sync failed:', e);
          setStatus('error');
        }
      );
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
      clearTimeout(timerRef.current);
    };
  }, [push]);
}
