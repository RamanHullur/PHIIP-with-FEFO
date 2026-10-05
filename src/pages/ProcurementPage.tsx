import React, { useState } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  XCircle,
  PauseCircle,
  PlusCircle,
  Info,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ProcurementRecommendation, PurchaseOrder } from '../types/inventory';

interface ProcurementPageProps {
  onSelectItem: (itemId: string) => void;
}

export const ProcurementPage: React.FC<ProcurementPageProps> = ({ onSelectItem }) => {
  const {
    items,
    batches,
    purchaseOrders,
    procurements,
    executeProcurementAction,
    updatePendingPO,
  } = useInventory();

  const [filterAction, setFilterAction] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredProcurements = procurements.filter(p => {
    if (filterAction === 'all') return true;
    return p.action === filterAction;
  });

  const activePOs = purchaseOrders.filter(po => po.status === 'pending' || po.status === 'delayed');

  const handleAction = (itemId: string, actionType: string, poId?: string) => {
    executeProcurementAction(itemId, actionType, poId);
    setSuccessToast(`Action "${actionType.replace(/_/g, ' ')}" successfully executed. Audit entry logged.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const itemMap = new Map(items.map(i => [i.id, i]));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-amber-600" />
              Smart Procurement &amp; Overstock Prevention
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Pipeline Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Algorithmic purchasing guidance analyzes current warehouse stock, incoming open POs, safety stock, and 30–90 day demand forecasts.
            Detects redundant orders that risk expiring before use, and flags urgent reorder points for critical therapeutics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-right">
            <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">Pending PO Volume</div>
            <div className="text-xl font-bold text-amber-900 font-mono">
              {activePOs.reduce((acc, po) => acc + po.quantity, 0).toLocaleString()} units
            </div>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <span className="text-[10px] text-emerald-600">Updated procurement state</span>
        </div>
      )}

      {/* Procurement Directives Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Procurement Inventory Health &amp; Order Guidance
            </h2>
            <p className="text-xs text-slate-500">
              Comparison: Total Available (Stock + Pending PO) vs 30-Day Demand &amp; Safety Thresholds
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Action Filter:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium focus:outline-hidden"
            >
              <option value="all">All Recommendations</option>
              <option value="CANCEL_PROCUREMENT">Cancel Order (Overstock)</option>
              <option value="DELAY_PROCUREMENT">Delay Order (Runway)</option>
              <option value="REORDER_NOW">Reorder Required</option>
              <option value="EMERGENCY_ORDER">Emergency Order (Stock-Out)</option>
              <option value="MAINTAIN">Maintain (Balanced)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Pending PO</th>
                <th className="py-3 px-3 text-right">Safety Stock</th>
                <th className="py-3 px-3 text-right">Forecast 30d Demand</th>
                <th className="py-3 px-3 text-right">Reorder Point</th>
                <th className="py-3 px-3 text-center">System Directive</th>
                <th className="py-3 px-3">Algorithmic Justification</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProcurements.map(proc => {
                const actionBadgeColor =
                  proc.action === 'CANCEL_PROCUREMENT'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : proc.action === 'DELAY_PROCUREMENT'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : proc.action === 'EMERGENCY_ORDER'
                    ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
                    : proc.action === 'REORDER_NOW'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <tr key={proc.itemId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectItem(proc.itemId)}
                        className="font-bold text-indigo-600 hover:underline text-left block"
                      >
                        {proc.itemName}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {proc.currentStock.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={proc.pendingPO > 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {proc.pendingPO > 0 ? `+${proc.pendingPO.toLocaleString()}` : '0'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {proc.safetyStock.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {proc.forecastDemand30d.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {proc.reorderPoint.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${actionBadgeColor}`}>
                        {proc.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-[11px] text-slate-600 leading-tight">{proc.reason}</p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {proc.action === 'CANCEL_PROCUREMENT' ? (
                        <button
                          onClick={() => {
                            const po = purchaseOrders.find(p => p.itemId === proc.itemId && p.status === 'pending');
                            if (po) handleAction(proc.itemId, 'CANCEL_PROCUREMENT', po.id);
                          }}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition"
                        >
                          Cancel PO
                        </button>
                      ) : proc.action === 'DELAY_PROCUREMENT' ? (
                        <button
                          onClick={() => {
                            const po = purchaseOrders.find(p => p.itemId === proc.itemId && p.status === 'pending');
                            if (po) handleAction(proc.itemId, 'DELAY_PROCUREMENT', po.id);
                          }}
                          className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition"
                        >
                          Delay 45 Days
                        </button>
                      ) : proc.action === 'REORDER_NOW' || proc.action === 'EMERGENCY_ORDER' ? (
                        <button
                          onClick={() => updatePendingPO(proc.itemId, proc.recommendedOrderQuantity || 500)}
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition"
                        >
                          Place PO (+{proc.recommendedOrderQuantity || 500})
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Optimal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Purchase Orders Register */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Active Hospital Purchase Orders in Pipeline
            </h3>
            <p className="text-xs text-slate-500">Track shipments, supplier commitments, and delivery schedules</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {activePOs.length} Active Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">PO Number</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3 text-right">Order Quantity</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3">Expected Delivery</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {activePOs.map(po => {
                const item = itemMap.get(po.itemId);

                return (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item?.name || 'Medical Supply'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{po.supplier}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {po.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{po.unitPrice}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{po.expectedDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          po.status === 'delayed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {po.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleAction(po.itemId, 'CANCEL_PROCUREMENT', po.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
