import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Filter, BarChart3, Clock, DollarSign } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { SparklineAreaChart, HorizontalBarList } from '../components/charts/Charts';

export const ConsumptionPage: React.FC = () => {
  const { items, consumptionRecords, avgDailyMap } = useInventory();
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  // Aggregate total consumption per item
  const itemTotals = useMemo(() => {
    const map = new Map<string, number>();
    consumptionRecords.forEach(cr => {
      map.set(cr.itemId, (map.get(cr.itemId) || 0) + cr.quantityConsumed);
    });

    return Array.from(map.entries())
      .map(([itemId, total]) => {
        const item = itemMap.get(itemId);
        return {
          itemId,
          name: item?.name || 'Item',
          category: item?.category || 'Consumables',
          total,
          dailyAvg: avgDailyMap.get(itemId) || 20,
          value: total * (item?.unitCost || 50),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [consumptionRecords, itemMap, avgDailyMap]);

  // Filtered daily consumption series for trend chart
  const timeSeriesData = useMemo(() => {
    const dateMap = new Map<string, number>();

    consumptionRecords.forEach(cr => {
      if (selectedItemFilter !== 'all' && cr.itemId !== selectedItemFilter) return;
      if (selectedDeptFilter !== 'all' && cr.department !== selectedDeptFilter) return;

      dateMap.set(cr.date, (dateMap.get(cr.date) || 0) + cr.quantityConsumed);
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, val]) => ({ date: date.substring(5), value: val }));
  }, [consumptionRecords, selectedItemFilter, selectedDeptFilter]);

  const departments = ['Inpatient Medicine', 'ICU', 'General Surgery', 'Emergency Trauma'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Consumption Analytics &amp; Velocity Tracking
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              60-Day Observed Horizon
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Historical inpatient dispensing trends across departments. Daily consumption velocities feed directly into the predictive "Will Expire Before Use" calculation engine.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedItemFilter}
            onChange={e => setSelectedItemFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Medical Items</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Trend Chart Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {selectedItemFilter === 'all'
                ? 'Total Hospital Daily Dispense Volume'
                : `${itemMap.get(selectedItemFilter)?.name} Consumption History`}
            </h2>
            <p className="text-xs text-slate-500">Smoothed daily units issued to clinical wards</p>
          </div>
        </div>

        <div className="pt-2">
          <SparklineAreaChart data={timeSeriesData} height={120} strokeColor="#4f46e5" fillColor="#e0e7ff" />
        </div>
      </div>

      {/* Top Consumed Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 font-bold text-xs text-slate-800">
          Ranked Clinical Consumption Velocity by Product
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">60-Day Dispensed</th>
                <th className="py-2.5 px-3 text-right">Avg Daily Velocity</th>
                <th className="py-2.5 px-3 text-right">Avg Weekly Run</th>
                <th className="py-2.5 px-3 text-right">Monthly Forecast</th>
                <th className="py-2.5 px-4 text-right">Dispense Capital Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {itemTotals.slice(0, 15).map(it => (
                <tr key={it.itemId} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{it.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{it.category}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {it.total.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-bold">
                    {it.dailyAvg} / day
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    ~{(it.dailyAvg * 7).toLocaleString()} / wk
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    ~{(it.dailyAvg * 30).toLocaleString()} / mo
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                    ₹{it.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
