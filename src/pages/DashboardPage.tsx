import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowRightLeft,
  Sparkles,
  PlayCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { DonutChart, HorizontalBarList } from '../components/charts/Charts';
import { getDailyIntelligenceBrief } from '../services/ai/geminiClient';
import { ExplainModal } from '../components/ai/ExplainModal';

interface DashboardPageProps {
  onNavigate: (tab: string, filter?: any) => void;
  onSelectItem: (itemId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectItem }) => {
  const {
    stats,
    items,
    batches,
    predictions,
    transfers,
    procurements,
    actions,
    runCeftriaxoneDemoScenario,
  } = useInventory();

  const [dailyBrief, setDailyBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [explainItem, setExplainItem] = useState<{ item: any; batch: any; pred: any } | null>(null);

  const handleFetchBrief = async () => {
    setBriefLoading(true);
    const topRisks = batches
      .map(b => {
        const p = predictions.get(b.id);
        const item = items.find(i => i.id === b.itemId);
        return {
          itemName: item?.name || 'Unknown',
          batchNumber: b.batchNumber,
          potentialExcess: p?.potentialExcess || 0,
          daysToExpiry: p?.daysToExpiry || 0,
          riskScore: p?.riskScore || 0,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    const brief = await getDailyIntelligenceBrief(stats, topRisks, transfers.slice(0, 3), procurements.slice(0, 3));
    setDailyBrief(brief);
    setBriefLoading(false);
  };

  // Category breakdown for Donut Chart
  const categoryValues = React.useMemo(() => {
    const map = new Map<string, number>();
    batches.forEach(b => {
      const item = items.find(i => i.id === b.itemId);
      if (!item) return;
      const val = b.currentStock * item.unitCost;
      map.set(item.category, (map.get(item.category) || 0) + val);
    });

    const colors: Record<string, string> = {
      Antibiotics: '#4f46e5',
      'Critical Care': '#dc2626',
      Analgesics: '#0891b2',
      'IV Fluids': '#059669',
      'Consumables & Surgical': '#d97706',
      Oncology: '#7c3aed',
      'Laboratory & Reagents': '#db2777',
    };

    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
      color: colors[label] || '#64748b',
    }));
  }, [batches, items]);

  // Risk breakdown for Donut Chart
  const riskDistribution = React.useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;
    let crit = 0;

    batches.forEach(b => {
      const p = predictions.get(b.id);
      if (!p) return;
      if (p.riskLevel === 'Critical') crit++;
      else if (p.riskLevel === 'High') high++;
      else if (p.riskLevel === 'Medium') med++;
      else low++;
    });

    return [
      { label: 'Critical (81-100)', value: crit, color: '#e11d48' },
      { label: 'High (61-80)', value: high, color: '#ea580c' },
      { label: 'Medium (31-60)', value: med, color: '#ca8a04' },
      { label: 'Low (0-30)', value: low, color: '#10b981' },
    ];
  }, [batches, predictions]);

  // Top Highest Loss Batches
  const topLossBatches = React.useMemo(() => {
    return batches
      .map(b => {
        const item = items.find(i => i.id === b.itemId);
        const pred = predictions.get(b.id);
        return {
          batch: b,
          item,
          pred,
          loss: pred?.potentialExpiryLoss || 0,
        };
      })
      .filter(x => x.loss > 0)
      .sort((a, b) => b.loss - a.loss)
      .slice(0, 6)
      .map(x => ({
        label: x.item?.name || 'Unknown',
        subLabel: `${x.batch.batchNumber} • ${x.pred?.daysToExpiry}d left`,
        value: x.loss,
        color: '#e11d48',
        valueFormat: (v: number) => `$${v.toLocaleString()}`,
      }));
  }, [batches, items, predictions]);

  // Top critical items for action table
  const criticalItems = batches
    .map(b => ({
      batch: b,
      item: items.find(i => i.id === b.itemId)!,
      pred: predictions.get(b.id)!,
      action: actions.find(a => a.batchId === b.id || a.itemId === b.itemId),
    }))
    .filter(x => x.item && x.pred && (x.pred.riskLevel === 'Critical' || x.pred.daysToExpiry <= 30))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Benchmark Demo Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
              Benchmark Proposal Demo
            </span>
            <span className="text-xs text-slate-300">Ceftriaxone Expiry & Transfer Scenario</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Predict the expiry. Consume the right batch. Prevent waste.
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Watch how 5,000 units of Ceftriaxone expiring in 45 days generate a Critical Risk score of 87/100, identify 2,750 units of excess, and automatically recommend FEFO prioritize-consumption and inter-hospital rebalancing.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              runCeftriaxoneDemoScenario();
              onNavigate('expiry');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition transform active:scale-98"
          >
            <PlayCircle className="w-4 h-4" />
            Run Ceftriaxone Scenario
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Clickable Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Total Inventory Value</span>
            <Boxes className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            ${stats.totalInventoryValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalSKUs} SKUs • {stats.totalBatches} active lots
          </div>
        </div>

        {/* 2. Critical Expiry Items */}
        <div
          onClick={() => onNavigate('expiry', { riskFilter: 'Critical' })}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs hover:border-rose-400 hover:shadow-xs transition cursor-pointer group bg-rose-50/20"
        >
          <div className="flex items-center justify-between text-rose-600 text-xs mb-1">
            <span className="font-semibold">Critical Expiry Lots</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-bold text-rose-700 font-mono">
            {stats.criticalExpiryItems} Batches
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Score ≥ 81/100 • Urgent action required
          </div>
        </div>

        {/* 3. Potential Expiry Loss */}
        <div
          onClick={() => onNavigate('expiry')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-400 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Potential Expiry Loss</span>
            <DollarSign className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-bold text-amber-700 font-mono">
            ${stats.potentialExpiryLoss.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unused stock before expiry date
          </div>
        </div>

        {/* 4. FEFO Compliance */}
        <div
          onClick={() => onNavigate('fefo')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">FEFO Compliance</span>
            <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {stats.fefoComplianceRate}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Earliest-first dispense sequence
          </div>
        </div>

        {/* 5. Potential Savings */}
        <div
          onClick={() => onNavigate('transfers')}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer group bg-blue-50/20"
        >
          <div className="flex items-center justify-between text-blue-600 text-xs mb-1">
            <span className="font-semibold">Potential Savings</span>
            <TrendingUp className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-bold text-blue-800 font-mono">
            ${stats.potentialSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            Via transfer & procurement holds
          </div>
        </div>
      </div>

      {/* Secondary KPI Bar: Near Expiry, Expired, Stock-out */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => onNavigate('inventory', { filter: 'nearExpiry' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition"
        >
          <div>
            <div className="text-slate-500 font-medium">Near-Expiry Batches (&lt;60 Days)</div>
            <div className="text-base font-bold text-slate-800 mt-0.5">{stats.nearExpiryItems} Lots</div>
          </div>
          <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1">
            Review <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('inventory', { filter: 'quarantined' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition"
        >
          <div>
            <div className="text-slate-500 font-medium">Quarantined / Expired Batches</div>
            <div className="text-base font-bold text-rose-600 mt-0.5">{stats.expiredItems} Lots</div>
          </div>
          <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
            Disposal <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('procurement')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition"
        >
          <div>
            <div className="text-slate-500 font-medium">Stock-Out Buffer Risk</div>
            <div className="text-base font-bold text-amber-600 mt-0.5">{stats.stockOutRiskCount} SKUs</div>
          </div>
          <span className="text-amber-600 text-xs font-semibold flex items-center gap-1">
            Reorder <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Charts Section: 3-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Inventory by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Inventory Value by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">Capital distribution across therapeutic classes</p>
          </div>
          <DonutChart data={categoryValues} size={190} strokeWidth={24} centerSub="Total Capital" />
        </div>

        {/* Chart 2: Expiry Risk Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Expiry Risk Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Risk score categorization across 0–100 scale</p>
          </div>
          <DonutChart data={riskDistribution} size={190} strokeWidth={24} centerSub="Monitored Lots" />
        </div>

        {/* Chart 3: Top Expiry Loss Exposures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Top Expiry Loss Exposures
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Top 6 At-Risk Lots
                </span>
              </div>
              <p className="text-xs text-slate-500">Batches with highest financial waste risk if unused</p>
            </div>

            {/* Loss Exposure Summary Card to fill space purposefully */}
            <div className="bg-gradient-to-r from-rose-50 to-amber-50/50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Total Loss Exposure
                </div>
                <div className="text-lg font-black text-rose-800 font-mono">
                  ${stats.potentialExpiryLoss.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md inline-block">
                  {stats.criticalExpiryItems} Critical Lots
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">Prioritize FEFO dispatch</div>
              </div>
            </div>

            <HorizontalBarList items={topLossBatches} />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
            <span className="text-[11px] text-slate-400">Strict FEFO enforcement recommended</span>
            <button
              onClick={() => onNavigate('expiry')}
              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer transition text-xs"
            >
              <span>Inspect All Risks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Daily Intelligence Brief Card */}
      <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily Inventory Intelligence Brief</h2>
              <p className="text-xs text-slate-500">
                Automated executive synthesis generated with Google Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <button
            onClick={handleFetchBrief}
            disabled={briefLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition shadow-2xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {briefLoading ? 'Generating Brief...' : dailyBrief ? 'Refresh Brief' : 'Generate Daily Brief'}
          </button>
        </div>

        {dailyBrief ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
            {dailyBrief}
          </div>
        ) : (
          <div className="p-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Click <strong>Generate Daily Brief</strong> to produce a natural-language executive report covering critical batches, capital at risk, and top 3 priorities for today.
          </div>
        )}
      </div>

      {/* Critical Expiry Items Requiring Immediate Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Critical Batches Requiring Decision Support
            </h2>
            <p className="text-xs text-slate-500">Immediate action needed to mitigate financial and clinical loss</p>
          </div>
          <button
            onClick={() => onNavigate('expiry')}
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            View All Expiry Risks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Item & SKU</th>
                <th className="py-2.5 px-3">Batch Lot</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Forecast Usage</th>
                <th className="py-2.5 px-3 text-right">Potential Excess</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Risk Score</th>
                <th className="py-2.5 px-3">Recommended Action</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalItems.map(({ batch, item, pred, action }) => (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectItem(item.id)}
                      className="font-bold text-indigo-600 hover:underline text-left block"
                    >
                      {item.name}
                    </button>
                    <span className="text-[10px] text-slate-400">{item.category} • {item.code}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">{batch.batchNumber}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{batch.expiryDate}</div>
                    <span className={`text-[10px] ${pred.daysToExpiry <= 30 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      {pred.daysToExpiry <= 0 ? 'EXPIRED' : `${pred.daysToExpiry} days left`}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    {batch.currentStock.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                    {pred.forecastConsumption.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                    {pred.potentialExcess.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap align-middle">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap border shadow-2xs ${
                        pred.riskScore >= 81
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : pred.riskScore >= 61
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <span className="font-mono">{pred.riskScore}/100</span>
                      <span className="text-[10px] font-semibold">({pred.riskLevel})</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 min-w-[180px]">
                    {action ? (
                      <div>
                        <span className="font-semibold text-slate-800 text-[11px] block">
                          {action.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{action.reason}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">PRIORITIZE CONSUMPTION</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setExplainItem({ item, batch, pred })}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Why Critical?
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {explainItem && (
        <ExplainModal
          isOpen={Boolean(explainItem)}
          onClose={() => setExplainItem(null)}
          item={explainItem.item}
          batch={explainItem.batch}
          prediction={explainItem.pred}
        />
      )}
    </div>
  );
};
