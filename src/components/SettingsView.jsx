import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  RotateCcw, 
  FileDown, 
  Check, 
  Share2, 
  PlusSquare,
  ShieldCheck,
  User,
  LogOut,
  Coins,
  ChevronRight,
  Globe
} from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';
import { POPULAR_CURRENCIES, getCurrencyConfig } from '../utils/currencies';
import { formatMoney } from '../utils/storage';

export default function SettingsView({
  currentUser,
  onOpenAuthModal,
  onSignOut,
  currency,
  onCurrencyChange,
  onOpenCurrencyModal,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  cycleType,
  onCycleTypeChange,
  onResetData,
  onExportData,
  deferredPrompt,
  isInstalled
}) {
  const [deviceOS, setDeviceOS] = useState('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setDeviceOS('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceOS('android');
    } else {
      setDeviceOS('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        sounds.playSuccess();
        triggerHaptic('success');
      }
    }
  };

  const currConfig = getCurrencyConfig(currency);

  return (
    <div className="settings-view animate-fade-in">
      {/* 1. Google Account Section */}
      <div className="settings-section glass-panel">
        <div className="settings-heading-row">
          <h4 className="settings-heading">Google Account</h4>
          {currentUser && (
            <span className="auth-status-badge">
              <ShieldCheck size={12} color="#10b981" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="settings-account-card">
            <div className="settings-account-info">
              <div className="settings-avatar-wrap">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="settings-avatar-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="settings-google-pill-icon">
                  <svg width="10" height="10" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </span>
              </div>
              <div className="settings-account-meta">
                <span className="settings-user-name">{currentUser.name}</span>
                <span className="settings-user-email">{currentUser.email}</span>
              </div>
            </div>

            <div className="settings-account-btns">
              <button 
                className="btn-settings-manage-acct"
                onClick={onOpenAuthModal}
              >
                <span>Manage Profile</span>
              </button>
              <button 
                className="btn-settings-signout"
                onClick={onSignOut}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-connect-google-box">
            <p className="settings-connect-text">
              Sign in with your Google account to personalize your budget envelopes and keep your settings backed up.
            </p>
            <button 
              className="settings-google-signin-btn"
              onClick={onOpenAuthModal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google Account</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Currency Selector */}
      <div className="settings-section glass-panel">
        <div className="settings-heading-row">
          <h4 className="settings-heading">Currency & Units</h4>
          <span className="current-currency-tag num-mono">
            Active: {currency}
          </span>
        </div>

        {/* Selected Currency Banner */}
        <div className="settings-curr-banner">
          <div className="curr-banner-left">
            <span className="curr-banner-flag">{currConfig.flag}</span>
            <div>
              <div className="curr-banner-title">
                <strong>{currConfig.name}</strong> ({currency})
              </div>
              <div className="curr-banner-sample num-mono">
                Sample format: {formatMoney(50000, currency)}
              </div>
            </div>
          </div>
          <button 
            className="btn-open-all-currencies"
            onClick={onOpenCurrencyModal}
          >
            <Globe size={14} />
            <span>All Currencies</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="currency-grid">
          {POPULAR_CURRENCIES.slice(0, 10).map(c => (
            <button
              key={c.code}
              className={`currency-chip ${currency === c.code ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                triggerHaptic('light');
                onCurrencyChange(c.code);
              }}
            >
              <span className="curr-flag">{c.flag}</span>
              <span className="curr-sym num-mono">{c.code}</span>
              <span className="curr-name">{c.iso}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. PWA Install Guide Card */}
      <div className="pwa-install-hero-card glass-panel">
        <div className="pwa-hero-header">
          <div className="pwa-icon-glow">
            <Smartphone size={24} color="#10b981" />
          </div>
          <div>
            <h3 className="pwa-hero-title">Install Pockets PWA</h3>
            <p className="pwa-hero-sub">Add to your iOS or Android home screen</p>
          </div>
          {isInstalled && (
            <span className="pwa-installed-badge">Installed</span>
          )}
        </div>

        {isInstalled ? (
          <div className="pwa-installed-message">
            <Check size={16} color="#10b981" />
            <span>Pockets is currently running in standalone PWA mode!</span>
          </div>
        ) : deferredPrompt ? (
          <button className="install-pwa-cta-btn" onClick={handleInstallClick}>
            <Download size={18} />
            <span>Install Pockets App</span>
          </button>
        ) : (
          <div className="install-instructions-block">
            {deviceOS === 'ios' ? (
              <div className="ios-instructions">
                <p className="inst-step">
                  <strong>1.</strong> Tap the <strong>Share</strong> button <Share2 size={14} style={{ verticalAlign: 'middle', margin: '0 3px' }} /> in Safari.
                </p>
                <p className="inst-step">
                  <strong>2.</strong> Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ verticalAlign: 'middle', margin: '0 3px' }} />.
                </p>
                <p className="inst-step">
                  <strong>3.</strong> Launch Pockets from your home screen for full native fullscreen experience!
                </p>
              </div>
            ) : (
              <div className="android-instructions">
                <p className="inst-step">
                  <strong>Android / Chrome:</strong> Tap browser menu (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
                <p className="inst-step">
                  <strong>iOS / Safari:</strong> Tap Share (<Share2 size={13} style={{ verticalAlign: 'middle' }} />) and tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Preferences (Audio & Haptics) */}
      <div className="settings-section glass-panel">
        <h4 className="settings-heading">Tactile & Audio Feedback</h4>
        
        <div className="setting-toggle-row">
          <div className="toggle-meta">
            <div className="toggle-icon-wrap">
              {soundEnabled ? <Volume2 size={18} color="#10b981" /> : <VolumeX size={18} color="#64748b" />}
            </div>
            <div>
              <span className="toggle-title">Sound Effects</span>
              <span className="toggle-sub">Synthesized clicks and coin chimes</span>
            </div>
          </div>
          <button 
            className={`switch-btn ${soundEnabled ? 'on' : 'off'}`}
            onClick={onToggleSound}
            aria-label="Toggle Sound"
          >
            <div className="switch-thumb" />
          </button>
        </div>

        <div className="setting-toggle-row">
          <div className="toggle-meta">
            <div className="toggle-icon-wrap">
              <Vibrate size={18} color={hapticsEnabled ? '#06b6d4' : '#64748b'} />
            </div>
            <div>
              <span className="toggle-title">Haptic Vibration</span>
              <span className="toggle-sub">Vibration pulses on mobile devices</span>
            </div>
          </div>
          <button 
            className={`switch-btn ${hapticsEnabled ? 'on' : 'off'}`}
            onClick={onToggleHaptics}
            aria-label="Toggle Haptics"
          >
            <div className="switch-thumb" />
          </button>
        </div>
      </div>

      {/* 5. Data Management */}
      <div className="settings-section glass-panel">
        <h4 className="settings-heading">Backup & Data</h4>
        
        <div className="settings-buttons-col">
          <button className="settings-action-btn" onClick={onExportData}>
            <FileDown size={18} />
            <span>Export Pocket Data (JSON Backup)</span>
          </button>

          <button 
            className="settings-action-btn btn-danger-outline" 
            onClick={() => {
              if (window.confirm("Reset all pockets and transactions back to the clean starter template?")) {
                sounds.playTap();
                triggerHaptic('warning');
                onResetData();
              }
            }}
          >
            <RotateCcw size={18} />
            <span>Reset to Clean Starter Template</span>
          </button>
        </div>
      </div>

      {/* About Footer */}
      <div className="settings-footer">
        <p className="app-version">Pockets Progressive Web App • v2.1</p>
        <p className="app-offline-tag">100% Offline & Private Local Storage</p>
      </div>
    </div>
  );
}
