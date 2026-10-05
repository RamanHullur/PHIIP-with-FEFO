import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { runWhatIfSimulation, WhatIfParameters } from '../services/simulator/whatIfEngine';

export const WhatIfPage: React.FC = () => {
  const { items, batches, predictions, avgDailyMap } = useInventory();

  // Selected item & batch for simulation
  const [selectedItemId, setSelectedItemId] = useState<string>('item_cftx_1g');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch_cftx_001');

  // Simulation parameters
  const [stockOverride, setStockOverride] = useState<number | undefined>(undefined);
  const [consumptionDeltaPercent, setConsumptionDeltaPercent] = useState<number>(0);
  const [expiryDaysOverride, setExpiryDaysOverride] = useState<number | undefined>(undefined);
  const [transferOutQty, setTransferOutQty] = useState<number>(0);
  const [safetyStockOverride, setSafetyStockOverride] = useState<number | undefined>(undefined);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const itemBatches = useMemo(() => {
    return batches.filter(b => b.itemId === selectedItem?.id && b.status === 'active');
  }, [batches, selectedItem]);

  const selectedBatch = useMemo(() => {
    return itemBatches.find(b => b.id === selectedBatchId) || itemBatches[0] || batches[0];
  }, [itemBatches, selectedBatchId, batches]);

  const baselineDaily = selectedItem ? avgDailyMap.get(selectedItem.id) || 50 : 50;

  // Run simulation
  const simParams: WhatIfParameters = {
    stockDeltaPercent: 0,
    stockOverride,
    consumptionDeltaPercent,
    expiryDaysOverride,
    pendingPODelta: 0,
    transferOutQty,
    safetyStockOverride,
  };

  const comparison = useMemo(() => {
    if (!selectedItem || !selectedBatch) return null;
    return runWhatIfSimulation(selectedItem, selectedBatch, baselineDaily, simParams);
  }, [selectedItem, selectedBatch, baselineDaily, simParams]);

  // Quick preset triggers
  const handlePresetCeftriaxone = () => {
    setSelectedItemId('item_cftx_1g');
    setSelectedBatchId('batch_cftx_001');
    setStockOverride(5000);
    setConsumptionDeltaPercent(0);
    setExpiryDaysOverride(45);
    setTransferOutQty(0);
    setSafetyStockOverride(800);
  };

  const handlePresetSurge20 = () => {
    setConsumptionDeltaPercent(20);
    setTransferOutQty(0);
  };

  const handlePresetTransfer800 = () => {
    setTransferOutQty(800);
  };

  const handleReset = () => {
    setStockOverride(undefined);
    setConsumptionDeltaPercent(0);
    setExpiryDaysOverride(undefined);
    setTransferOutQty(0);
    setSafetyStockOverride(undefined);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
              Inventory What-If Simulator
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Test hypotheses in real-time. Adjust patient consumption velocities, warehouse stock volumes, shelf-life horizons, or inter-ward transfers to dynamically view predicted impact on expiry risk, stock-out hazards, and financial savings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Parameters
          </button>
        </div>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1 mr-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Scenarios:
        </span>
        <button
          onClick={handlePresetCeftriaxone}
          className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold hover:bg-rose-100 transition"
        >
          Benchmark: Ceftriaxone 5,000 units / 45 days
        </button>
        <button
          onClick={handlePresetSurge20}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 transition"
        >
          What if consumption increases by +20%?
        </button>
        <button
          onClick={handlePresetTransfer800}
          className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 transition"
        >
          What if 800 units are transferred to ICU?
        </button>
      </div>

      {/* Simulator Controls & Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Simulation Parameters &amp; Levers
          </h2>

          {/* Item Selector */}
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Target Medical Item</label>
            <select
              value={selectedItemId}
              onChange={e => {
                setSelectedItemId(e.target.value);
                const firstB = batches.find(b => b.itemId === e.target.value);
                if (firstB) setSelectedBatchId(firstB.id);
                handleReset();
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Target Batch Lot</label>
            <select
              value={selectedBatchId}
              onChange={e => {
                setSelectedBatchId(e.target.value);
                handleReset();
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
            >
              {itemBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} (Stock: {b.currentStock}, Exp: {b.expiryDate})
                </option>
              ))}
            </select>
          </div>

          {/* Lever 1: Daily Consumption Rate Delta */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Consumption Velocity Shift:</span>
              <span className="font-mono font-bold text-indigo-600">
                {consumptionDeltaPercent > 0 ? `+${consumptionDeltaPercent}%` : `${consumptionDeltaPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={consumptionDeltaPercent}
              onChange={e => setConsumptionDeltaPercent(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% (Slump)</span>
              <span>Baseline: {baselineDaily}/d</span>
              <span>+100% (Surge)</span>
            </div>
          </div>

          {/* Lever 2: Physical Stock Override */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Simulate On-Hand Stock:</span>
              <span className="font-mono font-bold text-slate-800">
                {stockOverride !== undefined ? stockOverride : selectedBatch.currentStock} units
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="15000"
              step="100"
              value={stockOverride !== undefined ? stockOverride : selectedBatch.currentStock}
              onChange={e => setStockOverride(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>100 units</span>
              <span>15,000 units</span>
            </div>
          </div>

          {/* Lever 3: Transfer Out Units */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Transfer Out to Other Facility:</span>
              <span className="font-mono font-bold text-blue-600">{transferOutQty} units</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, (stockOverride || selectedBatch.currentStock) - selectedItem.safetyStock)}
              step="50"
              value={transferOutQty}
              onChange={e => setTransferOutQty(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 units</span>
              <span>Safety Cap: {(stockOverride || selectedBatch.currentStock) - selectedItem.safetyStock}</span>
            </div>
          </div>

          {/* Lever 4: Days to Expiry Override */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Simulated Days to Expiry:</span>
              <span className="font-mono font-bold text-slate-800">
                {expiryDaysOverride !== undefined
                  ? `${expiryDaysOverride} days`
                  : `${comparison?.baseline.daysToExpiry} days`}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="365"
              step="5"
              value={expiryDaysOverride !== undefined ? expiryDaysOverride : comparison?.baseline.daysToExpiry || 45}
              onChange={e => setExpiryDaysOverride(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5 days (Critical)</span>
              <span>365 days</span>
            </div>
          </div>
        </div>

        {/* Right Column: Before vs After Comparison & Impact Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {comparison && (
            <>
              {/* Dynamic Delta Highlights Ribbon */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Risk Score Delta</div>
                  <div className="text-xl font-bold font-mono mt-1 flex items-baseline gap-1.5">
                    <span className={comparison.simulated.riskScore > comparison.baseline.riskScore ? 'text-rose-600' : 'text-emerald-600'}>
                      {comparison.simulated.riskScore}/100
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({comparison.delta.riskScoreChange > 0 ? `+${comparison.delta.riskScoreChange}` : comparison.delta.riskScoreChange} pts)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Baseline: {comparison.baseline.riskScore}/100 ({comparison.baseline.riskLevel})
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Excess Inventory</div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                    {comparison.simulated.potentialExcess.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Shift: {comparison.delta.potentialExcessChange > 0 ? `+${comparison.delta.potentialExcessChange}` : comparison.delta.potentialExcessChange} units
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <div className="text-[10px] text-emerald-700 uppercase font-bold">Prevented Loss / Savings</div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-700">
                    ₹{comparison.delta.potentialSavings.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1">
                    Waste capital avoided
                  </div>
                </div>
              </div>

              {/* Automated AI Sandbox Rationale */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/50 border border-indigo-200 text-xs text-indigo-950">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Automated Sandbox Simulation Analysis:
                </div>
                <p className="leading-relaxed">{comparison.aiInsight}</p>
              </div>

              {/* Side-by-Side Detailed Metrics Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 font-bold text-xs text-slate-800 flex justify-between">
                  <span>Metric Comparison</span>
                  <div className="flex gap-16 font-mono text-slate-600 pr-4">
                    <span>Baseline</span>
                    <span className="text-indigo-600 font-bold">Simulated</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-sans">
                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Physical Stock Quantity</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-slate-700">{comparison.baseline.stock.toLocaleString()}</span>
                      <span className="font-bold text-indigo-600">{comparison.simulated.stock.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Daily Consumption Velocity</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-slate-700">{comparison.baseline.dailyConsumption}/day</span>
                      <span className="font-bold text-indigo-600">{comparison.simulated.dailyConsumption}/day</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Days Remaining to Expiry</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-slate-700">{comparison.baseline.daysToExpiry}d</span>
                      <span className="font-bold text-indigo-600">{comparison.simulated.daysToExpiry}d</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Forecast Usage Before Expiry</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-slate-700">{comparison.baseline.forecastConsumption.toLocaleString()}</span>
                      <span className="font-bold text-indigo-600">{comparison.simulated.forecastConsumption.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Potential Unused Excess</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-rose-600 font-semibold">{comparison.baseline.potentialExcess.toLocaleString()}</span>
                      <span className="font-bold text-rose-700">{comparison.simulated.potentialExcess.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Potential Expiry Loss Exposure</span>
                    <div className="flex gap-20 font-mono">
                      <span className="text-slate-700">₹{comparison.baseline.financialLoss.toLocaleString()}</span>
                      <span className="font-bold text-slate-900">₹{comparison.simulated.financialLoss.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Stock-Out Hazard (&lt;7 days supply)</span>
                    <div className="flex gap-20 font-mono">
                      <span className={comparison.baseline.stockOutRisk ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {comparison.baseline.stockOutRisk ? 'HIGH' : 'SAFE'}
                      </span>
                      <span className={comparison.simulated.stockOutRisk ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {comparison.simulated.stockOutRisk ? 'HIGH' : 'SAFE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
