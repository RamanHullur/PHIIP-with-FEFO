import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { calculateFEFORecommendation, validateManualBatchSelection } from '../services/fefo/fefoEngine';

interface FEFOPageProps {
  initialItemId?: string | null;
  onSelectItem: (itemId: string) => void;
}

export const FEFOPage: React.FC<FEFOPageProps> = ({ initialItemId, onSelectItem }) => {
  const { items, batches, locations, executeFEFOAllocation, stats } = useInventory();

  // State
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || 'item_cftx_1g');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(600);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [dispenseSuccessMsg, setDispenseSuccessMsg] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const activeItemBatches = useMemo(() => {
    return batches.filter(b => b.itemId === selectedItem?.id && b.status === 'active' && b.currentStock > 0);
  }, [batches, selectedItem]);

  // Automated FEFO recommendation
  const fefoResult = useMemo(() => {
    if (!selectedItem) return null;
    return calculateFEFORecommendation({
      itemId: selectedItem.id,
      requestedQuantity,
      availableBatches: batches,
    });
  }, [selectedItem, requestedQuantity, batches]);

  // Current active allocations (either automated or manual)
  const currentAllocations = useMemo(() => {
    if (!fefoResult) return [];

    return fefoResult.allocations.map(a => {
      const manualQty = manualAllocations[a.batchId];
      const alloc = isManualOverride && manualQty !== undefined ? manualQty : a.allocate;
      return {
        ...a,
        allocate: alloc,
        remaining: a.available - alloc,
      };
    });
  }, [fefoResult, manualAllocations, isManualOverride]);

  const totalAllocatedNow = currentAllocations.reduce((sum, a) => sum + a.allocate, 0);

  // Manual Override Violation Check
  const overrideValidation = useMemo(() => {
    if (!isManualOverride) return { isCompliant: true, warningMessage: undefined, earlierBatches: [] };

    const firstManual = currentAllocations.find(a => a.allocate > 0);
    if (!firstManual) return { isCompliant: true, warningMessage: undefined, earlierBatches: [] };

    return validateManualBatchSelection(firstManual.batchId, firstManual.allocate, batches);
  }, [isManualOverride, currentAllocations, batches]);

  const handleManualSliderChange = (batchId: string, val: number) => {
    setIsManualOverride(true);
    setManualAllocations(prev => ({
      ...prev,
      [batchId]: val,
    }));
  };

  const handleResetToFEFO = () => {
    setIsManualOverride(false);
    setManualAllocations({});
    setOverrideReason('');
  };

  const handleExecuteDispense = () => {
    if (totalAllocatedNow <= 0) return;

    const payload = currentAllocations
      .filter(a => a.allocate > 0)
      .map(a => ({ batchId: a.batchId, allocate: a.allocate }));

    const res = executeFEFOAllocation(
      selectedItem.id,
      totalAllocatedNow,
      payload,
      isManualOverride ? overrideReason || 'Manual nurse request override' : undefined
    );

    if (res.success) {
      setDispenseSuccessMsg(res.message);
      setTimeout(() => setDispenseSuccessMsg(null), 5000);
      handleResetToFEFO();
    }
  };

  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              FEFO Allocation &amp; Dispensing Engine
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.fefoComplianceRate}% Network Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            First-Expiry, First-Out (FEFO) guarantees that batches with the shortest remaining shelf-life are consumed first.
            Automated greedy multi-batch allocation exhausts near-expiry lots before newer deliveries are opened, preventing avoidable expiration write-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Monitored Lots</div>
            <div className="text-sm font-bold text-slate-800">{activeItemBatches.length} Active Lots</div>
          </div>
        </div>
      </div>

      {dispenseSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{dispenseSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-600">Audit trail logged</span>
        </div>
      )}

      {/* Interactive Request Form & Item Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Simulate Inpatient Ward Dispense Request
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Item Selector */}
          <div>
            <label className="text-slate-600 font-semibold block mb-1.5">Select Medical Product</label>
            <select
              value={selectedItemId}
              onChange={e => {
                setSelectedItemId(e.target.value);
                handleResetToFEFO();
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-slate-600 font-semibold block mb-1.5">Requested Units to Dispense</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={requestedQuantity}
                onChange={e => setRequestedQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                min="1"
              />
              <span className="text-slate-500 text-xs shrink-0">{selectedItem?.unit}s</span>
            </div>
          </div>

          {/* Quick Benchmark Preset Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedItemId('item_cftx_1g');
                setRequestedQuantity(600);
                handleResetToFEFO();
              }}
              className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
            >
              Load Benchmark: Ceftriaxone 600 Units
            </button>
          </div>
        </div>
      </div>

      {/* FEFO Allocation Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Recommended Batch Allocation (Earliest Expiry First)
              {isManualOverride ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Manual Override Active
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% FEFO Automated
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{fefoResult?.explanation}</p>
          </div>

          <div className="flex items-center gap-2">
            {isManualOverride && (
              <button
                onClick={handleResetToFEFO}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Strict FEFO
              </button>
            )}
          </div>
        </div>

        {/* Warning Banner if Manual Override violated FEFO */}
        {!overrideValidation.isCompliant && overrideValidation.warningMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-800">Wrong-Batch Selection Warning:</div>
              <p className="mt-0.5 text-amber-700">{overrideValidation.warningMessage}</p>
            </div>
          </div>
        )}

        {/* Proposed Allocation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Batch Lot Number</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-right">Days Remaining</th>
                <th className="py-2.5 px-3 text-right">Available Stock</th>
                <th className="py-2.5 px-4 text-center">Allocate Quantity</th>
                <th className="py-2.5 px-3 text-right">Remaining Stock</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {currentAllocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active stock available for this product.
                  </td>
                </tr>
              ) : (
                currentAllocations.map(alloc => {
                  const isAllocated = alloc.allocate > 0;
                  const isEarliest = alloc.isEarliestExpiry;

                  return (
                    <tr
                      key={alloc.batchId}
                      className={`transition ${isAllocated ? 'bg-indigo-50/20 font-medium' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          {alloc.batchNumber}
                          {isEarliest && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 uppercase font-bold">
                              Earliest
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">{alloc.expiryDate}</td>

                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={alloc.daysToExpiry <= 45 ? 'text-rose-600' : 'text-slate-800'}>
                          {alloc.daysToExpiry} days
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {alloc.available.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max={Math.min(alloc.available, requestedQuantity)}
                            value={alloc.allocate}
                            onChange={e => handleManualSliderChange(alloc.batchId, Number(e.target.value))}
                            className="w-28 accent-indigo-600 cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs text-indigo-700 w-12 text-right">
                            {alloc.allocate}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-600">
                        {alloc.remaining.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {alloc.allocate === alloc.available ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Exhausted
                          </span>
                        ) : alloc.allocate > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            Partial ({alloc.allocate})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Untouched</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Manual Override Reason Input (if override triggered) */}
        {isManualOverride && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <label className="font-semibold text-slate-700">Audit Justification for FEFO Override:</label>
            <input
              type="text"
              placeholder="e.g. Clinical ward specific batch request / protocol exception"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        )}

        {/* Dispense Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Total Allocated: <span className="font-bold font-mono text-slate-900">{totalAllocatedNow}</span> of{' '}
            <span className="font-bold font-mono text-slate-900">{requestedQuantity}</span> requested units
            {totalAllocatedNow < requestedQuantity && (
              <span className="text-rose-600 font-bold ml-2">
                ({requestedQuantity - totalAllocatedNow} unfulfilled)
              </span>
            )}
          </div>

          <button
            onClick={handleExecuteDispense}
            disabled={totalAllocatedNow <= 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Confirm &amp; Dispense {totalAllocatedNow} Units
          </button>
        </div>
      </div>
    </div>
  );
};
