import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Palette, Smile } from 'lucide-react';
import { POCKET_COLORS } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

const CURATED_EMOJIS = [
  '🛒', '☕', '⚡', '🎬', '🚗', '🛡️', 
  '🏠', '🍔', '💊', '✈️', '💻', '🎁', 
  '👗', '📚', '🐾', '🏋️', '💳', '🏝️'
];

export default function PocketModal({
  isOpen,
  onClose,
  pocketToEdit,
  currency,
  onSavePocket,
  onDeletePocket
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👛');
  const [target, setTarget] = useState('300');
  const [balance, setBalance] = useState('300');
  const [category, setCategory] = useState('Needs');
  const [color, setColor] = useState('emerald');
  const [percentage, setPercentage] = useState('15');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pocketToEdit) {
      setName(pocketToEdit.name);
      setEmoji(pocketToEdit.emoji || '👛');
      setTarget(pocketToEdit.target.toString());
      setBalance(pocketToEdit.balance.toString());
      setCategory(pocketToEdit.category || 'Needs');
      setColor(pocketToEdit.color || 'emerald');
      setPercentage((pocketToEdit.percentage ?? 15).toString());
      setNote(pocketToEdit.note || '');
    } else {
      setName('');
      setEmoji('👛');
      setTarget('300');
      setBalance('0');
      setCategory('Needs');
      setColor('emerald');
      setPercentage('15');
      setNote('');
    }
    setError('');
  }, [isOpen, pocketToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a pocket name');
      return;
    }
    const numTarget = parseFloat(target) || 0;
    const numBalance = parseFloat(balance) || 0;
    const numPct = parseInt(percentage, 10) || 0;

    sounds.playDeposit();
    triggerHaptic('medium');

    onSavePocket({
      id: pocketToEdit ? pocketToEdit.id : `pkt-${Date.now()}`,
      name: name.trim(),
      emoji: emoji || '👛',
      target: Math.max(1, numTarget),
      balance: numBalance,
      percentage: Math.max(0, Math.min(100, numPct)),
      spent: pocketToEdit ? pocketToEdit.spent : 0,
      category,
      color,
      note: note.trim()
    });

    onClose();
  };

  const handleDelete = () => {
    if (!pocketToEdit) return;
    if (window.confirm(`Are you sure you want to remove "${pocketToEdit.name}"? Any remaining money (${currency}${pocketToEdit.balance.toFixed(2)}) will be safely moved to your unallocated funds.`)) {
      sounds.playTap();
      triggerHaptic('warning');
      onDeletePocket(pocketToEdit.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <span>{emoji}</span>
          </div>
          <div>
            <h2 className="modal-title">{pocketToEdit ? 'Edit Pocket' : 'Create New Pocket'}</h2>
            <p className="modal-subtitle">Configure your tiny wallet envelope</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Pocket Name */}
          <div className="form-group">
            <label className="form-label">Pocket Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Health & Fitness, Pet Care, Vacation..."
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          {/* Emoji Selector */}
          <div className="form-group">
            <label className="form-label">
              <Smile size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Choose Icon
            </label>
            <div className="emoji-picker-row">
              {CURATED_EMOJIS.map(em => (
                <button
                  type="button"
                  key={em}
                  className={`emoji-btn ${emoji === em ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setEmoji(em); }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Target and Initial Balance */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Budget Goal ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-input num-mono"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="300"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Balance ({currency})</label>
              <input
                type="number"
                step="0.01"
                className="form-input num-mono"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Percentage Share of 100% */}
          <div className="form-group">
            <div className="split-amount-header">
              <label className="form-label">Split Percentage Share</label>
              <span className="available-hint num-mono">{percentage}% of 100%</span>
            </div>
            <div className="pct-modal-input-row">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                className="rule-range-slider"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
              <div className="pct-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="pct-number-input num-mono"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
                <span className="pct-symbol">%</span>
              </div>
            </div>
            <div className="quick-pct-chips">
              {[5, 10, 15, 20, 25, 30].map(val => (
                <button
                  type="button"
                  key={val}
                  className={`quick-chip-btn ${parseInt(percentage, 10) === val ? 'chip-active' : ''}`}
                  onClick={() => { sounds.playTap(); setPercentage(val.toString()); }}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Budget Bucket</label>
            <div className="category-chips-row">
              {['Needs', 'Wants', 'Savings', 'Other'].map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`cat-chip-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setCategory(cat); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color Gradient Theme */}
          <div className="form-group">
            <label className="form-label">
              <Palette size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Theme Color
            </label>
            <div className="color-palette-row">
              {POCKET_COLORS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`color-swatch-btn ${color === c.id ? 'active' : ''}`}
                  style={{ background: c.bg }}
                  title={c.name}
                  onClick={() => { sounds.playTap(); setColor(c.id); }}
                >
                  {color === c.id && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Description / Purpose (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Set aside $50 each paycheck"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <div className="form-error-msg">{error}</div>}

          {/* Buttons */}
          <div className="modal-actions-group">
            <button type="submit" className="submit-btn btn-indigo-action">
              <Check size={18} />
              <span>{pocketToEdit ? 'Save Changes' : 'Create Pocket'}</span>
            </button>

            {pocketToEdit && (
              <button
                type="button"
                className="btn-delete-pocket"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                <span>Delete Pocket</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
