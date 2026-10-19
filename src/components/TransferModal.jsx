import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function TransferModal({
  isOpen,
  onClose,
  pockets,
  unallocatedFunds,
  initialSourcePocket,
  currency,
  onConfirmTransfer
}) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSourcePocket) {
      setFromId(initialSourcePocket.id);
      const other = pockets.find(p => p.id !== initialSourcePocket.id);
      setToId(other ? other.id : 'unallocated');
    } else {
      setFromId('unallocated');
      if (pockets.length > 0) {
        setToId(pockets[0].id);
      }
    }
    setAmount('');
    setError('');
  }, [isOpen, initialSourcePocket, pockets]);

  if (!isOpen) return null;

  // Resolve source balance
  let maxTransferable = 0;
  if (fromId === 'unallocated') {
    maxTransferable = Math.max(0, unallocatedFunds);
  } else {
    const srcPocket = pockets.find(p => p.id === fromId);
    maxTransferable = srcPocket ? Math.max(0, srcPocket.balance) : 0;
  }

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fromId === toId) {
      setError('Source and Destination cannot be the same');
      return;
    }
    if (numAmount <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    if (numAmount > maxTransferable) {
      setError(`Amount exceeds available balance (${formatMoney(maxTransferable, currency)})`);
      return;
    }

    sounds.playDeposit();
    triggerHaptic('medium');

    onConfirmTransfer({
      fromId,
      toId,
      amount: numAmount
    });

    onClose();
  };

  const handleQuickPercent = (pct) => {
    sounds.playTap();
    const val = Math.round((maxTransferable * pct) * 100) / 100;
    setAmount(val.toString());
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h2 className="modal-title">Move Money Between Pockets</h2>
            <p className="modal-subtitle">Transfer funds without affecting total budget</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* From Dropdown */}
          <div className="form-group">
            <label className="form-label">Transfer From</label>
            <div className="custom-select-wrapper">
              <select 
                className="form-select"
                value={fromId} 
                onChange={(e) => { setFromId(e.target.value); setError(''); }}
              >
                <option value="unallocated">
                  ✨ Ready to Assign / Unallocated ({formatMoney(unallocatedFunds, currency)})
                </option>
                {pockets.map(p => (
                  <option key={p.id} value={p.id} disabled={p.id === toId}>
                    {p.emoji} {p.name} ({formatMoney(p.balance, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfer Arrow Icon indicator */}
          <div className="transfer-direction-indicator">
            <div className="transfer-line" />
            <div className="transfer-badge">
              <ArrowRightLeft size={16} />
            </div>
            <div className="transfer-line" />
          </div>

          {/* To Dropdown */}
          <div className="form-group">
            <label className="form-label">Transfer To</label>
            <div className="custom-select-wrapper">
              <select 
                className="form-select"
                value={toId} 
                onChange={(e) => { setToId(e.target.value); setError(''); }}
              >
                <option value="unallocated" disabled={fromId === 'unallocated'}>
                  ✨ Ready to Assign / Unallocated Pool
                </option>
                {pockets.map(p => (
                  <option key={p.id} value={p.id} disabled={p.id === fromId}>
                    {p.emoji} {p.name} ({formatMoney(p.balance, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <div className="split-amount-header">
              <label className="form-label">Amount</label>
              <span className="available-hint">
                Available: <strong className="num-mono">{formatMoney(maxTransferable, currency)}</strong>
              </span>
            </div>
            <div className="amount-input-box">
              <span className="currency-prefix">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxTransferable}
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                className="amount-input num-mono"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
              />
            </div>

            {/* Quick Percent Buttons */}
            <div className="quick-chips-row">
              <button 
                type="button" 
                className="quick-chip-btn" 
                onClick={() => handleQuickPercent(0.25)}
                disabled={maxTransferable <= 0}
              >
                25%
              </button>
              <button 
                type="button" 
                className="quick-chip-btn" 
                onClick={() => handleQuickPercent(0.5)}
                disabled={maxTransferable <= 0}
              >
                50%
              </button>
              <button 
                type="button" 
                className="quick-chip-btn" 
                onClick={() => handleQuickPercent(1.0)}
                disabled={maxTransferable <= 0}
              >
                All (100%)
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error-msg">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn btn-cyan-action"
            disabled={numAmount <= 0 || numAmount > maxTransferable}
          >
            <Check size={18} />
            <span>Confirm Transfer</span>
          </button>
        </form>
      </div>
    </div>
  );
}
