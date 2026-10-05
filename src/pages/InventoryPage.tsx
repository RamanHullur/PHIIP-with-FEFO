import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Edit2,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Item, Batch, Prediction, RiskLevel } from '../types/inventory';
import { exportToCSV } from '../services/csv/csvService';
import { ExplainModal } from '../components/ai/ExplainModal';

interface InventoryPageProps {
  onSelectItem: (itemId: string) => void;
  initialFilter?: { riskFilter?: string; filter?: string };
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ onSelectItem, initialFilter }) => {
  const {
    items,
    batches,
    locations,
    predictions,
    actions,
    updateBatchStock,
    avgDailyMap,
  } = useInventory();

  // Filters & State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>(initialFilter?.riskFilter || 'all');
  const [selectedExpiryRange, setSelectedExpiryRange] = useState<string>(
    initialFilter?.filter === 'nearExpiry' ? 'near' : initialFilter?.filter === 'quarantined' ? 'expired' : 'all'
  );

  // Sorting
  const [sortField, setSortField] = useState<string>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Inline editing stock
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);

  // AI Explain modal
  const [explainTarget, setExplainTarget] = useState<{ item: Item; batch: Batch; pred: Prediction } | null>(null);

  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations]);
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  // Flattened row records
  const tableRows = useMemo(() => {
    return batches.map(batch => {
      const item = itemMap.get(batch.itemId);
      const pred = predictions.get(batch.id);
      const loc = locationMap.get(batch.locationId);
      const action = actions.find(a => a.batchId === batch.id || a.itemId === batch.itemId);
      const dailyRate = item ? avgDailyMap.get(item.id) || 20 : 20;

      return {
        batch,
        item: item || {
          id: batch.itemId,
          name: 'Unknown Item',
          code: 'UNK',
          category: 'Consumables & Surgical',
          manufacturer: 'Unknown',
          supplier: 'Unknown',
          unitCost: 100,
          reorderLevel: 500,
          safetyStock: 300,
          unit: 'Unit',
        },
        pred: pred || {
          itemId: batch.itemId,
          batchId: batch.id,
          daysToExpiry: 100,
          forecastConsumption: 1000,
          potentialExcess: 0,
          riskScore: 10,
          riskLevel: 'Low' as RiskLevel,
          willExpireBeforeUse: 'Likely to be consumed before expiry' as const,
          confidence: 'High' as const,
          potentialExpiryLoss: 0,
          breakdown: {
            expiryRiskScore: 5,
            excessRiskScore: 0,
            consumptionRiskScore: 5,
            forecastRiskScore: 0,
            poRiskScore: 0,
            daysToExpiry: 100,
            expectedConsumption: 1000,
            potentialExcess: 0,
            consumptionVelocityDaily: 20,
            safetyStock: 300,
          },
        },
        location: loc?.name || 'Central Store',
        hospitalName: loc?.hospitalName || 'Apex Metro',
        dailyConsumption: dailyRate,
        inventoryValue: batch.currentStock * (item?.unitCost || 100),
        action: action?.type.replace(/_/g, ' ') || (pred?.riskLevel === 'Critical' ? 'PRIORITIZE CONSUMPTION' : 'MONITOR'),
      };
    });
  }, [batches, itemMap, predictions, locationMap, actions, avgDailyMap]);

  // Filter application
  const filteredRows = useMemo(() => {
    return tableRows.filter(row => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchName = row.item.name.toLowerCase().includes(q);
        const matchBatch = row.batch.batchNumber.toLowerCase().includes(q);
        const matchCode = row.item.code.toLowerCase().includes(q);
        const matchCat = row.item.category.toLowerCase().includes(q);
        if (!matchName && !matchBatch && !matchCode && !matchCat) return false;
      }

      // Category
      if (selectedCategory !== 'all' && row.item.category !== selectedCategory) {
        return false;
      }

      // Location
      if (selectedLocation !== 'all' && row.batch.locationId !== selectedLocation) {
        return false;
      }

      // Risk
      if (selectedRisk !== 'all' && row.pred.riskLevel !== selectedRisk) {
        return false;
      }

      // Expiry Range
      if (selectedExpiryRange === 'expired' && row.pred.daysToExpiry > 0) return false;
      if (selectedExpiryRange === 'critical' && (row.pred.daysToExpiry <= 0 || row.pred.daysToExpiry > 30)) return false;
      if (selectedExpiryRange === 'near' && (row.pred.daysToExpiry <= 0 || row.pred.daysToExpiry > 60)) return false;
      if (selectedExpiryRange === 'medium' && (row.pred.daysToExpiry <= 60 || row.pred.daysToExpiry > 90)) return false;
      if (selectedExpiryRange === 'long' && row.pred.daysToExpiry <= 90) return false;

      return true;
    });
  }, [tableRows, search, selectedCategory, selectedLocation, selectedRisk, selectedExpiryRange]);

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA: any = a.pred.riskScore;
      let valB: any = b.pred.riskScore;

      if (sortField === 'name') {
        valA = a.item.name;
        valB = b.item.name;
      } else if (sortField === 'stock') {
        valA = a.batch.currentStock;
        valB = b.batch.currentStock;
      } else if (sortField === 'daysToExpiry') {
        valA = a.pred.daysToExpiry;
        valB = b.pred.daysToExpiry;
      } else if (sortField === 'potentialExcess') {
        valA = a.pred.potentialExcess;
        valB = b.pred.potentialExcess;
      } else if (sortField === 'inventoryValue') {
        valA = a.inventoryValue;
        valB = b.inventoryValue;
      } else if (sortField === 'riskScore') {
        valA = a.pred.riskScore;
        valB = b.pred.riskScore;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredRows, sortField, sortOrder]);

  // Paginated Rows
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSaveStock = (batchId: string) => {
    updateBatchStock(batchId, editStockValue);
    setEditingBatchId(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Item ID',
      'Item Name',
      'Category',
      'Batch Number',
      'Location',
      'Current Stock',
      'Unit Cost (₹)',
      'Inventory Value (₹)',
      'Received Date',
      'Expiry Date',
      'Days to Expiry',
      'Daily Consumption',
      'Forecast Consumption',
      'Potential Excess',
      'Risk Score',
      'Risk Level',
      'Recommended Action',
    ];

    const data = sortedRows.map(r => [
      r.item.code,
      r.item.name,
      r.item.category,
      r.batch.batchNumber,
      r.location,
      r.batch.currentStock,
      r.item.unitCost,
      r.inventoryValue,
      r.batch.receivedDate,
      r.batch.expiryDate,
      r.pred.daysToExpiry,
      r.dailyConsumption,
      r.pred.forecastConsumption,
      r.pred.potentialExcess,
      r.pred.riskScore,
      r.pred.riskLevel,
      r.action,
    ]);

    exportToCSV(`hospital_inventory_export_${new Date().toISOString().split('T')[0]}`, headers, data);
  };

  const categories = [
    'Antibiotics',
    'Critical Care',
    'Analgesics',
    'IV Fluids',
    'Consumables & Surgical',
    'Oncology',
    'Laboratory & Reagents',
  ];

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by SKU, medicine name, batch number, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Location */}
          <select
            value={selectedLocation}
            onChange={e => {
              setSelectedLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Locations / Wards</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Risk Level (Proposal thresholds) */}
          <select
            value={selectedRisk}
            onChange={e => {
              setSelectedRisk(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical (81–100)</option>
            <option value="High">High (61–80)</option>
            <option value="Medium">Medium (31–60)</option>
            <option value="Low">Low (0–30)</option>
          </select>

          {/* Expiry Range */}
          <select
            value={selectedExpiryRange}
            onChange={e => {
              setSelectedExpiryRange(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Expiry Windows</option>
            <option value="expired">Expired (&le; 0 Days)</option>
            <option value="critical">&le; 30 Days Remaining</option>
            <option value="near">&le; 60 Days Remaining</option>
            <option value="medium">61–90 Days</option>
            <option value="long">&gt; 90 Days Shelf-Life</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    Item & SKU
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Batch / Lot</th>
                <th className="py-3 px-2">Location</th>
                <th
                  onClick={() => toggleSort('stock')}
                  className="py-3 px-2 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    Current Stock
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-right">Unit Cost</th>
                <th
                  onClick={() => toggleSort('inventoryValue')}
                  className="py-3 px-2 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    Value
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2">Expiry Date</th>
                <th
                  onClick={() => toggleSort('daysToExpiry')}
                  className="py-3 px-2 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    Days
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-right">Daily Run</th>
                <th className="py-3 px-2 text-right">Forecast Use</th>
                <th
                  onClick={() => toggleSort('potentialExcess')}
                  className="py-3 px-2 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    Excess
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('riskScore')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    Risk Score
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Recommended Action</th>
                <th className="py-3 px-3 text-right">Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    No inventory records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(row => {
                  const isEditingStock = editingBatchId === row.batch.id;

                  const riskColor =
                    row.pred.riskLevel === 'Critical'
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : row.pred.riskLevel === 'High'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : row.pred.riskLevel === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                  return (
                    <tr key={row.batch.id} className="hover:bg-slate-50/70 transition group">
                      {/* Name & SKU */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectItem(row.item.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left block truncate max-w-[180px]"
                        >
                          {row.item.name}
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">{row.item.code}</span>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {row.item.category}
                        </span>
                      </td>

                      {/* Batch */}
                      <td className="py-2.5 px-2 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {row.batch.batchNumber}
                        {row.batch.status === 'quarantine' && (
                          <span className="block text-[9px] text-rose-600 font-semibold">Quarantined</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-2 text-slate-600 truncate max-w-[130px]" title={row.location}>
                        {row.location}
                      </td>

                      {/* Current Stock (Inline Editable) */}
                      <td className="py-2.5 px-2 text-right">
                        {isEditingStock ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editStockValue}
                              onChange={e => setEditStockValue(Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 rounded border border-indigo-400 text-right font-mono text-xs"
                              min="0"
                            />
                            <button
                              onClick={() => handleSaveStock(row.batch.id)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingBatchId(null)}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingBatchId(row.batch.id);
                              setEditStockValue(row.batch.currentStock);
                            }}
                            className="font-mono font-bold text-slate-900 cursor-pointer hover:text-indigo-600 flex items-center justify-end gap-1 group-hover:underline"
                            title="Click to adjust physical stock"
                          >
                            <span>{row.batch.currentStock.toLocaleString()}</span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-300 group-hover:text-indigo-600" />
                          </div>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">₹{row.item.unitCost}</td>

                      {/* Inventory Value */}
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                        ₹{row.inventoryValue.toLocaleString()}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-2.5 px-2 font-mono text-slate-700 whitespace-nowrap">{row.batch.expiryDate}</td>

                      {/* Days to Expiry */}
                      <td className="py-2.5 px-2 text-right font-mono font-bold">
                        <span className={row.pred.daysToExpiry <= 30 ? 'text-rose-600' : 'text-slate-800'}>
                          {row.pred.daysToExpiry <= 0 ? '0' : row.pred.daysToExpiry}
                        </span>
                      </td>

                      {/* Daily Consumption */}
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">{row.dailyConsumption}/d</td>

                      {/* Forecast Consumption */}
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {row.pred.forecastConsumption.toLocaleString()}
                      </td>

                      {/* Potential Excess */}
                      <td className="py-2.5 px-2 text-right font-mono font-bold">
                        <span className={row.pred.potentialExcess > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          {row.pred.potentialExcess.toLocaleString()}
                        </span>
                      </td>

                      {/* Risk Score & Level */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setExplainTarget({ item: row.item, batch: row.batch, pred: row.pred })}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer hover:shadow-xs transition ${riskColor}`}
                          title="Click to view full score breakdown"
                        >
                          {row.pred.riskScore}/100 • {row.pred.riskLevel}
                        </button>
                      </td>

                      {/* Recommended Action */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 text-[11px] block">{row.action}</span>
                      </td>

                      {/* Explain Button */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setExplainTarget({ item: row.item, batch: row.batch, pred: row.pred })}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="Why is this score assigned?"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{sortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-bold">{Math.min(currentPage * pageSize, sortedRows.length)}</span> of{' '}
            <span className="font-bold">{sortedRows.length}</span> batches
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-medium focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
