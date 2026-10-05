import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Edit3, ArrowRightLeft, Clock, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { Item, Batch, Prediction } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { SparklineAreaChart } from '../charts/Charts';
import { ExplainModal } from '../ai/ExplainModal';

interface ItemDetailModalProps {
  itemId: string | null;
  onClose: () => void;
  onNavigateToFEFO?: (itemId: string) => void;
  onNavigateToTransfers?: (itemId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  onClose,
  onNavigateToFEFO,
  onNavigateToTransfers,
}) => {
  const {
    items,
    batches,
    locations,
    consumptionRecords,
    predictions,
    actions,
    updateBatchStock,
    updateItemDailyConsumption,
    updateItemSafetyStock,
    avgDailyMap,
  } = useInventory();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDailyRate, setEditDailyRate] = useState<number>(50);
  const [editSafetyStock, setEditSafetyStock] = useState<number>(500);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);

  if (!itemId) return null;

  const item = items.find(i => i.id === itemId);
  if (!item) return null;

  const itemBatches = batches.filter(b => b.itemId === item.id);
  const activeBatches = itemBatches.filter(b => b.status === 'active');
  const totalStock = activeBatches.reduce((acc, b) => acc + b.currentStock, 0);
  const totalValue = totalStock * item.unitCost;
  const currentDailyRate = avgDailyMap.get(item.id) || 20;

  // Selected or earliest batch
  const currentBatch = selectedBatchId
    ? itemBatches.find(b => b.id === selectedBatchId) || itemBatches[0]
    : itemBatches[0];

  const currentPred = currentBatch ? predictions.get(currentBatch.id) : undefined;
  const itemAction = actions.find(a => a.itemId === item.id);

  // Consumption records for this item
  const itemHistory = consumptionRecords
    .filter(cr => cr.itemId === item.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map(cr => ({ date: cr.date.substring(5), value: cr.quantityConsumed }));

  const handleSaveEdits = () => {
    updateItemDailyConsumption(item.id, editDailyRate);
    updateItemSafetyStock(item.id, editSafetyStock);
    setIsEditing(false);
  };

  const locationMap = new Map(locations.map(l => [l.id, l]));

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                  {item.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200/60">
                  {item.category}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{item.name}</h2>
              <p className="text-xs text-slate-500">
                Mfr: {item.manufacturer} • Supplier: {item.supplier}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
            {/* Overview Metric Ribbon */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Total On-Hand</span>
                <div className="text-base font-bold text-slate-800">{totalStock.toLocaleString()} {item.unit}s</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Unit Cost</span>
                <div className="text-base font-bold text-slate-800 font-mono">₹{item.unitCost}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Inventory Value</span>
                <div className="text-base font-bold text-slate-800 font-mono">₹{totalValue.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Active Batches</span>
                <div className="text-base font-bold text-indigo-600">{activeBatches.length} Lots</div>
              </div>
            </div>

            {/* Recommended Action Card (if any) */}
            {itemAction && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      System Recommendation: {itemAction.type.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-slate-700 mt-2 font-medium">{itemAction.reason}</p>
                    <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Benefit: {itemAction.expectedBenefit}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowExplainModal(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Why this action?
                  </button>
                </div>
              </div>
            )}

            {/* Batch Selector & Expiry Analysis */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Batches & Shelf-Life Intelligence
                </h3>
                <span className="text-xs text-slate-400">Select batch to inspect prediction</span>
              </div>
              <div className="space-y-2">
                {itemBatches.map(b => {
                  const pred = predictions.get(b.id);
                  const isSelected = (currentBatch?.id === b.id);
                  const loc = locationMap.get(b.locationId);

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBatchId(b.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800">{b.batchNumber}</span>
                          <span className="text-[10px] text-slate-500">• {loc?.name || 'Central Store'}</span>
                          {b.status === 'quarantine' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                              Quarantined
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Expires: <span className="font-medium text-slate-700">{b.expiryDate}</span> ({pred?.daysToExpiry} days remaining)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-xs text-slate-800">{b.currentStock.toLocaleString()} {item.unit}s</div>
                        {pred && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              pred.riskLevel === 'Critical'
                                ? 'bg-rose-100 text-rose-700'
                                : pred.riskLevel === 'High'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Risk: {pred.riskScore}/100 ({pred.riskLevel})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Batch Prediction Deep-Dive */}
            {currentBatch && currentPred && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Prediction Breakdown for Batch {currentBatch.batchNumber}
                  </h4>
                  <button
                    onClick={() => setShowExplainModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Explainability
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-400">Forecast Usage Before Expiry:</span>
                    <div className="font-bold text-slate-800 text-sm">{currentPred.forecastConsumption.toLocaleString()} units</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-rose-500 font-medium">Potential Excess Quantity:</span>
                    <div className="font-bold text-rose-600 text-sm">{currentPred.potentialExcess.toLocaleString()} units</div>
                  </div>
                </div>

                <div className="text-xs p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900">
                  <span className="font-semibold">Classification: </span>
                  <span className="font-bold uppercase tracking-wider">{currentPred.willExpireBeforeUse}</span>
                  <p className="text-[11px] text-amber-800 mt-1">{currentPred.confidenceReason}</p>
                </div>
              </div>
            )}

            {/* Consumption Velocity & History */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Consumption Trend (Last 30 Days)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Average: <span className="font-semibold text-slate-800">{currentDailyRate} units/day</span> (Weekly: ~{currentDailyRate * 7}, Monthly: ~{currentDailyRate * 30})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setEditDailyRate(currentDailyRate);
                    setEditSafetyStock(item.safetyStock);
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium p-1 rounded hover:bg-indigo-50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel Edit' : 'Adjust Rates'}
                </button>
              </div>

              {isEditing ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-indigo-200 space-y-3 text-xs mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Daily Consumption Rate</label>
                      <input
                        type="number"
                        value={editDailyRate}
                        onChange={e => setEditDailyRate(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-mono text-sm bg-white"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">Safety Stock Threshold</label>
                      <input
                        type="number"
                        value={editSafetyStock}
                        onChange={e => setEditSafetyStock(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-mono text-sm bg-white"
                        min="0"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveEdits}
                    className="w-full py-1.5 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                  >
                    Save & Recalculate Live Predictions
                  </button>
                </div>
              ) : null}

              <SparklineAreaChart data={itemHistory} height={70} strokeColor="#4f46e5" fillColor="#e0e7ff" />
            </div>
          </div>

          {/* Drawer Quick Action Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {onNavigateToFEFO && (
                <button
                  onClick={() => {
                    onNavigateToFEFO(item.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 flex items-center gap-1 transition"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Request via FEFO
                </button>
              )}
              {onNavigateToTransfers && (
                <button
                  onClick={() => {
                    onNavigateToTransfers(item.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 flex items-center gap-1 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  View Transfers
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showExplainModal && currentPred && (
        <ExplainModal
          isOpen={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          item={item}
          batch={currentBatch}
          prediction={currentPred}
          action={itemAction}
        />
      )}
    </>
  );
};
