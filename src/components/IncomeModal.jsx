import React from 'react';
import { DollarSign, X } from 'lucide-react';
import { sounds } from '../utils/audio';
import { formatCompactNumber } from '../utils/currencies';
import { useModalFocus } from '../hooks/useModalFocus';

export default function IncomeModal({
  isOpen,
  onClose,
  currency,
  currConfig,
  incomeAmount,
  setIncomeAmount,
  onAddIncome
}) {
  const { modalRef, isNudging, handleBackdropClick } = useModalFocus(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={handleBackdropClick}>
      <div 
        ref={modalRef}
        className={`modal-container animate-slide-up ${isNudging ? 'attention-nudge' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">Deposit Funds / Paycheck</h2>
            <p className="modal-subtitle">Add money to your ready-to-assign pool</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onAddIncome} className="modal-form">
          <div className="form-group">
            <label className="form-label">Deposit Amount</label>
            <div className="amount-input-box">
              <span className="currency-prefix">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="1"
                autoFocus
                placeholder="1500.00"
                className="amount-input num-mono"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="quick-chips-row">
            {(() => {
              const presets = currConfig?.quickDeposit || [500, 1000, 2000, 3000];
              return presets.map(val => (
                <button
                  type="button"
                  key={val}
                  className="quick-chip-btn"
                  onClick={() => { sounds.playTap(); setIncomeAmount(val.toString()); }}
                >
                  +{currency}{currConfig?.hasSpace ? ' ' : ''}{formatCompactNumber(val)}
                </button>
              ));
            })()}
          </div>

          <button 
            type="submit" 
            className="submit-btn btn-emerald-action"
            disabled={!incomeAmount || parseFloat(incomeAmount) <= 0}
          >
            <span>Add to Ready-to-Assign</span>
          </button>
        </form>
      </div>
    </div>
  );
}
