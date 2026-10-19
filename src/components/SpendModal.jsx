import React, { useState, useEffect } from 'react';
import { X, Minus, AlertCircle, Check, Tag } from 'lucide-react';
import { formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function SpendModal({ 
  isOpen, 
  onClose, 
  pockets, 
  selectedPocket, 
  currency, 
  onConfirmSpend 
}) {
  const [pocketId, setPocketId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPocket) {
      setPocketId(selectedPocket.id);
    } else if (pockets.length > 0 && !pocketId) {
      setPocketId(pockets[0].id);
    }
    setAmount('');
    setNote('');
    setError('');
  }, [isOpen, selectedPocket, pockets]);

  if (!isOpen) return null;

  const currentPocket = pockets.find(p => p.id === pocketId) || pockets[0];
  const numAmount = parseFloat(amount) || 0;
  const currentBalance = currentPocket ? Number(currentPocket.balance) : 0;
  const newBalance = currentBalance - numAmount;
  const willOverspend = numAmount > 0 && newBalance < 0;

  const quickAmounts = [5, 10, 20, 50, 100];

  const handleQuickAddAmount = (val) => {
    sounds.playTap();
    triggerHaptic('light');
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPocket) {
      setError('Please select a pocket');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    sounds.playSpend();
    triggerHaptic('medium');

    onConfirmSpend({
      pocketId: currentPocket.id,
      pocketName: currentPocket.name,
      amount: numAmount,
      note: note.trim() || 'Quick reduction',
      date: new Date().toISOString(),
      type: 'spend',
      category: currentPocket.category || 'Expense'
    });

    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <Minus size={20} />
          </div>
          <div>
            <h2 className="modal-title">Reduce Pocket Balance</h2>
            <p className="modal-subtitle">Log spending from your tiny wallet</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Pocket Selector */}
          <div className="form-group">
            <label className="form-label">From Pocket</label>
            <div className="custom-select-wrapper">
              <select 
                className="form-select"
                value={pocketId} 
                onChange={(e) => setPocketId(e.target.value)}
              >
                {pockets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name} (Has {formatMoney(p.balance, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label">Amount to Deduct</label>
            <div className="amount-input-box">
              <span className="currency-prefix">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                className="amount-input num-mono"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
              />
            </div>

            {/* Quick Chip Presets */}
            <div className="quick-chips-row">
              {quickAmounts.map(val => (
                <button
                  type="button"
                  key={val}
                  className="quick-chip-btn"
                  onClick={() => handleQuickAddAmount(val)}
                >
                  +{currency}{val}
                </button>
              ))}
              <button
                type="button"
                className="quick-chip-btn chip-clear"
                onClick={() => setAmount('')}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Live Balance Impact Preview Card */}
          {currentPocket && (
            <div className={`balance-preview-card ${willOverspend ? 'preview-danger' : ''}`}>
              <div className="preview-row">
                <span>Current In Pocket:</span>
                <strong className="num-mono">{formatMoney(currentBalance, currency)}</strong>
              </div>
              <div className="preview-row">
                <span>Deduction:</span>
                <span className="num-mono text-danger">-{formatMoney(numAmount, currency)}</span>
              </div>
              <div className="preview-divider" />
              <div className="preview-row result-row">
                <span>Remaining After:</span>
                <strong className={`num-mono ${willOverspend ? 'text-danger' : 'text-emerald'}`}>
                  {formatMoney(newBalance, currency)}
                </strong>
              </div>

              {willOverspend && (
                <div className="overspend-warning-banner">
                  <AlertCircle size={15} />
                  <span>This reduction exceeds the available pocket balance by {formatMoney(Math.abs(newBalance), currency)}.</span>
                </div>
              )}
            </div>
          )}

          {/* Note / Merchant */}
          <div className="form-group">
            <label className="form-label">
              <Tag size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Note / Merchant (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Grocery trip, Coffee, Gas, Netflix..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="form-error-msg">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-btn btn-danger-action"
            disabled={numAmount <= 0}
          >
            <Check size={18} />
            <span>Confirm Deduction</span>
          </button>
        </form>
      </div>
    </div>
  );
}
