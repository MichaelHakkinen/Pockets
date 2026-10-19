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
  ShieldAlert,
  Info
} from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

export default function SettingsView({
  currency,
  onCurrencyChange,
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
  const [copied, setCopied] = useState(false);
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

  const currencies = [
    { code: '$', label: 'USD ($)' },
    { code: '€', label: 'EUR (€)' },
    { code: '£', label: 'GBP (£)' },
    { code: '¥', label: 'JPY / CNY (¥)' },
    { code: '₹', label: 'INR (₹)' },
    { code: 'A$', label: 'AUD (A$)' },
    { code: 'C$', label: 'CAD (C$)' },
    { code: 'Rp', label: 'IDR (Rp)' },
    { code: '₱', label: 'PHP (₱)' },
  ];

  return (
    <div className="settings-view animate-fade-in">
      {/* PWA Install Guide Card */}
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

      {/* Currency Selector */}
      <div className="settings-section glass-panel">
        <h4 className="settings-heading">Currency Symbol</h4>
        <div className="currency-grid">
          {currencies.map(c => (
            <button
              key={c.code}
              className={`currency-chip ${currency === c.code ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                triggerHaptic('light');
                onCurrencyChange(c.code);
              }}
            >
              <span className="curr-sym num-mono">{c.code}</span>
              <span className="curr-name">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferences (Audio & Haptics) */}
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

      {/* Data Management */}
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
        <p className="app-version">Pockets Progressive Web App • v2.0</p>
        <p className="app-offline-tag">100% Offline & Private Local Storage</p>
      </div>
    </div>
  );
}
