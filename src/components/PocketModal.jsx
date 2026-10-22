import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Palette, Smile, Plus, Layers } from 'lucide-react';
import { POCKET_COLORS } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

const CURATED_EMOJIS = [
  '🛒', '☕', '⚡', '🎬', '🚗', '🛡️', 
  '🏠', '🍔', '💊', '✈️', '💻', '🎁', 
  '👗', '📚', '🐾', '🏋️', '💳', '🏝️',
  '🎯', '🚀', '💎', '🎨', '🍕', '🎉'
];

const DEFAULT_CATEGORIES = ['Needs', 'Wants', 'Savings', 'Bills / Debt', 'Investments'];

export default function PocketModal({
  isOpen,
  onClose,
  pocketToEdit,
  currency,
  onSavePocket,
  onDeletePocket,
  existingPockets = []
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👛');
  const [customEmoji, setCustomEmoji] = useState('');
  const [target, setTarget] = useState('300');
  const [balance, setBalance] = useState('300');
  const [category, setCategory] = useState('Needs');
  const [customCategories, setCustomCategories] = useState([]);
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [color, setColor] = useState('emerald');
  const [percentage, setPercentage] = useState('15');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Extract all existing categories from user's pockets
  const allKnownCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...existingPockets.map(p => p.category).filter(Boolean),
    ...customCategories,
    ...(pocketToEdit?.category ? [pocketToEdit.category] : [])
  ]));

  useEffect(() => {
    if (pocketToEdit) {
      setName(pocketToEdit.name);
      setEmoji(pocketToEdit.emoji || '👛');
      setCustomEmoji(CURATED_EMOJIS.includes(pocketToEdit.emoji) ? '' : (pocketToEdit.emoji || ''));
      setTarget(pocketToEdit.target.toString());
      setBalance(pocketToEdit.balance.toString());
      setCategory(pocketToEdit.category || 'Needs');
      setColor(pocketToEdit.color || 'emerald');
      setPercentage((pocketToEdit.percentage ?? 15).toString());
      setNote(pocketToEdit.note || '');
    } else {
      setName('');
      setEmoji('👛');
      setCustomEmoji('');
      setTarget('300');
      setBalance('0');
      setCategory('Needs');
      setColor('emerald');
      setPercentage('15');
      setNote('');
    }
    setShowCustomCat(false);
    setNewCatInput('');
    setError('');
  }, [isOpen, pocketToEdit]);

  if (!isOpen) return null;

  const handleSelectCuratedEmoji = (em) => {
    sounds.playTap();
    triggerHaptic('light');
    setEmoji(em);
    setCustomEmoji('');
  };

  const handleCustomEmojiChange = (val) => {
    setCustomEmoji(val);
    if (val.trim()) {
      setEmoji(val.trim());
    }
  };

  const handleSelectCategory = (cat) => {
    sounds.playTap();
    triggerHaptic('light');
    setCategory(cat);
    setShowCustomCat(false);
  };

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    sounds.playTap();
    triggerHaptic('success');
    if (!customCategories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setNewCatInput('');
    setShowCustomCat(false);
  };

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
      category: category || 'Needs',
      color,
      note: note.trim()
    });

    onClose();
  };

  const handleDelete = () => {
    if (!pocketToEdit) return;
    if (window.confirm(`Are you sure you want to remove "${pocketToEdit.name}"? Any remaining money will be safely moved to your unallocated funds.`)) {
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

          {/* Emoji / Icon Selector */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">
                <Smile size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Choose Icon
              </label>
              <span className="active-item-badge">
                Selected: <strong className="emoji-display-preview">{emoji}</strong>
              </span>
            </div>

            <div className="emoji-picker-row">
              {CURATED_EMOJIS.map(em => (
                <button
                  type="button"
                  key={em}
                  className={`emoji-btn ${emoji === em ? 'active' : ''}`}
                  onClick={() => handleSelectCuratedEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Custom Icon / Emoji Input */}
            <div className="custom-input-with-button">
              <input
                type="text"
                placeholder="Or type/paste your own custom icon (e.g. 🎯, 🚀, 💎)..."
                className="form-input custom-emoji-input"
                value={customEmoji}
                onChange={(e) => handleCustomEmojiChange(e.target.value)}
              />
              {customEmoji && (
                <button
                  type="button"
                  className="btn-apply-custom-tag"
                  onClick={() => {
                    if (customEmoji.trim()) {
                      sounds.playTap();
                      triggerHaptic('light');
                      setEmoji(customEmoji.trim());
                    }
                  }}
                >
                  Use This
                </button>
              )}
            </div>
          </div>

          {/* Budget Bucket / Category */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">
                <Layers size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Budget Bucket
              </label>
              <span className="active-item-badge">
                Active: <strong>{category}</strong>
              </span>
            </div>

            <div className="category-chips-row">
              {allKnownCategories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`cat-chip-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(cat)}
                >
                  {cat}
                </button>
              ))}
              
              <button
                type="button"
                className={`cat-chip-btn cat-chip-add ${showCustomCat ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setShowCustomCat(!showCustomCat);
                }}
              >
                <Plus size={13} style={{ marginRight: 4 }} />
                <span>Custom Bucket</span>
              </button>
            </div>

            {showCustomCat && (
              <div className="custom-input-with-button animate-fade-in" style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Enter custom bucket name (e.g. Vacation, Kids, Tax)..."
                  className="form-input"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-apply-custom-tag"
                  disabled={!newCatInput.trim()}
                  onClick={handleAddCustomCategory}
                >
                  Add Bucket
                </button>
              </div>
            )}
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

          {/* Color Theme */}
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
              placeholder="e.g. Set aside for groceries & supplies"
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
