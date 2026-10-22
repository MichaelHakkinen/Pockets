import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Key, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  processGoogleCredential, 
  createCustomGoogleUser, 
  DEMO_GOOGLE_PROFILES,
  getStoredGoogleClientId,
  setStoredGoogleClientId
} from '../utils/auth';
import { sounds, triggerHaptic } from '../utils/audio';

export default function GoogleAuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onSignOut
}) {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState(() => getStoredGoogleClientId());
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const googleBtnRef = useRef(null);

  // Initialize or check Google Identity Services
  useEffect(() => {
    if (!isOpen) return;

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        const clientId = getStoredGoogleClientId();
        if (clientId && googleBtnRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: (response) => {
                if (response?.credential) {
                  const profile = processGoogleCredential(response.credential);
                  if (profile) {
                    sounds.playSuccess();
                    triggerHaptic('success');
                    onLoginSuccess(profile);
                    onClose();
                  }
                }
              }
            });

            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_blue',
              size: 'large',
              shape: 'pill',
              width: 320,
              text: 'continue_with'
            });
          } catch (err) {
            console.warn('Google GSI init notice:', err);
          }
        }
      }
    };

    checkGsi();
    const interval = setInterval(checkGsi, 1000);
    return () => clearInterval(interval);
  }, [isOpen, clientIdInput]);

  if (!isOpen) return null;

  const handleCustomLogin = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    sounds.playSuccess();
    triggerHaptic('success');
    const user = createCustomGoogleUser({
      name: nameInput.trim() || emailInput.split('@')[0],
      email: emailInput.trim()
    });
    onLoginSuccess(user);
    onClose();
  };

  const handleDemoSelect = (demo) => {
    sounds.playSuccess();
    triggerHaptic('success');
    const user = createCustomGoogleUser(demo);
    onLoginSuccess(user);
    onClose();
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    setStoredGoogleClientId(clientIdInput);
    triggerHaptic('light');
    alert('Google Client ID saved. Official Google Sign-In button will re-initialize.');
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container auth-modal-container animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: '#ffffff', color: '#1a73e8', padding: 6 }}>
            {/* Official Google 'G' Logo SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">
              {currentUser ? 'Google Account' : 'Sign in with Google'}
            </h2>
            <p className="modal-subtitle">
              {currentUser ? 'Connected & Synced' : 'Sync budgets and secure your tiny wallets'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Profile Card if Logged In */
          <div className="auth-profile-card glass-panel">
            <div className="auth-avatar-row">
              <div className="auth-avatar-wrap">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="auth-profile-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="auth-google-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </span>
              </div>
              <div className="auth-profile-meta">
                <div className="auth-name-row">
                  <span className="auth-display-name">{currentUser.name}</span>
                  <span className="auth-verified-pill">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <span className="auth-email-text">{currentUser.email}</span>
                <span className="auth-signin-date">
                  Logged in via Google • {new Date(currentUser.signedInAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="auth-sync-status">
              <div className="sync-status-icon">
                <Sparkles size={16} color="#10b981" />
              </div>
              <div className="sync-status-text">
                <strong>Local Profile Active</strong>
                <span>All pocket balances, budget rules & transactions are tied to this profile.</span>
              </div>
            </div>

            <div className="auth-actions-group">
              <button 
                className="btn-switch-account" 
                onClick={() => {
                  sounds.playTap();
                  triggerHaptic('light');
                  onSignOut();
                }}
              >
                <span>Switch Google Account</span>
              </button>

              <button 
                className="btn-signout-danger"
                onClick={() => {
                  sounds.playTap();
                  triggerHaptic('warning');
                  onSignOut();
                  onClose();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign-In Options when not Logged In */
          <div className="auth-login-options">
            {/* Official Google GSI Button Mount */}
            <div 
              ref={googleBtnRef} 
              id="google-signin-btn-container"
              className="google-gsi-wrapper"
            />

            {/* Instant One-Click Google Account Presets */}
            <div className="instant-accounts-section">
              <div className="auth-divider-line">
                <span>Select Google Account</span>
              </div>

              <div className="quick-google-accounts-list">
                {DEMO_GOOGLE_PROFILES.map((profile) => (
                  <button
                    key={profile.email}
                    className="google-account-quick-item"
                    onClick={() => handleDemoSelect(profile)}
                  >
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="quick-acct-avatar"
                    />
                    <div className="quick-acct-text">
                      <strong className="quick-acct-name">{profile.name}</strong>
                      <span className="quick-acct-email">{profile.email}</span>
                    </div>
                    <ArrowRight size={16} className="quick-acct-arrow" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleCustomLogin} className="custom-google-form">
              <div className="auth-divider-line">
                <span>Or Enter Your Google Address</span>
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Google Email</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  className="form-input"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-input"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn btn-google-login"
                disabled={!emailInput.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with this Google Account</span>
              </button>
            </form>

            {/* Developer / Advanced OAuth Client ID Accordion */}
            <div className="auth-dev-section">
              <button 
                type="button" 
                className="auth-dev-toggle-btn"
                onClick={() => setShowDevSettings(!showDevSettings)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Key size={13} />
                  <span>Google OAuth Client ID (Optional)</span>
                </div>
                {showDevSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDevSettings && (
                <div className="auth-dev-content animate-fade-in">
                  <p className="auth-dev-desc">
                    If you have a Google Cloud Console OAuth 2.0 Client ID for your domain, you can paste it here to render the official Google One Tap and button:
                  </p>
                  <form onSubmit={handleSaveClientId} className="auth-dev-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={e => setClientIdInput(e.target.value)}
                    />
                    <button type="submit" className="save-clientid-btn">
                      Save Client ID
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
