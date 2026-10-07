import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Building,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { TransferRecommendation } from '../types/inventory';

interface TransfersPageProps {
  onSelectItem: (itemId: string) => void;
}

export const TransfersPage: React.FC<TransfersPageProps> = ({ onSelectItem }) => {
  const { transfers, executeTransfer, stats } = useInventory();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleExecute = (tr: TransferRecommendation) => {
    executeTransfer(tr.id);
    setSuccessToast(
      `Transferred ${tr.recommendedTransferQuantity} units of ${tr.itemName} from ${tr.sourceLocationName} to ${tr.destLocationName}. Prevented $${tr.estimatedSavings.toLocaleString()} in expiry waste!`
    );
    setTimeout(() => setSuccessToast(null), 6000);
  };

  const totalTransferSavings = transfers.reduce((acc, t) => acc + t.estimatedSavings, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              Inter-Facility Inventory Rebalancing Engine
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {transfers.length} Active Opportunities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Surplus inventory at low-turnover facilities is algorithmically matched against high-acuity shortages across hospital sites.
            Safety stock buffer rules prevent transferring below source hospital minimum reserves, eliminating waste while securing clinical continuity.
          </p>
        </div>

        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-right">
          <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Total Preventable Waste</div>
          <div className="text-xl font-bold text-blue-900 font-mono">${totalTransferSavings.toLocaleString()}</div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">Real-time balances updated</span>
        </div>
      )}

      {/* Transfer Opportunities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Recommended Transfer Directives
            </h2>
            <p className="text-xs text-slate-500">
              Source inventory with imminent expiry &gt; destination consumption capacity
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Source Safety Buffer: Protected &gt; 100%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item & Batch</th>
                <th className="py-3 px-3">Source Facility</th>
                <th className="py-3 px-3">Destination Facility</th>
                <th className="py-3 px-3 text-right">Available Excess</th>
                <th className="py-3 px-3 text-right">Dest Requirement</th>
                <th className="py-3 px-3 text-right">Transfer Qty</th>
                <th className="py-3 px-3 text-right">Source Retained</th>
                <th className="py-3 px-3 text-right">Prevented Expiry</th>
                <th className="py-3 px-3 text-right">Savings ($)</th>
                <th className="py-3 px-3 text-center">Urgency</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No active transfer imbalances detected. All facilities are currently within balanced supply bands.
                  </td>
                </tr>
              ) : (
                transfers.map(tr => {
                  const isInter = tr.sourceHospital !== tr.destHospital;

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectItem(tr.itemId)}
                          className="font-bold text-indigo-600 hover:underline text-left block"
                        >
                          {tr.itemName}
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">Batch {tr.batchNumber}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{tr.sourceLocationName}</div>
                        <span className="text-[10px] text-slate-400">{tr.sourceHospital}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{tr.destLocationName}</div>
                        <span className="text-[10px] text-slate-400">
                          {tr.destHospital} {isInter && <span className="text-indigo-600 font-bold">(Inter-Hosp)</span>}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600">
                        {tr.availableExcess.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {tr.destRequirement.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/40">
                        {tr.recommendedTransferQuantity.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {tr.remainingSourceStock.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {tr.expectedExpiryPrevented.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ${tr.estimatedSavings.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tr.urgency === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : tr.urgency === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tr.urgency}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleExecute(tr)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          Execute Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
