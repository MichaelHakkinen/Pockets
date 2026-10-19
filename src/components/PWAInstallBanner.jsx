import React, { useState } from 'react';
import { Download, X, Smartphone, ArrowRight } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

export default function PWAInstallBanner({ deferredPrompt, isInstalled, onOpenInstallGuide }) {
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        sounds.playSuccess();
        triggerHaptic('success');
      }
    } else {
      onOpenInstallGuide();
    }
  };

  return (
    <div className="pwa-floating-banner animate-slide-up">
      <div className="pwa-banner-content" onClick={handleInstall}>
        <div className="pwa-banner-icon">
          <Smartphone size={16} />
        </div>
        <div className="pwa-banner-text">
          <strong>Install Pockets PWA</strong>
          <span>Fast, offline access on iOS & Android</span>
        </div>
      </div>
      <button 
        className="pwa-banner-btn"
        onClick={handleInstall}
      >
        <span>Install</span>
        <ArrowRight size={13} />
      </button>
      <button 
        className="pwa-banner-close"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
