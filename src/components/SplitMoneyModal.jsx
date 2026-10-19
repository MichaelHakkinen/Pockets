import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Percent, ShieldCheck, RefreshCw, Sliders, ArrowDownRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatMoney, getTotalPercentage, normalizePercentages, POCKET_COLORS } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function SplitMoneyModal({ 
  isOpen, 
  onClose, 
  pockets, 
  unallocatedFunds, 
  currency, 
  onConfirmSplit 
}) {
  const [totalToSplit, setTotalToSplit] = useState('1000');
  const [strategy, setStrategy] = useState('percentage'); // 'percentage' | 'targets' | 'even' | 'custom'
  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Default to 1000 or unallocated funds if positive
      const initial = unallocatedFunds > 0 ? unallocatedFunds : 1000;
      setTotalToSplit(initial.toString());
      setStrategy('percentage');
    }
  }, [isOpen, unallocatedFunds]);

  const total = parseFloat(totalToSplit) || 0;
  const totalPercentage = getTotalPercentage(pockets);

  // Calculate allocations based on selected strategy
  useEffect(() => {
    if (total <= 0 || pockets.length === 0) {
      setAllocations({});
      return;
    }

    if (strategy === 'percentage') {
      // Primary Mode: Each item takes its percentage from 100%
      const newAlloc = {};
      let assignedSum = 0;
      
      // If percentages don't add to 100, calculate proportionally based on relative weights
      const sumPct = totalPercentage > 0 ? totalPercentage : 100;

      pockets.forEach((p, idx) => {
        const pct = Number(p.percentage) || 0;
        if (idx === pockets.length - 1) {
          // Last pocket gets the exact rounding remainder
          const remainder = Math.max(0, Math.round((total - assignedSum) * 100) / 100);
          newAlloc[p.id] = remainder;
        } else {
          const cut = Math.round(((pct / sumPct) * total) * 100) / 100;
          newAlloc[p.id] = cut;
          assignedSum += cut;
        }
      });
      setAllocations(newAlloc);

    } else if (strategy === 'targets') {
      // Fill deficits towards target budget
      let shortfalls = {};
      let totalShortfall = 0;
      pockets.forEach(p => {
        const deficit = Math.max(0, p.target - p.balance);
        shortfalls[p.id] = deficit;
        totalShortfall += deficit;
      });

      const newAlloc = {};
      if (totalShortfall > 0 && total <= totalShortfall) {
        let assignedSoFar = 0;
        pockets.forEach((p, idx) => {
          if (idx === pockets.length - 1) {
            newAlloc[p.id] = Math.max(0, Math.round((total - assignedSoFar) * 100) / 100);
          } else {
            const share = Math.round((shortfalls[p.id] / totalShortfall) * total * 100) / 100;
            newAlloc[p.id] = share;
            assignedSoFar += share;
          }
        });
      } else if (totalShortfall > 0 && total > totalShortfall) {
        const excess = total - totalShortfall;
        const excessPerPocket = Math.round((excess / pockets.length) * 100) / 100;
        pockets.forEach(p => {
          newAlloc[p.id] = Math.round((shortfalls[p.id] + excessPerPocket) * 100) / 100;
        });
      } else {
        const perPocket = Math.round((total / pockets.length) * 100) / 100;
        pockets.forEach(p => {
          newAlloc[p.id] = perPocket;
        });
      }
      setAllocations(newAlloc);

    } else if (strategy === 'even') {
      const perPocket = Math.round((total / pockets.length) * 100) / 100;
      const newAlloc = {};
      let assigned = 0;
      pockets.forEach((p, idx) => {
        if (idx === pockets.length - 1) {
          newAlloc[p.id] = Math.max(0, Math.round((total - assigned) * 100) / 100);
        } else {
          newAlloc[p.id] = perPocket;
          assigned += perPocket;
        }
      });
      setAllocations(newAlloc);
    }
  }, [totalToSplit, strategy, pockets, totalPercentage]);

  if (!isOpen) return null;

  const currentTotalAssigned = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const remainingToAssign = Math.max(0, Math.round((total - currentTotalAssigned) * 100) / 100);

  const handleCustomChange = (id, val) => {
    setStrategy('custom');
    const num = Math.max(0, parseFloat(val) || 0);
    setAllocations(prev => ({
      ...prev,
      [id]: num
    }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (total <= 0) return;

    sounds.playSuccess();
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#fbbf24']
      });
    } catch {
      // ignore
    }

    onConfirmSplit({
      totalSplit: total,
      allocations,
      leftover: remainingToAssign
    });

    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container split-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="modal-title">Insert Money & Split</h2>
            <p className="modal-subtitle">Money is split automatically into pockets by percentage</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleApply} className="modal-form">
          {/* Amount to Insert & Split */}
          <div className="form-group">
            <div className="split-amount-header">
              <label className="form-label">Money to Insert</label>
              {unallocatedFunds > 0 && (
                <button
                  type="button"
                  className="link-helper-btn"
                  onClick={() => setTotalToSplit(unallocatedFunds.toString())}
                >
                  Use Unallocated ({formatMoney(unallocatedFunds, currency)})
                </button>
              )}
            </div>
            <div className="amount-input-box">
              <span className="currency-prefix">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="1"
                inputMode="decimal"
                autoFocus
                className="amount-input num-mono"
                value={totalToSplit}
                onChange={(e) => setTotalToSplit(e.target.value)}
                placeholder="1000.00"
              />
            </div>

            {/* Quick chips to insert */}
            <div className="quick-chips-row">
              {[500, 1000, 1500, 2500, 3000].map(val => (
                <button
                  type="button"
                  key={val}
                  className="quick-chip-btn"
                  onClick={() => { sounds.playTap(); setTotalToSplit(val.toString()); }}
                >
                  {currency}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Selector Chips */}
          <div className="form-group">
            <label className="form-label">Split Method</label>
            <div className="strategy-grid">
              <button
                type="button"
                className={`strategy-card ${strategy === 'percentage' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setStrategy('percentage'); }}
              >
                <Percent size={18} />
                <span className="strat-title">100% Rules</span>
                <span className="strat-desc">Takes each item's % cut</span>
              </button>

              <button
                type="button"
                className={`strategy-card ${strategy === 'targets' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setStrategy('targets'); }}
              >
                <ShieldCheck size={18} />
                <span className="strat-title">Target Fill</span>
                <span className="strat-desc">Fills budget shortfalls</span>
              </button>

              <button
                type="button"
                className={`strategy-card ${strategy === 'even' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setStrategy('even'); }}
              >
                <RefreshCw size={18} />
                <span className="strat-title">Even Split</span>
                <span className="strat-desc">Equal share each</span>
              </button>

              <button
                type="button"
                className={`strategy-card ${strategy === 'custom' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setStrategy('custom'); }}
              >
                <Sliders size={18} />
                <span className="strat-title">Custom</span>
                <span className="strat-desc">Edit exact dollar cuts</span>
              </button>
            </div>
          </div>

          {/* Per-Pocket Allocation Breakdown Table */}
          <div className="form-group">
            <div className="split-list-header">
              <label className="form-label">
                {strategy === 'percentage' ? 'Percentage Distribution Breakdown' : 'Pockets Breakdown'}
              </label>
              <span className="remaining-counter num-mono text-emerald">
                {formatMoney(currentTotalAssigned, currency)} / {formatMoney(total, currency)}
              </span>
            </div>

            <div className="split-pockets-scroll">
              {pockets.map(p => {
                const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
                const assigned = allocations[p.id] || 0;
                const newBalance = (Number(p.balance) || 0) + assigned;
                const pct = Number(p.percentage) || 0;

                return (
                  <div key={p.id} className="split-pocket-item" style={{ borderLeft: `3px solid ${colorDef.text}` }}>
                    <div className="split-pocket-info">
                      <span className="split-emoji">{p.emoji}</span>
                      <div className="split-name-col">
                        <div className="split-name-row">
                          <span className="split-name">{p.name}</span>
                          <span className="split-pct-badge">{pct}% of 100%</span>
                        </div>
                        <span className="split-deficit-sub">
                          Current: {formatMoney(p.balance, currency)} ➔ <strong className="text-emerald">New: {formatMoney(newBalance, currency)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="split-cut-display">
                      <span className="split-cut-amount num-mono text-emerald">
                        +{formatMoney(assigned, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className="submit-btn btn-emerald-action"
            disabled={total <= 0}
          >
            <Check size={18} />
            <span>Confirm & Split {formatMoney(total, currency)}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
