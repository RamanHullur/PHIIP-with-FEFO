import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Item, Batch, Prediction } from '../types/inventory';
import { VerticalColumnChart, HorizontalBarList } from '../components/charts/Charts';
import { ExplainModal } from '../components/ai/ExplainModal';

interface ExpiryRiskPageProps {
  onSelectItem: (itemId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ExpiryRiskPage: React.FC<ExpiryRiskPageProps> = ({ onSelectItem, onNavigateTab }) => {
  const { items, batches, predictions, actions } = useInventory();

  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [explainTarget, setExplainTarget] = useState<{ item: Item; batch: Batch; pred: Prediction } | null>(null);

  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  // All risk prediction rows
  const riskRows = useMemo(() => {
    return batches
      .map(batch => {
        const item = itemMap.get(batch.itemId);
        const pred = predictions.get(batch.id);
        const action = actions.find(a => a.batchId === batch.id || a.itemId === batch.itemId);

        if (!item || !pred) return null;

        return {
          batch,
          item,
          pred,
          action,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.pred.riskScore - a.pred.riskScore);
  }, [batches, itemMap, predictions, actions]);

  const filteredRows = useMemo(() => {
    if (selectedRiskFilter === 'all') return riskRows;
    return riskRows.filter(r => r.pred.riskLevel === selectedRiskFilter);
  }, [riskRows, selectedRiskFilter]);

  // Top 10 Riskiest Batches
  const top10Risky = riskRows.slice(0, 10);

  // Expiry Timeline Buckets: <30d, 31-60d, 61-90d, 91-180d, >180d
  const timelineBuckets = useMemo(() => {
    let b30 = 0;
    let b60 = 0;
    let b90 = 0;
    let b180 = 0;
    let bMore = 0;

    let loss30 = 0;
    let loss60 = 0;
    let loss90 = 0;

    riskRows.forEach(r => {
      const d = r.pred.daysToExpiry;
      const loss = r.pred.potentialExpiryLoss;

      if (d <= 30) {
        b30 += r.batch.currentStock;
        loss30 += loss;
      } else if (d <= 60) {
        b60 += r.batch.currentStock;
        loss60 += loss;
      } else if (d <= 90) {
        b90 += r.batch.currentStock;
        loss90 += loss;
      } else if (d <= 180) {
        b180 += r.batch.currentStock;
      } else {
        bMore += r.batch.currentStock;
      }
    });

    return { b30, b60, b90, b180, bMore, loss30, loss60, loss90 };
  }, [riskRows]);

  // Risk Distribution Donut Data
  const riskDonutData = useMemo(() => {
    let crit = 0;
    let high = 0;
    let med = 0;
    let low = 0;

    riskRows.forEach(r => {
      if (r.pred.riskLevel === 'Critical') crit++;
      else if (r.pred.riskLevel === 'High') high++;
      else if (r.pred.riskLevel === 'Medium') med++;
      else low++;
    });

    return [
      { label: 'Critical', value: crit, color: '#e11d48' },
      { label: 'High', value: high, color: '#ea580c' },
      { label: 'Medium', value: med, color: '#ca8a04' },
      { label: 'Low', value: low, color: '#10b981' },
    ];
  }, [riskRows]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Methodology Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-rose-600" />
              Will Expire Before Use
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              PoC Prediction Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Transparent algorithmic prediction forecasting whether on-hand stock will exceed expected clinical consumption before expiry.
            Formula: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">forecastConsumptionBeforeExpiry = avgDailyRate × daysToExpiry</code>.
            If <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">currentStock - forecastConsumption &gt; safetyStock</code>, inventory is flagged as <strong>WILL LIKELY EXPIRE BEFORE USE</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('whatif')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition"
          >
            What-If Simulator <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Shelf-Life Timeline Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-xs">
          <div className="text-rose-600 font-bold uppercase text-[10px] tracking-wider">&le; 30 Days (Critical)</div>
          <div className="text-lg font-bold text-rose-800 font-mono mt-0.5">{timelineBuckets.b30.toLocaleString()} units</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">${timelineBuckets.loss30.toLocaleString()} at risk</div>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs">
          <div className="text-amber-700 font-bold uppercase text-[10px] tracking-wider">31–60 Days (Near)</div>
          <div className="text-lg font-bold text-amber-800 font-mono mt-0.5">{timelineBuckets.b60.toLocaleString()} units</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">${timelineBuckets.loss60.toLocaleString()} at risk</div>
        </div>

        <div className="bg-yellow-50/70 p-3.5 rounded-xl border border-yellow-200 text-xs">
          <div className="text-yellow-800 font-bold uppercase text-[10px] tracking-wider">61–90 Days (Medium)</div>
          <div className="text-lg font-bold text-yellow-900 font-mono mt-0.5">{timelineBuckets.b90.toLocaleString()} units</div>
          <div className="text-[11px] text-yellow-700 font-medium mt-1">Active monitoring</div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">91–180 Days</div>
          <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">{timelineBuckets.b180.toLocaleString()} units</div>
          <div className="text-[11px] text-slate-400 mt-1">Sufficient runway</div>
        </div>

        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 text-xs">
          <div className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider">&gt; 180 Days (Long)</div>
          <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">{timelineBuckets.bMore.toLocaleString()} units</div>
          <div className="text-[11px] text-emerald-600 mt-1">Stable shelf life</div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution (Vertical Column Bars ONLY) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Risk Level Classification
            </h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown across 0–100 risk score bands</p>
          </div>
          <div className="py-2">
            <VerticalColumnChart data={riskDonutData} valuePrefix="" />
          </div>
        </div>

        {/* Top 5 Capital Losses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Top 5 Financial Exposure Batches
            </h3>
            <p className="text-xs text-slate-500 mb-4">Calculated Potential Loss = Potential Excess × Unit Cost</p>
          </div>
          <HorizontalBarList
            items={top10Risky.slice(0, 5).map(r => ({
              label: r.item.name,
              subLabel: `${r.batch.batchNumber} • ${r.pred.daysToExpiry}d`,
              value: r.pred.potentialExpiryLoss,
              color: r.pred.riskLevel === 'Critical' ? '#e11d48' : '#ea580c',
              valueFormat: (v: number) => `$${v.toLocaleString()}`,
            }))}
          />
        </div>
      </div>

      {/* Proposal Highlight Benchmark Section: Will Expire Before Use Benchmark Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Expiry Prediction &amp; Potential Excess Register
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic calculations comparing physical stock vs forecast consumption before shelf-life milestone
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Risk:</span>
            <select
              value={selectedRiskFilter}
              onChange={e => setSelectedRiskFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium focus:outline-hidden"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical (81–100)</option>
              <option value="High">High (61–80)</option>
              <option value="Medium">Medium (31–60)</option>
              <option value="Low">Low (0–30)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Batch Lot</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-right">Days to Expiry</th>
                <th className="py-3 px-3 text-right">Daily Rate</th>
                <th className="py-3 px-3 text-right">Forecast Usage</th>
                <th className="py-3 px-3 text-right">Potential Excess</th>
                <th className="py-3 px-3 text-right">Potential Loss ($)</th>
                <th className="py-3 px-3 text-center">Prediction Classification</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredRows.map(({ batch, item, pred, action }) => {
                const isCritical = pred.riskLevel === 'Critical';
                const isWillExpire = pred.willExpireBeforeUse === 'WILL LIKELY EXPIRE BEFORE USE';

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectItem(item.id)}
                        className="font-bold text-indigo-600 hover:underline text-left block"
                      >
                        {item.name}
                      </button>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">{batch.batchNumber}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {batch.currentStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={pred.daysToExpiry <= 30 ? 'text-rose-600' : 'text-slate-800'}>
                        {pred.daysToExpiry <= 0 ? 'EXPIRED' : `${pred.daysToExpiry}d`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {pred.breakdown.consumptionVelocityDaily}/d
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {pred.forecastConsumption.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={pred.potentialExcess > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {pred.potentialExcess.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ${pred.potentialExpiryLoss.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          isWillExpire
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {pred.willExpireBeforeUse}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setExplainTarget({ item, batch, pred })}
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer hover:shadow-xs transition ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : pred.riskLevel === 'High'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {pred.riskScore}/100 ({pred.riskLevel})
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setExplainTarget({ item, batch, pred })}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold p-1 rounded hover:bg-indigo-50 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Explain
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {explainTarget && (
        <ExplainModal
          isOpen={Boolean(explainTarget)}
          onClose={() => setExplainTarget(null)}
          item={explainTarget.item}
          batch={explainTarget.batch}
          prediction={explainTarget.pred}
        />
      )}
    </div>
  );
};
