import React from 'react';
import { Minus, Plus, MoreHorizontal, ArrowRightLeft, Sparkles, AlertTriangle } from 'lucide-react';
import { POCKET_COLORS, formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function PocketCard({ 
  pocket, 
  currency, 
  onQuickSpend, 
  onQuickAdd, 
  onEdit, 
  onTransfer 
}) {
  const colorDef = POCKET_COLORS.find(c => c.id === pocket.color) || POCKET_COLORS[0];
  
  // Calculations
  const target = Number(pocket.target) || 1;
  const balance = Number(pocket.balance) || 0;
  const spent = Number(pocket.spent) || 0;
  
  // Percent remaining of target budget
  const percentRemaining = Math.max(0, Math.min(100, Math.round((balance / target) * 100)));
  const isOverspent = balance < 0;
  const isLow = balance >= 0 && percentRemaining <= 20;

  // Status badge config
  let statusText = `${percentRemaining}% Left`;
  let statusBadgeClass = 'status-healthy';
  if (isOverspent) {
    statusText = `Over by ${formatMoney(Math.abs(balance), currency)}`;
    statusBadgeClass = 'status-danger';
  } else if (isLow) {
    statusText = `${percentRemaining}% Low`;
    statusBadgeClass = 'status-warning';
  }

  const handleSpendClick = (e) => {
    e.stopPropagation();
    sounds.playTap();
    triggerHaptic('light');
    onQuickSpend(pocket);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    sounds.playTap();
    triggerHaptic('light');
    onQuickAdd(pocket);
  };

  const handleTransferClick = (e) => {
    e.stopPropagation();
    sounds.playTap();
    triggerHaptic('light');
    onTransfer(pocket);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    sounds.playTap();
    triggerHaptic('light');
    onEdit(pocket);
  };

  return (
    <div 
      className="pocket-card"
      style={{
        '--card-accent': colorDef.text,
        '--card-glow': colorDef.glow,
        '--card-border': colorDef.border,
      }}
      onClick={() => onQuickSpend(pocket)}
      role="button"
      tabIndex={0}
      title="Click to spend from pocket"
    >
      <div className="card-top-row">
        <div className="pocket-identity">
          <div className="pocket-emoji-badge" style={{ background: colorDef.bg }}>
            <span>{pocket.emoji || '👛'}</span>
          </div>
          <div className="pocket-info">
            <h3 className="pocket-title">{pocket.name}</h3>
            <div className="pocket-meta-tags">
              <span className="pocket-cat-badge">{pocket.category || 'Budget'}</span>
              <span className="pocket-pct-tag">{pocket.percentage || 0}% cut</span>
            </div>
          </div>
        </div>

        <div className="card-top-actions">
          <span className={`pocket-status-pill ${statusBadgeClass}`}>
            {isOverspent && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
            {statusText}
          </span>
          <button 
            className="action-icon-btn" 
            onClick={handleEditClick} 
            title="Edit Pocket"
            aria-label="Edit Pocket"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {pocket.note && (
        <p className="pocket-note-text">{pocket.note}</p>
      )}

      {/* Primary Balance Section */}
      <div className="pocket-balance-block">
        <div className="balance-headline">
          <span className="balance-label">Remaining in Pocket</span>
          <span className={`balance-number num-mono ${isOverspent ? 'text-danger' : ''}`}>
            {formatMoney(balance, currency)}
          </span>
        </div>

        {/* Progress Bar with glowing indicator */}
        <div className="budget-meter-track">
          <div 
            className={`budget-meter-fill ${isOverspent ? 'fill-danger' : ''}`}
            style={{ 
              width: `${isOverspent ? 100 : percentRemaining}%`,
              background: isOverspent 
                ? 'linear-gradient(90deg, #f43f5e, #be123c)' 
                : colorDef.bg
            }}
          />
        </div>

        <div className="budget-sub-stats">
          <span>Spent: <strong className="num-mono">{formatMoney(spent, currency)}</strong></span>
          <span>Target: <strong className="num-mono">{formatMoney(target, currency)}</strong></span>
        </div>
      </div>

      {/* Card Quick Action Buttons */}
      <div className="pocket-actions-row">
        <button 
          className="pocket-btn btn-spend"
          onClick={handleSpendClick}
          title="Spend / Reduce balance"
        >
          <Minus size={16} />
          <span>Reduce / Spend</span>
        </button>

        <button 
          className="pocket-btn btn-topup"
          onClick={handleAddClick}
          title="Add money to this pocket"
        >
          <Plus size={16} />
          <span>Top Up</span>
        </button>

        <button 
          className="pocket-btn btn-mini-transfer"
          onClick={handleTransferClick}
          title="Move money to another pocket"
        >
          <ArrowRightLeft size={15} />
        </button>
      </div>
    </div>
  );
}
