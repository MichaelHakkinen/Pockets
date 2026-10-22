import { useEffect, useState } from 'react';
import { LogOut, LogIn } from 'lucide-react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { sounds, triggerHaptic } from '../utils/audio';

export default function GoogleAccountCard() {
  // undefined = still restoring the session, null = signed out
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState('');

  // Fires on launch (restores a persisted session) and on every sign-in/out
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignIn = async () => {
    sounds.playTap();
    triggerHaptic('light');
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      sounds.playSuccess();
      triggerHaptic('success');
    } catch (popupError) {
      let e = popupError;
      // Installed PWAs / some mobile browsers block popups: use a full-page redirect instead.
      // onAuthStateChanged picks the session up when the page comes back.
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          e = redirectError;
        }
      }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      console.error('Google sign-in failed:', e);
      setError(
        e.code === 'auth/network-request-failed'
          ? 'Google sign-in needs an internet connection.'
          : 'Sign-in failed. Please try again.'
      );
    }
  };

  const handleSignOut = async () => {
    sounds.playTap();
    triggerHaptic('light');
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign-out failed:', e);
    }
  };

  return (
    <div className="settings-section glass-panel">
      <h4 className="settings-heading">Google Account</h4>

      {user ? (
        <div className="settings-curr-banner">
          <div className="curr-banner-left">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                style={{ borderRadius: '50%' }}
              />
            )}
            <div>
              <div className="curr-banner-title"><strong>{user.displayName || user.email}</strong></div>
              <div className="curr-banner-sample">{user.email}</div>
            </div>
          </div>
          <button className="btn-open-all-currencies" onClick={handleSignOut}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      ) : user === null ? (
        <button className="btn-open-all-currencies" onClick={handleSignIn}>
          <LogIn size={14} />
          <span>Sign in with Google</span>
        </button>
      ) : null}
      {error && <p className="toggle-sub" style={{ marginTop: 8 }}>{error}</p>}
      <p className="toggle-sub" style={{ marginTop: 8 }}>
        Signed in: your pockets sync to your account across devices. Signed out: they stay on this device.
      </p>
    </div>
  );
}
