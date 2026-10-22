import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Coins, 
  Globe, 
  SlidersHorizontal 
} from 'lucide-react';
import { POPULAR_CURRENCIES, getCurrencyConfig } from '../utils/currencies';
import { formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function CurrencyModal({
  isOpen,
  onClose,
  currentCurrency,
  onSelectCurrency
}) {
  const [search, setSearch] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const currentConfig = getCurrencyConfig(currentCurrency);

  const filteredCurrencies = POPULAR_CURRENCIES.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code) => {
    sounds.playTap();
    triggerHaptic('light');
    onSelectCurrency(code);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;
    sounds.playTap();
    triggerHaptic('success');
    onSelectCurrency(customSymbol.trim());
    setCustomSymbol('');
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container currency-modal-container animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Coins size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">Select Currency</h2>
            <p className="modal-subtitle">
              Current: <strong className="num-mono" style={{ color: '#60a5fa' }}>{currentCurrency}</strong> ({currentConfig.name})
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="currency-live-preview-card glass-panel">
          <div className="preview-label">Live Display Preview</div>
          <div className="preview-value-box">
            <div className="preview-item">
              <span className="preview-caption">Small Amount:</span>
              <span className="preview-val num-mono">{formatMoney(currentConfig.quickSpend[1] || 25, currentCurrency)}</span>
            </div>
            <div className="preview-item">
              <span className="preview-caption">Large Balance:</span>
              <span className="preview-val num-mono text-emerald">{formatMoney(currentConfig.quickDeposit[1] || 1500, currentCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="currency-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="currency-search-input"
            placeholder="Search currency (IDR, USD, EUR, Rupiah, Yen...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Currencies Grid / List */}
        <div className="currency-options-scroll">
          <div className="currency-options-grid">
            {filteredCurrencies.map(c => {
              const isActive = currentCurrency === c.code || currentCurrency === c.symbol;
              return (
                <button
                  key={c.code}
                  className={`currency-option-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(c.code)}
                >
                  <div className="currency-option-top">
                    <span className="currency-flag-emoji">{c.flag}</span>
                    <span className="currency-option-symbol num-mono">{c.symbol}</span>
                    {isActive && (
                      <span className="currency-active-check">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <div className="currency-option-info">
                    <span className="currency-iso-code">{c.iso}</span>
                    <span className="currency-full-name">{c.name}</span>
                  </div>
                  <div className="currency-sample-tag num-mono">
                    {formatMoney(c.quickSpend[1], c.code)}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCurrencies.length === 0 && (
            <div className="no-currencies-found">
              <Globe size={24} color="#64748b" />
              <p>No predefined currency matching "{search}"</p>
              <button 
                className="btn-use-custom"
                onClick={() => {
                  setCustomSymbol(search);
                  setShowCustom(true);
                }}
              >
                Use "{search}" as custom currency symbol
              </button>
            </div>
          )}
        </div>

        {/* Custom Currency Toggle / Input */}
        <div className="custom-currency-drawer">
          {!showCustom ? (
            <button 
              className="toggle-custom-currency-btn"
              onClick={() => setShowCustom(true)}
            >
              <SlidersHorizontal size={14} />
              <span>Enter custom currency symbol</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="custom-currency-form">
              <label className="form-label">Custom Currency Symbol or Code</label>
              <div className="custom-input-row">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. zł, kr, د.إ"
                  className="custom-symbol-input num-mono"
                  value={customSymbol}
                  onChange={e => setCustomSymbol(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="apply-custom-btn"
                  disabled={!customSymbol.trim()}
                >
                  Apply
                </button>
                <button 
                  type="button" 
                  className="cancel-custom-btn"
                  onClick={() => setShowCustom(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
