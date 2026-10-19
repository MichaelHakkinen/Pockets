import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PieChart, 
  Clock, 
  Settings as SettingsIcon, 
  Plus, 
  Minus, 
  Sparkles, 
  ArrowRightLeft, 
  DollarSign, 
  SlidersHorizontal,
  Smartphone,
  Maximize2,
  Calendar,
  AlertCircle,
  Percent
} from 'lucide-react';

import { 
  INITIAL_POCKETS, 
  INITIAL_TRANSACTIONS, 
  loadSavedState, 
  saveState, 
  formatMoney,
  getTotalPercentage
} from './utils/storage';
import { sounds, triggerHaptic } from './utils/audio';

import PocketCard from './components/PocketCard';
import SpendModal from './components/SpendModal';
import SplitMoneyModal from './components/SplitMoneyModal';
import PocketModal from './components/PocketModal';
import TransferModal from './components/TransferModal';
import PercentageRulesManager from './components/PercentageRulesManager';
import AnalyticsView from './components/AnalyticsView';
import TransactionsView from './components/TransactionsView';
import SettingsView from './components/SettingsView';
import PWAInstallBanner from './components/PWAInstallBanner';

import './App.css';

export default function App() {
  // --- Persistent State ---
  const [pockets, setPockets] = useState(() => {
    const saved = loadSavedState();
    return saved?.pockets || INITIAL_POCKETS;
  });

  const [unallocatedFunds, setUnallocatedFunds] = useState(() => {
    const saved = loadSavedState();
    return typeof saved?.unallocatedFunds === 'number' ? saved.unallocatedFunds : 420.00;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = loadSavedState();
    return saved?.transactions || INITIAL_TRANSACTIONS;
  });

  const [currency, setCurrency] = useState(() => {
    const saved = loadSavedState();
    return saved?.currency || '$';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = loadSavedState();
    return typeof saved?.soundEnabled === 'boolean' ? saved.soundEnabled : true;
  });

  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    const saved = loadSavedState();
    return typeof saved?.hapticsEnabled === 'boolean' ? saved.hapticsEnabled : true;
  });

  const [cycleType, setCycleType] = useState(() => {
    const saved = loadSavedState();
    return saved?.cycleType || 'Monthly';
  });

  // --- UI Navigation State ---
  const [activeTab, setActiveTab] = useState('pockets'); // 'pockets' | 'analytics' | 'activity' | 'settings'
  const [pocketFilter, setPocketFilter] = useState('all'); // 'all' | 'needs' | 'wants' | 'savings' | 'low'
  const [desktopFrameView, setDesktopFrameView] = useState(false); // Mobile mockup frame toggle for desktop

  // --- Modals State ---
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [spendPocket, setSpendPocket] = useState(null);

  const [isSplitOpen, setIsSplitOpen] = useState(false);

  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);
  const [pocketToEdit, setPocketToEdit] = useState(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSourcePocket, setTransferSourcePocket] = useState(null);

  // Quick Income Deposit Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');

  // --- PWA State ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Persist state changes
  useEffect(() => {
    saveState({
      pockets,
      unallocatedFunds,
      transactions,
      currency,
      soundEnabled,
      hapticsEnabled,
      cycleType
    });
    sounds.enabled = soundEnabled;
  }, [pockets, unallocatedFunds, transactions, currency, soundEnabled, hapticsEnabled, cycleType]);

  // PWA beforeinstallprompt and standalone check
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // --- Handlers ---

  // 1. Spend / Deduct from Pocket
  const handleConfirmSpend = (spendData) => {
    const { pocketId, amount, note, date, type, category } = spendData;

    setPockets(prev => prev.map(p => {
      if (p.id === pocketId) {
        return {
          ...p,
          balance: Math.round((p.balance - amount) * 100) / 100,
          spent: Math.round((p.spent + amount) * 100) / 100
        };
      }
      return p;
    }));

    const newTx = {
      id: `tx-${Date.now()}`,
      pocketId,
      pocketName: spendData.pocketName,
      amount,
      note,
      date,
      type: 'spend',
      category
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // 2. Split Money Allocation
  const handleConfirmSplit = ({ totalSplit, allocations, leftover }) => {
    setPockets(prev => prev.map(p => {
      const added = allocations[p.id] || 0;
      return {
        ...p,
        balance: Math.round((p.balance + added) * 100) / 100
      };
    }));

    // Adjust unallocated pool: if totalSplit was from unallocated, reduce by (totalSplit - leftover)
    setUnallocatedFunds(prev => {
      if (prev >= totalSplit) {
        return Math.round((prev - totalSplit + leftover) * 100) / 100;
      } else {
        return Math.round(leftover * 100) / 100;
      }
    });

    const newTx = {
      id: `tx-${Date.now()}`,
      pocketId: 'all',
      pocketName: 'Split Allocation',
      amount: totalSplit,
      note: `Split across ${Object.keys(allocations).length} pockets`,
      date: new Date().toISOString(),
      type: 'deposit',
      category: 'Allocation'
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // 3. Quick Top-Up a single pocket
  const handleQuickAdd = (pocket) => {
    // If we have unallocated funds, transfer from unallocated
    setTransferSourcePocket(null);
    setIsTransferOpen(true);
  };

  // 4. Transfer between pockets
  const handleConfirmTransfer = ({ fromId, toId, amount }) => {
    let fromName = 'Unallocated';
    let toName = 'Unallocated';

    // Update source
    if (fromId === 'unallocated') {
      setUnallocatedFunds(prev => Math.round((prev - amount) * 100) / 100);
    } else {
      setPockets(prev => prev.map(p => {
        if (p.id === fromId) {
          fromName = p.name;
          return { ...p, balance: Math.round((p.balance - amount) * 100) / 100 };
        }
        return p;
      }));
    }

    // Update destination
    if (toId === 'unallocated') {
      setUnallocatedFunds(prev => Math.round((prev + amount) * 100) / 100);
    } else {
      setPockets(prev => prev.map(p => {
        if (p.id === toId) {
          toName = p.name;
          return { ...p, balance: Math.round((p.balance + amount) * 100) / 100 };
        }
        return p;
      }));
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      pocketId: toId,
      pocketName: `${fromName} → ${toName}`,
      amount,
      note: `Moved between tiny wallets`,
      date: new Date().toISOString(),
      type: 'transfer',
      category: 'Transfer'
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // 5. Save or Create Pocket
  const handleSavePocket = (pocketData) => {
    if (pocketToEdit) {
      setPockets(prev => prev.map(p => p.id === pocketData.id ? { ...p, ...pocketData } : p));
    } else {
      setPockets(prev => [...prev, pocketData]);
    }
    setPocketToEdit(null);
  };

  // 6. Delete Pocket
  const handleDeletePocket = (id) => {
    const pocket = pockets.find(p => p.id === id);
    if (pocket && pocket.balance > 0) {
      setUnallocatedFunds(prev => Math.round((prev + pocket.balance) * 100) / 100);
    }
    setPockets(prev => prev.filter(p => p.id !== id));
    setPocketToEdit(null);
  };

  // 7. Undo / Delete Transaction
  const handleDeleteTransaction = (txId) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    if (tx.type === 'spend' && tx.pocketId) {
      // Revert spend: restore balance and decrease spent
      setPockets(prev => prev.map(p => {
        if (p.id === tx.pocketId) {
          return {
            ...p,
            balance: Math.round((p.balance + tx.amount) * 100) / 100,
            spent: Math.max(0, Math.round((p.spent - tx.amount) * 100) / 100)
          };
        }
        return p;
      }));
    }

    setTransactions(prev => prev.filter(t => t.id !== txId));
  };

  // 8. Quick Income Deposit
  const handleAddIncome = (e) => {
    e.preventDefault();
    const val = parseFloat(incomeAmount) || 0;
    if (val <= 0) return;

    sounds.playDeposit();
    triggerHaptic('success');

    setUnallocatedFunds(prev => Math.round((prev + val) * 100) / 100);

    const newTx = {
      id: `tx-${Date.now()}`,
      pocketId: 'unallocated',
      pocketName: 'Incoming Funds',
      amount: val,
      note: 'Added to Unallocated Pool',
      date: new Date().toISOString(),
      type: 'deposit',
      category: 'Income'
    };
    setTransactions(prev => [newTx, ...prev]);

    setIncomeAmount('');
    setIsIncomeModalOpen(false);
  };

  // 9. Reset and Export Data
  const handleResetData = () => {
    setPockets(INITIAL_POCKETS);
    setUnallocatedFunds(420.00);
    setTransactions(INITIAL_TRANSACTIONS);
    setCurrency('$');
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      pockets,
      unallocatedFunds,
      transactions,
      currency,
      exportedAt: new Date().toISOString()
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `pockets_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  // Calculations for top summary
  const totalInPockets = pockets.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
  const totalTargetBudget = pockets.reduce((sum, p) => sum + (Number(p.target) || 0), 0);
  const totalSpentAll = pockets.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);

  // Filtering pockets
  const filteredPockets = pockets.filter(p => {
    if (pocketFilter === 'all') return true;
    if (pocketFilter === 'needs') return p.category === 'Needs';
    if (pocketFilter === 'wants') return p.category === 'Wants';
    if (pocketFilter === 'savings') return p.category === 'Savings';
    if (pocketFilter === 'low') return (p.balance / p.target) <= 0.20 && p.balance >= 0;
    if (pocketFilter === 'overspent') return p.balance < 0;
    return true;
  });

  return (
    <div className={`app-root ${desktopFrameView ? 'mobile-mockup-mode' : ''}`}>
      {/* Top Desktop Helper Toolbar */}
      <div className="desktop-view-toggle-bar">
        <div className="view-toggle-left">
          <span className="pwa-dot-live" />
          <span className="view-title">Pockets PWA • Money Management</span>
        </div>
        <div className="view-toggle-right">
          <button 
            className={`view-mode-btn ${desktopFrameView ? 'active' : ''}`}
            onClick={() => setDesktopFrameView(!desktopFrameView)}
            title="Toggle between phone mockup and edge-to-edge view"
          >
            {desktopFrameView ? <Maximize2 size={14} /> : <Smartphone size={14} />}
            <span>{desktopFrameView ? 'Wide View' : 'Phone Frame'}</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Container */}
      <div className="mobile-shell">
        {/* Floating PWA Install Banner */}
        <PWAInstallBanner 
          deferredPrompt={deferredPrompt}
          isInstalled={isInstalled}
          onOpenInstallGuide={() => setActiveTab('settings')}
        />

        {/* Top Header */}
        <header className="app-top-header">
          <div className="brand-row">
            <div className="brand-logo-group">
              <div className="brand-icon-box">
                <img src="/favicon.svg" alt="Pockets Logo" className="brand-logo-img" />
              </div>
              <div>
                <h1 className="brand-app-name">Pockets</h1>
                <span className="brand-tagline">Tiny-Wallet Budgeting</span>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="header-btn-quick-split"
                onClick={() => { sounds.playTap(); triggerHaptic('light'); setIsSplitOpen(true); }}
                title="Split money across pockets"
              >
                <Sparkles size={16} />
                <span>Split Money</span>
              </button>

              <button 
                className="header-btn-add-pocket"
                onClick={() => { 
                  sounds.playTap(); 
                  triggerHaptic('light'); 
                  setPocketToEdit(null); 
                  setIsPocketModalOpen(true); 
                }}
                title="Create a new pocket"
                aria-label="Add Pocket"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Money Overview Widget */}
          <div className="overview-summary-card glass-panel">
            <div className="overview-main-metric">
              <span className="overview-label">Total in Pockets</span>
              <div className="overview-value-row">
                <span className="overview-amount num-mono">
                  {formatMoney(totalInPockets, currency)}
                </span>
                <span className="overview-target-tag num-mono">
                  Goal {formatMoney(totalTargetBudget, currency)}
                </span>
              </div>
            </div>

            {/* Unallocated / Ready to Assign Banner */}
            <div className="unallocated-strip">
              <div className="unallocated-left">
                <span className="unallocated-label">✨ Ready to Assign:</span>
                <strong className="unallocated-amount num-mono text-cyan">
                  {formatMoney(unallocatedFunds, currency)}
                </strong>
              </div>
              <div className="unallocated-right">
                <button 
                  className="unallocated-action-btn"
                  onClick={() => setIsIncomeModalOpen(true)}
                  title="Add fresh income/paycheck"
                >
                  <Plus size={14} />
                  <span>Add Funds</span>
                </button>
                <button 
                  className="unallocated-action-btn btn-split-accent"
                  onClick={() => setIsSplitOpen(true)}
                  title="Distribute ready money into pockets"
                >
                  <Sparkles size={14} />
                  <span>Distribute</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="app-main-content">
          {activeTab === 'pockets' && (
            <div className="pockets-tab-view animate-fade-in">
              {/* Pocket Filter Chips */}
              <div className="pocket-chips-filter">
                {[
                  { id: 'all', label: `All (${pockets.length})` },
                  { id: 'needs', label: 'Needs' },
                  { id: 'wants', label: 'Wants' },
                  { id: 'savings', label: 'Savings' },
                  { id: 'low', label: '⚠️ Running Low' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    className={`filter-chip-btn ${pocketFilter === chip.id ? 'active' : ''}`}
                    onClick={() => { sounds.playTap(); setPocketFilter(chip.id); }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Pocket Cards Grid */}
              <div className="pocket-cards-container">
                {filteredPockets.length === 0 ? (
                  <div className="empty-pockets-state glass-panel">
                    <span className="empty-emoji">👛</span>
                    <h3>No Pockets Matching Filter</h3>
                    <p>Adjust your filter or tap the '+' button above to create a new pocket!</p>
                  </div>
                ) : (
                  filteredPockets.map(pocket => (
                    <PocketCard
                      key={pocket.id}
                      pocket={pocket}
                      currency={currency}
                      onQuickSpend={(p) => {
                        setSpendPocket(p);
                        setIsSpendOpen(true);
                      }}
                      onQuickAdd={(p) => handleQuickAdd(p)}
                      onEdit={(p) => {
                        setPocketToEdit(p);
                        setIsPocketModalOpen(true);
                      }}
                      onTransfer={(p) => {
                        setTransferSourcePocket(p);
                        setIsTransferOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <PercentageRulesManager
              pockets={pockets}
              currency={currency}
              onUpdatePercentages={(updated) => setPockets(updated)}
              onOpenInsertMoney={() => setIsSplitOpen(true)}
              onAddNewPocket={() => {
                setPocketToEdit(null);
                setIsPocketModalOpen(true);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              pockets={pockets}
              unallocatedFunds={unallocatedFunds}
              transactions={transactions}
              currency={currency}
              onOpenSplit={() => setIsSplitOpen(true)}
            />
          )}

          {activeTab === 'activity' && (
            <TransactionsView
              transactions={transactions}
              pockets={pockets}
              currency={currency}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currency={currency}
              onCurrencyChange={setCurrency}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              hapticsEnabled={hapticsEnabled}
              onToggleHaptics={() => setHapticsEnabled(!hapticsEnabled)}
              cycleType={cycleType}
              onCycleTypeChange={setCycleType}
              onResetData={handleResetData}
              onExportData={handleExportData}
              deferredPrompt={deferredPrompt}
              isInstalled={isInstalled}
            />
          )}
        </main>

        {/* Global Floating Quick Spend FAB on mobile */}
        {activeTab === 'pockets' && (
          <button 
            className="floating-spend-fab animate-pulse-glow"
            onClick={() => {
              sounds.playTap();
              triggerHaptic('light');
              setSpendPocket(null);
              setIsSpendOpen(true);
            }}
            title="Log quick spending reduction"
            aria-label="Quick Spend"
          >
            <Minus size={22} />
            <span>Spend</span>
          </button>
        )}

        {/* Bottom App Navigation Bar (iOS / Android Style) */}
        <nav className="mobile-bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'pockets' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); triggerHaptic('light'); setActiveTab('pockets'); }}
          >
            <div className="nav-icon-wrapper">
              <Wallet size={19} />
            </div>
            <span>Pockets</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); triggerHaptic('light'); setActiveTab('rules'); }}
          >
            <div className="nav-icon-wrapper">
              <Percent size={19} />
            </div>
            <span>Split %</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); triggerHaptic('light'); setActiveTab('analytics'); }}
          >
            <div className="nav-icon-wrapper">
              <PieChart size={19} />
            </div>
            <span>Insights</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); triggerHaptic('light'); setActiveTab('activity'); }}
          >
            <div className="nav-icon-wrapper">
              <Clock size={19} />
            </div>
            <span>Activity</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); triggerHaptic('light'); setActiveTab('settings'); }}
          >
            <div className="nav-icon-wrapper">
              <SettingsIcon size={19} />
            </div>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* --- Modals --- */}

      {/* 1. Spend / Deduct Modal */}
      <SpendModal
        isOpen={isSpendOpen}
        onClose={() => setIsSpendOpen(false)}
        pockets={pockets}
        selectedPocket={spendPocket}
        currency={currency}
        onConfirmSpend={handleConfirmSpend}
      />

      {/* 2. Split Money Allocation Wizard */}
      <SplitMoneyModal
        isOpen={isSplitOpen}
        onClose={() => setIsSplitOpen(false)}
        pockets={pockets}
        unallocatedFunds={unallocatedFunds}
        currency={currency}
        onConfirmSplit={handleConfirmSplit}
      />

      {/* 3. Create / Edit Pocket Modal */}
      <PocketModal
        isOpen={isPocketModalOpen}
        onClose={() => setIsPocketModalOpen(false)}
        pocketToEdit={pocketToEdit}
        currency={currency}
        onSavePocket={handleSavePocket}
        onDeletePocket={handleDeletePocket}
      />

      {/* 4. Transfer Between Pockets Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        pockets={pockets}
        unallocatedFunds={unallocatedFunds}
        initialSourcePocket={transferSourcePocket}
        currency={currency}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* 5. Add Fresh Income / Paycheck Modal */}
      {isIncomeModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsIncomeModalOpen(false)}>
          <div 
            className="modal-container animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="modal-title">Deposit Funds / Paycheck</h2>
                <p className="modal-subtitle">Add money to your ready-to-assign pool</p>
              </div>
            </div>

            <form onSubmit={handleAddIncome} className="modal-form">
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
                {[500, 1000, 2000, 3000].map(val => (
                  <button
                    type="button"
                    key={val}
                    className="quick-chip-btn"
                    onClick={() => { sounds.playTap(); setIncomeAmount(val.toString()); }}
                  >
                    +{currency}{val}
                  </button>
                ))}
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
      )}
    </div>
  );
}
