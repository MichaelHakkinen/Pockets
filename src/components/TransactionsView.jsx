import React, { useState } from 'react';
import { Search, Filter, Trash2, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { formatMoney } from '../utils/storage';
import { sounds, triggerHaptic } from '../utils/audio';

export default function TransactionsView({
  transactions,
  pockets,
  currency,
  onDeleteTransaction
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pocketFilter, setPocketFilter] = useState('all');

  const filtered = transactions.filter(tx => {
    const matchesPocket = pocketFilter === 'all' || tx.pocketId === pocketFilter;
    const matchesSearch = 
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.pocketName && tx.pocketName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.category && tx.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPocket && matchesSearch;
  });

  const handleDelete = (tx) => {
    const effect = {
      spend: `put the money back into "${tx.pocketName}"`,
      transfer: 'move the money back where it came from',
      deposit: tx.category === 'Income' || tx.allocations
        ? 'take the money back out of the balances it was added to'
        : 'only remove this entry (balances stay as they are)'
    }[tx.type] || 'only remove this entry';
    if (window.confirm(`Undo "${tx.note}" (${formatMoney(tx.amount, currency)})? This will ${effect}.`)) {
      sounds.playTap();
      triggerHaptic('warning');
      onDeleteTransaction(tx.id);
    }
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="transactions-view animate-fade-in">
      {/* Search and Filters Bar */}
      <div className="search-filter-bar glass-panel">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search spending, notes, coffee, groceries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-wrapper">
          <Filter size={14} className="filter-icon" />
          <select 
            className="filter-select"
            value={pocketFilter}
            onChange={(e) => setPocketFilter(e.target.value)}
          >
            <option value="all">All Pockets</option>
            {pockets.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        {filtered.length === 0 ? (
          <div className="empty-state-box glass-panel">
            <span className="empty-emoji">🧾</span>
            <h3>No Transactions Found</h3>
            <p>Reductions and deposits logged from your pockets will appear here.</p>
          </div>
        ) : (
          filtered.map(tx => {
            const isSpend = tx.type === 'spend';
            const isTransfer = tx.type === 'transfer';

            return (
              <div key={tx.id} className="transaction-row glass-panel">
                <div className="tx-left">
                  <div className={`tx-icon-badge ${isSpend ? 'badge-spend' : isTransfer ? 'badge-transfer' : 'badge-deposit'}`}>
                    {isSpend ? <ArrowDownRight size={18} /> : isTransfer ? <ArrowRightLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="tx-details">
                    <span className="tx-note">{tx.note || 'Pocket Reduction'}</span>
                    <div className="tx-meta-sub">
                      <span className="tx-pocket-tag">{tx.pocketName}</span>
                      <span className="tx-bullet">•</span>
                      <span className="tx-date">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="tx-right">
                  <span className={`tx-amount num-mono ${isSpend ? 'amount-spend' : 'amount-deposit'}`}>
                    {isSpend ? '-' : '+'}{formatMoney(tx.amount, currency)}
                  </span>
                  <button 
                    className="tx-delete-btn" 
                    onClick={() => handleDelete(tx)}
                    title="Undo / Delete transaction and restore funds"
                    aria-label="Undo Transaction"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
