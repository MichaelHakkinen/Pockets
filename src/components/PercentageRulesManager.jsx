import React, { useState } from 'react';
import { 
  Percent, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Sliders, 
  DollarSign, 
  Scale
} from 'lucide-react';
import { POCKET_COLORS, getTotalPercentage, normalizePercentages, formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function PercentageRulesManager({
  pockets,
  currency,
  onUpdatePercentages,
  onOpenInsertMoney,
  onAddNewPocket
}) {
  const [editingId, setEditingId] = useState(null);
  const totalPercentage = getTotalPercentage(pockets);
  const isExactly100 = totalPercentage === 100;
  const sampleInsertAmount = 1000;

  const handlePercentageChange = (id, newPct) => {
    const val = Math.max(0, Math.min(100, parseInt(newPct, 10) || 0));
    const updated = pockets.map(p => p.id === id ? { ...p, percentage: val } : p);
    onUpdatePercentages(updated);
  };

  const handleAutoBalance = () => {
    sounds.playTap();
    triggerHaptic('medium');
    const balanced = normalizePercentages(pockets);
    onUpdatePercentages(balanced);
  };

  return (
    <div className="percentage-rules-manager animate-fade-in">
      {/* Header Banner */}
      <div className="split-rules-header glass-panel">
        <div className="split-rules-title-row">
          <div className="rules-icon-box">
            <Percent size={20} color="#10b981" />
          </div>
          <div>
            <h2 className="rules-heading">100% Split Distribution List</h2>
            <p className="rules-subheading">
              Each item takes a percentage from 100%. When you insert money, it splits automatically.
            </p>
          </div>
        </div>

        {/* 100% Multi-Segment Progress Bar */}
        <div className="multi-segment-bar-wrapper">
          <div className="multi-segment-bar-track">
            {pockets.map(p => {
              const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
              const pct = Number(p.percentage) || 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={p.id}
                  className="multi-segment-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: colorDef.bg,
                  }}
                  title={`${p.name}: ${pct}%`}
                />
              );
            })}
          </div>

          <div className="segment-bar-meta">
            <div className="total-pct-status">
              <span className="total-label">Total Allocated:</span>
              <strong className={`num-mono ${isExactly100 ? 'text-emerald' : totalPercentage > 100 ? 'text-danger' : 'text-amber'}`}>
                {totalPercentage}% of 100%
              </strong>
            </div>

            {!isExactly100 && (
              <button className="auto-balance-btn" onClick={handleAutoBalance} title="Evenly adjust percentages to equal exactly 100%">
                <Scale size={13} />
                <span>Auto-Balance to 100%</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning if not 100% */}
        {!isExactly100 && (
          <div className={`pct-alert-banner ${totalPercentage > 100 ? 'alert-danger' : 'alert-warning'}`}>
            <AlertCircle size={15} />
            <span>
              {totalPercentage > 100 
                ? `Percentages sum to ${totalPercentage}%. That's ${totalPercentage - 100}% over 100%! Tap Auto-Balance.`
                : `You have ${100 - totalPercentage}% unassigned. Tap Auto-Balance to fill to 100%.`}
            </span>
          </div>
        )}

        {/* Primary Call to Action: Insert Money */}
        <button 
          className="insert-money-hero-btn"
          onClick={() => {
            sounds.playDeposit();
            triggerHaptic('medium');
            onOpenInsertMoney();
          }}
        >
          <DollarSign size={20} />
          <span>Insert Money & Auto-Split</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Rules List Section */}
      <div className="rules-list-section">
        <div className="rules-list-header-row">
          <h3 className="section-title">Your Split List ({pockets.length} Items)</h3>
          <button 
            className="add-rule-btn"
            onClick={() => {
              sounds.playTap();
              triggerHaptic('light');
              onAddNewPocket();
            }}
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>
        </div>

        <div className="rules-items-container">
          {pockets.map(p => {
            const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
            const pct = Number(p.percentage) || 0;
            const previewCut = (sampleInsertAmount * (pct / 100));

            return (
              <div key={p.id} className="rule-item-card glass-panel" style={{ '--item-accent': colorDef.text }}>
                <div className="rule-item-top">
                  <div className="rule-identity">
                    <div className="rule-emoji-badge" style={{ background: colorDef.bg }}>
                      <span>{p.emoji}</span>
                    </div>
                    <div>
                      <h4 className="rule-name">{p.name}</h4>
                      <span className="rule-cut-preview">
                        Takes <strong>{formatMoney(previewCut, currency)}</strong> per {formatMoney(sampleInsertAmount, currency)} inserted
                      </span>
                    </div>
                  </div>

                  {/* Percentage Input Box */}
                  <div className="pct-input-wrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="pct-number-input num-mono"
                      value={pct}
                      onChange={(e) => handlePercentageChange(p.id, e.target.value)}
                    />
                    <span className="pct-symbol">%</span>
                  </div>
                </div>

                {/* Percentage Range Slider for smooth touch on mobile */}
                <div className="rule-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    className="rule-range-slider"
                    value={pct}
                    style={{
                      background: `linear-gradient(to right, ${colorDef.text} 0%, ${colorDef.text} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`
                    }}
                    onChange={(e) => handlePercentageChange(p.id, e.target.value)}
                  />
                  <div className="quick-pct-presets">
                    {[5, 10, 15, 20, 25, 30].map(presetVal => (
                      <button
                        type="button"
                        key={presetVal}
                        className={`pct-preset-chip ${pct === presetVal ? 'active' : ''}`}
                        onClick={() => handlePercentageChange(p.id, presetVal)}
                      >
                        {presetVal}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
