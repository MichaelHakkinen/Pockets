import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PieChart, 
  Clock, 
  Settings as SettingsIcon, 
  Plus, 
  Minus,
  Sliders,
  Smartphone,
  Maximize2,
  Percent
} from 'lucide-react';

import {
  INITIAL_POCKETS,
  INITIAL_TRANSACTIONS,
  loadSavedState,
  saveState,
  sanitizeState,
  newId,
  formatMoney
} from './utils/storage';
import { sounds, haptics, triggerHaptic } from './utils/audio';
import { useCloudSync } from './hooks/useCloudSync';

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
import CurrencyModal from './components/CurrencyModal';
import IncomeModal from './components/IncomeModal';
import { getCurrencyConfig } from './utils/currencies';
import appLogo from './assets/logo.svg';

import './App.css';

export default function App() {
  // --- Persistent State ---
  const [saved] = useState(loadSavedState);

  const [pockets, setPockets] = useState(saved?.pockets || INITIAL_POCKETS);
  const [unallocatedFunds, setUnallocatedFunds] = useState(saved?.unallocatedFunds ?? 0);
  const [transactions, setTransactions] = useState(saved?.transactions || INITIAL_TRANSACTIONS);
  const [currency, setCurrency] = useState(saved?.currency || '$');
  const [soundEnabled, setSoundEnabled] = useState(saved?.soundEnabled ?? true);
  const [hapticsEnabled, setHapticsEnabled] = useState(saved?.hapticsEnabled ?? true);
  const [cycleType, setCycleType] = useState(saved?.cycleType || 'Monthly');

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

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Quick Income Deposit Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');


  // --- PWA State ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );

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
    haptics.enabled = hapticsEnabled;
  }, [pockets, unallocatedFunds, transactions, currency, soundEnabled, hapticsEnabled, cycleType]);

  // Sync with Firestore while signed in (cloud copy wins on a fresh sign-in)
  useCloudSync(
    { pockets, unallocatedFunds, transactions, currency, soundEnabled, hapticsEnabled, cycleType },
    (remote) => {
      if (remote.pockets) setPockets(remote.pockets);
      if (remote.transactions) setTransactions(remote.transactions);
      if (remote.unallocatedFunds !== undefined) setUnallocatedFunds(remote.unallocatedFunds);
      if (remote.currency) setCurrency(remote.currency);
      if (remote.soundEnabled !== undefined) setSoundEnabled(remote.soundEnabled);
      if (remote.hapticsEnabled !== undefined) setHapticsEnabled(remote.hapticsEnabled);
      if (remote.cycleType) setCycleType(remote.cycleType);
    }
  );

  // PWA beforeinstallprompt and standalone check
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // --- Handlers ---

  const round2 = (n) => Math.round(n * 100) / 100;

  // Adds `delta` (may be negative) to a pocket, or to the unallocated pool.
  // Silently skips pockets that no longer exist.
  const applyMoneyMove = (id, delta) => {
    if (id === 'unallocated') {
      setUnallocatedFunds(prev => round2(prev + delta));
    } else {
      setPockets(prev => prev.map(p => (p.id === id ? { ...p, balance: round2(p.balance + delta) } : p)));
    }
  };

  // 1. Spend / Deduct from Pocket
  const handleConfirmSpend = (spendData) => {
    const { pocketId, amount, note, date, category } = spendData;

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
      id: newId('tx'),
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
  const handleConfirmSplit = ({ totalSplit, allocations, leftover, updatedPercentages }) => {
    setPockets(prev => prev.map(p => {
      const added = allocations[p.id] || 0;
      const newPct = (updatedPercentages && typeof updatedPercentages[p.id] === 'number')
        ? updatedPercentages[p.id]
        : p.percentage;
      return {
        ...p,
        percentage: newPct,
        balance: Math.round((p.balance + added) * 100) / 100
      };
    }));

    // The split draws on the unallocated pool first; anything beyond the pool is
    // treated as fresh money. Whatever the sliders leave unassigned stays in the pool.
    const fromPool = Math.min(Math.max(unallocatedFunds, 0), totalSplit);
    setUnallocatedFunds(prev => Math.round((Math.max(prev, 0) - fromPool + leftover) * 100) / 100);

    const newTx = {
      id: newId('tx'),
      pocketId: 'all',
      pocketName: 'Split Allocation',
      amount: totalSplit,
      note: `Split across ${Object.keys(allocations).length} pockets`,
      date: new Date().toISOString(),
      type: 'deposit',
      category: 'Allocation',
      // Kept so the split can be undone from the Activity tab
      allocations,
      fromPool,
      leftover
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // 3. Quick Top-Up a single pocket
  const handleQuickAdd = () => {
    setTransferSourcePocket(null);
    setIsTransferOpen(true);
  };

  // 4. Transfer between pockets
  const handleConfirmTransfer = ({ fromId, toId, amount }) => {
    const nameOf = (id) => (id === 'unallocated' ? 'Unallocated' : pockets.find(p => p.id === id)?.name || 'Unknown');

    applyMoneyMove(fromId, -amount);
    applyMoneyMove(toId, amount);

    const newTx = {
      id: newId('tx'),
      pocketId: toId,
      pocketName: `${nameOf(fromId)} → ${nameOf(toId)}`,
      amount,
      note: `Moved between tiny wallets`,
      date: new Date().toISOString(),
      type: 'transfer',
      category: 'Transfer',
      fromId,
      toId
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
            balance: round2(p.balance + tx.amount),
            spent: Math.max(0, round2(p.spent - tx.amount))
          };
        }
        return p;
      }));
    } else if (tx.type === 'transfer' && tx.fromId && tx.toId) {
      applyMoneyMove(tx.toId, -tx.amount);
      applyMoneyMove(tx.fromId, tx.amount);
    } else if (tx.type === 'deposit' && tx.category === 'Income') {
      applyMoneyMove('unallocated', -tx.amount);
    } else if (tx.type === 'deposit' && tx.allocations) {
      // Revert a split: take the money back out of the pockets and restore the pool
      Object.entries(tx.allocations).forEach(([pocketId, added]) => applyMoneyMove(pocketId, -added));
      setUnallocatedFunds(prev => round2(prev - (tx.leftover || 0) + (tx.fromPool || 0)));
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
      id: newId('tx'),
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
    setUnallocatedFunds(0);
    setTransactions(INITIAL_TRANSACTIONS);
    setCurrency('$');
    setCycleType('Monthly');
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify({
      pockets,
      unallocatedFunds,
      transactions,
      currency,
      cycleType,
      exportedAt: new Date().toISOString()
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `pockets_backup_${new Date().toISOString().slice(0, 10)}.json`;
    dlAnchor.click();
    URL.revokeObjectURL(url);
  };

  // Returns true if the file was a usable backup and has been applied
  const handleImportData = async (file) => {
    try {
      const data = sanitizeState(JSON.parse(await file.text()));
      if (!data || !data.pockets) return false;
      setPockets(data.pockets);
      setUnallocatedFunds(data.unallocatedFunds ?? 0);
      setTransactions(data.transactions || []);
      if (data.currency) setCurrency(data.currency);
      if (data.cycleType) setCycleType(data.cycleType);
      return true;
    } catch {
      return false;
    }
  };


  // Calculations for top summary
  const totalInPockets = pockets.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
  const totalTargetBudget = pockets.reduce((sum, p) => sum + (Number(p.target) || 0), 0);

  // Currency configuration
  const currConfig = getCurrencyConfig(currency);

  // Filtering pockets
  const filteredPockets = pockets.filter(p => {
    if (pocketFilter === 'all') return true;
    if (pocketFilter === 'needs') return p.category === 'Needs';
    if (pocketFilter === 'wants') return p.category === 'Wants';
    if (pocketFilter === 'savings') return p.category === 'Savings';
    if (pocketFilter === 'low') return p.target > 0 && (p.balance / p.target) <= 0.20 && p.balance >= 0;
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
                <img src={appLogo} alt="Pockets Logo" className="brand-logo-img" />
              </div>
              <div>
                <h1 className="brand-app-name">Pockets</h1>
                <span className="brand-tagline">Tiny-Wallet Budgeting</span>
              </div>
            </div>

            <div className="header-actions">
              {/* Quick Currency Switcher Pill */}
              <button 
                className="header-currency-pill-btn"
                onClick={() => { sounds.playTap(); triggerHaptic('light'); setIsCurrencyModalOpen(true); }}
                title={`Currency: ${currency} (${currConfig.name}). Click to switch`}
              >
                <span className="pill-flag">{currConfig.flag}</span>
                <span className="pill-curr-code num-mono">{currency}</span>
              </button>



              <button 
                className="header-btn-quick-split"
                onClick={() => { sounds.playTap(); triggerHaptic('light'); setIsSplitOpen(true); }}
                title="Distribute money across pockets"
              >
                <Sliders size={14} />
                <span>Distribute</span>
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
                <Plus size={18} />
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
                <span className="unallocated-label">Ready to Assign:</span>
                <strong className="unallocated-amount num-mono text-cool">
                  {formatMoney(unallocatedFunds, currency)}
                </strong>
              </div>
              <div className="unallocated-right">
                <button 
                  className="unallocated-action-btn"
                  onClick={() => setIsIncomeModalOpen(true)}
                  title="Add fresh funds"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
                <button 
                  className="unallocated-action-btn btn-split-accent"
                  onClick={() => setIsSplitOpen(true)}
                  title="Distribute ready money into pockets"
                >
                  <Sliders size={13} />
                  <span>Split</span>
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
                      onQuickAdd={handleQuickAdd}
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
              currency={currency}
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
              onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              hapticsEnabled={hapticsEnabled}
              onToggleHaptics={() => setHapticsEnabled(!hapticsEnabled)}
              onResetData={handleResetData}
              onExportData={handleExportData}
              onImportData={handleImportData}
              deferredPrompt={deferredPrompt}
              isInstalled={isInstalled}
            />
          )}
        </main>

        {/* Global Floating Quick Spend FAB on mobile */}
        {activeTab === 'pockets' && (
          <button 
            className="floating-spend-fab"
            onClick={() => {
              sounds.playTap();
              triggerHaptic('light');
              setSpendPocket(null);
              setIsSpendOpen(true);
            }}
            title="Log quick spending reduction"
            aria-label="Quick Spend"
          >
            <Minus size={18} />
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
        key={isSpendOpen ? `open-${spendPocket?.id ?? 'any'}` : 'closed'}
        isOpen={isSpendOpen}
        onClose={() => setIsSpendOpen(false)}
        pockets={pockets}
        selectedPocket={spendPocket}
        currency={currency}
        onConfirmSpend={handleConfirmSpend}
      />

      {/* 2. Split Money Allocation Wizard */}
      <SplitMoneyModal
        key={isSplitOpen ? 'open' : 'closed'}
        isOpen={isSplitOpen}
        onClose={() => setIsSplitOpen(false)}
        pockets={pockets}
        unallocatedFunds={unallocatedFunds}
        currency={currency}
        onConfirmSplit={handleConfirmSplit}
      />

      {/* 3. Create / Edit Pocket Modal */}
      <PocketModal
        key={isPocketModalOpen ? `open-${pocketToEdit?.id ?? 'new'}` : 'closed'}
        isOpen={isPocketModalOpen}
        onClose={() => setIsPocketModalOpen(false)}
        pocketToEdit={pocketToEdit}
        currency={currency}
        onSavePocket={handleSavePocket}
        onDeletePocket={handleDeletePocket}
        existingPockets={pockets}
      />

      {/* 4. Transfer Between Pockets Modal */}
      <TransferModal
        key={isTransferOpen ? `open-${transferSourcePocket?.id ?? 'pool'}` : 'closed'}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        pockets={pockets}
        unallocatedFunds={unallocatedFunds}
        initialSourcePocket={transferSourcePocket}
        currency={currency}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* 5. Add Fresh Income / Paycheck Modal */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        currency={currency}
        currConfig={currConfig}
        incomeAmount={incomeAmount}
        setIncomeAmount={setIncomeAmount}
        onAddIncome={handleAddIncome}
      />

      {/* 6. Dedicated Currency Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        currentCurrency={currency}
        onSelectCurrency={setCurrency}
      />
    </div>
  );
}
