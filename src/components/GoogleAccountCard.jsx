import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

// Client IDs are public. Set VITE_GOOGLE_CLIENT_ID in .env.local for dev, and as a
// repository variable for the GitHub Pages build (see .github/workflows/deploy.yml).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const PROFILE_KEY = 'pockets_google_profile';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

function readProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return p && typeof p.name === 'string' ? p : null;
  } catch {
    return null;
  }
}

// Decodes the (unverified) ID token Google hands back. Only used to show who is
// signed in; nothing here grants access to data, and the token itself is not stored.
function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json);
}

function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
  });
}

export default function GoogleAccountCard() {
  const [profile, setProfile] = useState(readProfile);
  const [unavailable, setUnavailable] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || profile) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            try {
              const { name, email, picture } = parseJwt(response.credential);
              const next = { name: name || email, email, picture };
              localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
              setProfile(next);
              sounds.playSuccess();
              triggerHaptic('success');
            } catch (e) {
              console.error('Google sign-in failed:', e);
            }
          }
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular'
        });
      })
      // Offline or blocked: tell the user instead of showing an empty box
      .catch(() => { if (!cancelled) setUnavailable(true); });

    return () => { cancelled = true; };
  }, [profile]);

  const handleSignOut = () => {
    sounds.playTap();
    triggerHaptic('light');
    try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
    window.google?.accounts?.id?.disableAutoSelect();
    setProfile(null);
  };

  if (!CLIENT_ID) return null;

  return (
    <div className="settings-section glass-panel">
      <h4 className="settings-heading">Google Account</h4>

      {profile ? (
        <div className="settings-curr-banner">
          <div className="curr-banner-left">
            {profile.picture && (
              <img
                src={profile.picture}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                style={{ borderRadius: '50%' }}
              />
            )}
            <div>
              <div className="curr-banner-title"><strong>{profile.name}</strong></div>
              <div className="curr-banner-sample">{profile.email}</div>
            </div>
          </div>
          <button className="btn-open-all-currencies" onClick={handleSignOut}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      ) : unavailable ? (
        <p className="toggle-sub">Google sign-in needs an internet connection.</p>
      ) : (
        <div ref={buttonRef} />
      )}
      <p className="toggle-sub" style={{ marginTop: 8 }}>
        Your pockets stay on this device. Signing in only shows your name here.
      </p>
    </div>
  );
}
