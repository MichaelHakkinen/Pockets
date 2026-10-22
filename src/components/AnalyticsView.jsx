import React from 'react';
import {
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { POCKET_COLORS, formatMoney } from '../utils/storage';

export default function AnalyticsView({
  pockets,
  unallocatedFunds,
  currency
}) {
  const totalBalance = pockets.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
  const totalSpent = pockets.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);

  // Health Score calculation (0 to 100)
  // Penalize overspent pockets and pockets with critical low balance (<15%)
  let healthyPocketsCount = 0;
  let overspentCount = 0;
  let tightCount = 0;

  pockets.forEach(p => {
    const bal = Number(p.balance) || 0;
    const tgt = Number(p.target) || 1;
    const pct = (bal / tgt) * 100;
    if (bal < 0) overspentCount++;
    else if (pct <= 20) tightCount++;
    else healthyPocketsCount++;
  });

  const healthScore = pockets.length > 0 
    ? Math.max(10, Math.min(100, Math.round(((healthyPocketsCount + (tightCount * 0.5)) / pockets.length) * 100)))
    : 100;

  // Category aggregations
  const categoryStats = {
    Needs: { target: 0, spent: 0, balance: 0, color: '#10b981' },
    Wants: { target: 0, spent: 0, balance: 0, color: '#f59e0b' },
    Savings: { target: 0, spent: 0, balance: 0, color: '#6366f1' },
    Other: { target: 0, spent: 0, balance: 0, color: '#06b6d4' }
  };

  pockets.forEach(p => {
    const cat = categoryStats[p.category] ? p.category : 'Other';
    categoryStats[cat].target += Number(p.target) || 0;
    categoryStats[cat].spent += Number(p.spent) || 0;
    categoryStats[cat].balance += Number(p.balance) || 0;
  });

  // Calculate dynamic advice
  let advice = "Your pockets are healthy and well-funded! Keep sticking to your envelopes.";
  if (overspentCount > 0) {
    advice = `You have ${overspentCount} overspent pocket(s). Tap 'Split Money' or 'Transfer' to re-balance from your surplus.`;
  } else if (tightCount > 0) {
    advice = `${tightCount} pocket(s) are below 20% remaining balance. Pace your daily spend to make it through the cycle!`;
  }

  return (
    <div className="analytics-view animate-fade-in">
      {/* Top Banner KPI */}
      <div className="analytics-hero-card glass-panel">
        <div className="hero-kpi-row">
          <div className="hero-kpi-item">
            <span className="kpi-label">Total in Pockets</span>
            <span className="kpi-val num-mono text-emerald">{formatMoney(totalBalance, currency)}</span>
          </div>
          <div className="hero-kpi-item">
            <span className="kpi-label">Unallocated</span>
            <span className="kpi-val num-mono text-cyan">{formatMoney(unallocatedFunds, currency)}</span>
          </div>
          <div className="hero-kpi-item">
            <span className="kpi-label">Cycle Spent</span>
            <span className="kpi-val num-mono text-rose">{formatMoney(totalSpent, currency)}</span>
          </div>
        </div>

        {/* Health Gauge */}
        <div className="health-gauge-box">
          <div className="health-gauge-header">
            <div className="health-title-group">
              <ShieldCheck size={18} color="#10b981" />
              <span>Envelope Budget Health</span>
            </div>
            <span className="health-score-pill num-mono">{healthScore}%</span>
          </div>

          <div className="health-track">
            <div 
              className="health-fill" 
              style={{ 
                width: `${healthScore}%`,
                background: healthScore > 75 
                  ? 'linear-gradient(90deg, #10b981, #34d399)' 
                  : healthScore > 40 
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                    : 'linear-gradient(90deg, #f43f5e, #fb7185)'
              }}
            />
          </div>

          <p className="health-advice-tip">
            <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#fbbf24' }} />
            {advice}
          </p>
        </div>
      </div>

      {/* Category Breakdown (Needs, Wants, Savings) */}
      <div className="section-block">
        <h3 className="section-title">Budget Categories</h3>
        <div className="category-cards-grid">
          {Object.entries(categoryStats).map(([catName, data]) => {
            if (data.target === 0 && data.balance === 0) return null;
            const pctUsed = data.target > 0 ? Math.min(100, Math.round((data.spent / data.target) * 100)) : 0;
            return (
              <div key={catName} className="cat-breakdown-card glass-panel">
                <div className="cat-card-header">
                  <div className="cat-indicator-dot" style={{ background: data.color }} />
                  <span className="cat-card-name">{catName}</span>
                  <span className="cat-used-pct num-mono">{pctUsed}% spent</span>
                </div>
                <div className="cat-bar-track">
                  <div 
                    className="cat-bar-fill"
                    style={{ width: `${pctUsed}%`, background: data.color }}
                  />
                </div>
                <div className="cat-numbers-row">
                  <span>Bal: <strong className="num-mono">{formatMoney(data.balance, currency)}</strong></span>
                  <span>Goal: <strong className="num-mono">{formatMoney(data.target, currency)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pocket Utilization List */}
      <div className="section-block">
        <div className="section-header-row">
          <h3 className="section-title">Pocket-by-Pocket Status</h3>
          <span className="section-subtext">{pockets.length} Tiny Wallets</span>
        </div>

        <div className="pocket-analytics-list">
          {pockets.map(p => {
            const colorDef = POCKET_COLORS.find(c => c.id === p.color) || POCKET_COLORS[0];
            const target = Number(p.target) || 1;
            const bal = Number(p.balance) || 0;
            const spent = Number(p.spent) || 0;
            const pct = Math.max(0, Math.min(100, Math.round((bal / target) * 100)));
            const isNeg = bal < 0;

            return (
              <div key={p.id} className="pocket-analytic-item glass-panel">
                <div className="p-item-left">
                  <span className="p-item-emoji">{p.emoji}</span>
                  <div className="p-item-meta">
                    <span className="p-item-title">{p.name}</span>
                    <span className="p-item-spent-sub">
                      Spent {formatMoney(spent, currency)} of {formatMoney(target, currency)}
                    </span>
                  </div>
                </div>

                <div className="p-item-right">
                  <span className={`p-item-remaining num-mono ${isNeg ? 'text-danger' : 'text-emerald'}`}>
                    {formatMoney(bal, currency)}
                  </span>
                  <div className="p-mini-meter">
                    <div 
                      className="p-mini-fill" 
                      style={{ 
                        width: `${isNeg ? 100 : pct}%`,
                        background: isNeg ? '#f43f5e' : colorDef.bg 
                      }} 
                    />
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
