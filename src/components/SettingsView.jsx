import React, { useState, useRef } from 'react';
import {
  Download,
  FileUp,
  Smartphone, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  RotateCcw, 
  FileDown, 
  Check, 
  Share2, 
  PlusSquare,
  ChevronRight,
  Globe
} from 'lucide-react';
import GoogleAccountCard from './GoogleAccountCard';
import { sounds, triggerHaptic } from '../utils/audio';
import { POPULAR_CURRENCIES, getCurrencyConfig } from '../utils/currencies';
import { formatMoney } from '../utils/storage';

export default function SettingsView({
  currency,
  onCurrencyChange,
  onOpenCurrencyModal,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onResetData,
  onExportData,
  onImportData,
  deferredPrompt,
  isInstalled
}) {
  const [deviceOS] = useState(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    return 'desktop';
  });
  const [importStatus, setImportStatus] = useState('');
  const importInputRef = useRef(null);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Importing replaces all current pockets, balances and transactions with the backup. Continue?')) return;
    const ok = await onImportData(file);
    setImportStatus(ok ? 'Backup restored.' : 'That file is not a valid Pockets backup.');
    if (ok) {
      sounds.playSuccess();
      triggerHaptic('success');
    }
  };

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
      {/* 0. Google account (Firebase Auth) */}
      <GoogleAccountCard />

      {/* 1. Currency & Units Selector */}
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
                Sample: {formatMoney(50000, currency)}
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

      {/* 2. PWA Install Guide Card */}
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

      {/* 3. Tactile & Audio Preferences */}
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

      {/* 4. Backup & Data Management */}
      <div className="settings-section glass-panel">
        <h4 className="settings-heading">Backup & Data</h4>
        
        <div className="settings-buttons-col">
          <button className="settings-action-btn" onClick={onExportData}>
            <FileDown size={18} />
            <span>Export Pocket Data (JSON Backup)</span>
          </button>

          <button className="settings-action-btn" onClick={() => importInputRef.current?.click()}>
            <FileUp size={18} />
            <span>Import Backup (JSON)</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          {importStatus && <p className="toggle-sub" role="status">{importStatus}</p>}

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
