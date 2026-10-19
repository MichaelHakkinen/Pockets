import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Percent, 
  Sliders, 
  Scale, 
  AlertCircle, 
  RefreshCw, 
  PieChart, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatMoney, POCKET_COLORS } from '../utils/storage';
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
  // Local editable percentages for each pocket: { [pocketId]: number }
  const [sliderPercentages, setSliderPercentages] = useState({});
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Initialize slider percentages when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialAmount = unallocatedFunds > 0 ? unallocatedFunds : 1000;
      setTotalToSplit(initialAmount.toString());

      // Populate local percentages from pockets
      const initialPcts = {};
      let totalExisting = 0;
      pockets.forEach(p => {
        const val = typeof p.percentage === 'number' ? p.percentage : 0;
        initialPcts[p.id] = val;
        totalExisting += val;
      });

      // If existing percentages don't add to 100, normalize or distribute evenly
      if (totalExisting === 0 && pockets.length > 0) {
        const even = Math.floor(100 / pockets.length);
        pockets.forEach((p, idx) => {
          initialPcts[p.id] = idx === pockets.length - 1 ? 100 - (even * (pockets.length - 1)) : even;
        });
      }

      setSliderPercentages(initialPcts);
    }
  }, [isOpen, pockets, unallocatedFunds]);

  if (!isOpen) return null;

  const total = parseFloat(totalToSplit) || 0;

  // Calculate sum of slider percentages
  const totalPercentage = Object.values(sliderPercentages).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const isExactly100 = totalPercentage === 100;
  const remainingPct = 100 - totalPercentage;

  // Calculate dollar cut for each pocket based on its slider percentage
  const allocations = {};
  let assignedDollarSum = 0;
  pockets.forEach((p, idx) => {
    const pct = Number(sliderPercentages[p.id]) || 0;
    if (idx === pockets.length - 1 && isExactly100) {
      // Last pocket gets the exact cent remainder to guarantee 100% exact dollar distribution
      allocations[p.id] = Math.max(0, Math.round((total - assignedDollarSum) * 100) / 100);
    } else {
      const cut = Math.round((total * (pct / 100)) * 100) / 100;
      allocations[p.id] = cut;
      assignedDollarSum += cut;
    }
  });

  const totalAllocatedDollars = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);

  // --- Slider Handlers ---
  const handleSliderChange = (pocketId, newPctVal) => {
    const val = Math.max(0, Math.min(100, parseInt(newPctVal, 10) || 0));
    setSliderPercentages(prev => ({
      ...prev,
      [pocketId]: val
    }));
  };

  // Quick preset shortcuts to set sliders instantly
  const handleSetEvenSplit = () => {
    sounds.playTap();
    triggerHaptic('light');
    if (pockets.length === 0) return;
    const even = Math.floor(100 / pockets.length);
    const newPcts = {};
    pockets.forEach((p, idx) => {
      newPcts[p.id] = idx === pockets.length - 1 ? 100 - (even * (pockets.length - 1)) : even;
    });
    setSliderPercentages(newPcts);
  };

  const handleSet503020 = () => {
    sounds.playTap();
    triggerHaptic('light');
    const needs = pockets.filter(p => p.category === 'Needs');
    const wants = pockets.filter(p => p.category === 'Wants');
    const savings = pockets.filter(p => p.category === 'Savings' || (!['Needs', 'Wants'].includes(p.category)));

    const newPcts = {};
    const assignCategory = (arr, totalPct) => {
      if (!arr.length) return;
      const share = Math.floor(totalPct / arr.length);
      arr.forEach((p, i) => {
        newPcts[p.id] = i === arr.length - 1 ? totalPct - (share * (arr.length - 1)) : share;
      });
    };

    assignCategory(needs.length ? needs : pockets, 50);
    assignCategory(wants.length ? wants : pockets, 30);
    assignCategory(savings.length ? savings : pockets, 20);

    setSliderPercentages(newPcts);
  };

  const handleAutoBalance100 = () => {
    sounds.playTap();
    triggerHaptic('medium');
    if (totalPercentage <= 0) {
      handleSetEvenSplit();
      return;
    }
    // Scale each pocket proportionally so sum equals exactly 100
    let running = 0;
    const newPcts = {};
    pockets.forEach((p, idx) => {
      if (idx === pockets.length - 1) {
        newPcts[p.id] = Math.max(0, 100 - running);
      } else {
        const cur = Number(sliderPercentages[p.id]) || 0;
        const scaled = Math.round((cur / totalPercentage) * 100);
        newPcts[p.id] = scaled;
        running += scaled;
      }
    });
    setSliderPercentages(newPcts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (total <= 0) return;

    sounds.playSuccess();
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#fbbf24']
      });
    } catch {
      // ignore
    }

    onConfirmSplit({
      totalSplit: total,
      allocations,
      leftover: Math.max(0, Math.round((total - totalAllocatedDollars) * 100) / 100),
      updatedPercentages: saveAsDefault ? sliderPercentages : null
    });

    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container split-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="modal-title">Distribute Money</h2>
            <p className="modal-subtitle">Adjust sliders to set your 100% split breakdown</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Top Money Input Section */}
          <div className="form-group">
            <div className="split-amount-header">
              <label className="form-label">Total Money to Distribute</label>
              {unallocatedFunds > 0 && (
                <button
                  type="button"
                  className="link-helper-btn"
                  onClick={() => setTotalToSplit(unallocatedFunds.toString())}
                >
                  Use Ready Funds ({formatMoney(unallocatedFunds, currency)})
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

            {/* Quick preset chips */}
            <div className="quick-chips-row">
              {[250, 500, 1000, 2000, 3000].map(val => (
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

          {/* 100% Split Status Tracker Card */}
          <div className="split-summary-bar-card glass-panel">
            <div className="summary-bar-top">
              <div className="summary-bar-label-group">
                <Percent size={14} color="#10b981" />
                <span className="summary-bar-label">Total Allocated:</span>
                <strong className={`num-mono ${isExactly100 ? 'text-emerald' : totalPercentage > 100 ? 'text-danger' : 'text-amber'}`}>
                  {totalPercentage}% of 100%
                </strong>
              </div>

              {!isExactly100 && (
                <button
                  type="button"
                  className="auto-balance-pill-btn"
                  onClick={handleAutoBalance100}
                  title="Scale percentages so they sum to 100%"
                >
                  <Scale size={12} />
                  <span>Auto-Balance</span>
                </button>
              )}
            </div>

            {/* Multi-segment visual bar */}
            <div className="modal-multi-segment-track">
              {pockets.map(p => {
                const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
                const pct = Number(sliderPercentages[p.id]) || 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={p.id}
                    className="modal-segment-fill"
                    style={{
                      width: `${pct}%`,
                      background: colorDef.bg
                    }}
                    title={`${p.name}: ${pct}%`}
                  />
                );
              })}
            </div>

            {/* Status Warning & Quick Layout Presets */}
            <div className="summary-bar-bottom">
              {!isExactly100 ? (
                <span className={`pct-status-note ${totalPercentage > 100 ? 'text-danger' : 'text-amber'}`}>
                  {totalPercentage > 100 
                    ? `⚠️ ${totalPercentage - 100}% over 100%! Tap Auto-Balance.` 
                    : `ℹ️ ${remainingPct}% unassigned. Tap Auto-Balance to fill.`}
                </span>
              ) : (
                <span className="pct-status-note text-emerald">
                  ✓ 100% balanced across {pockets.length} tiny wallets
                </span>
              )}

              {/* Quick Strategy Presets */}
              <div className="quick-presets-group">
                <button type="button" className="preset-tiny-btn" onClick={handleSetEvenSplit}>
                  Even Split
                </button>
                <button type="button" className="preset-tiny-btn" onClick={handleSet503020}>
                  50/30/20
                </button>
              </div>
            </div>
          </div>

          {/* Sliders for Each Pocket */}
          <div className="form-group">
            <div className="split-list-header">
              <label className="form-label">Set Pocket Percentages (Sliders)</label>
              <span className="remaining-counter num-mono text-emerald">
                Total Cut: {formatMoney(totalAllocatedDollars, currency)}
              </span>
            </div>

            <div className="pocket-sliders-scroll-list">
              {pockets.map(p => {
                const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
                const pct = Number(sliderPercentages[p.id]) || 0;
                const cut = allocations[p.id] || 0;
                const newBalance = (Number(p.balance) || 0) + cut;

                return (
                  <div key={p.id} className="pocket-slider-card glass-panel" style={{ '--card-accent': colorDef.text }}>
                    {/* Top Row: Identity, Cut, and Percentage Input */}
                    <div className="slider-card-top">
                      <div className="slider-pocket-identity">
                        <span className="slider-emoji">{p.emoji}</span>
                        <div className="slider-title-col">
                          <span className="slider-pocket-name">{p.name}</span>
                          <span className="slider-balance-preview">
                            {formatMoney(p.balance, currency)} ➔ <strong className="text-emerald">{formatMoney(newBalance, currency)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Calculated Dollar Amount & % Input */}
                      <div className="slider-right-metrics">
                        <span className="slider-dollar-cut num-mono text-emerald">
                          +{formatMoney(cut, currency)}
                        </span>
                        <div className="slider-pct-input-box">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="slider-pct-num-input num-mono"
                            value={pct}
                            onChange={(e) => handleSliderChange(p.id, e.target.value)}
                          />
                          <span className="slider-pct-sym">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="slider-control-row">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="modal-pocket-range-slider"
                        value={pct}
                        style={{
                          background: `linear-gradient(to right, ${colorDef.text} 0%, ${colorDef.text} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`
                        }}
                        onChange={(e) => handleSliderChange(p.id, e.target.value)}
                      />
                    </div>

                    {/* Quick percentage tap buttons */}
                    <div className="slider-quick-chips">
                      {[0, 10, 15, 20, 25, 35, 50].map(v => (
                        <button
                          type="button"
                          key={v}
                          className={`slider-chip-btn ${pct === v ? 'active' : ''}`}
                          onClick={() => { sounds.playTap(); handleSliderChange(p.id, v); }}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remember Preferences Checkbox */}
          <label className="save-defaults-checkbox-row">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              Save these slider percentages as default for future distributions
            </span>
          </label>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-btn btn-emerald-action"
            disabled={total <= 0}
          >
            <Check size={18} />
            <span>Confirm & Distribute {formatMoney(total, currency)}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
