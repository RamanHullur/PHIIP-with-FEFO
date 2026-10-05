import React from 'react';
import { Building, Building2, Boxes, AlertTriangle, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface LocationsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const LocationsPage: React.FC<LocationsPageProps> = ({ onNavigateTab }) => {
  const { locations, batches, items, predictions, transfers } = useInventory();

  const itemMap = new Map(items.map(i => [i.id, i]));

  // Group locations by hospital
  const hospitals = [
    { id: 'hosp_apex', name: 'Apex Metro Super-Speciality', type: 'Tertiary Referral Center', bedCount: '650 Beds' },
    { id: 'hosp_city', name: 'City Health North Hospital', type: 'Acute Care & Trauma', bedCount: '320 Beds' },
    { id: 'hosp_stjude', name: 'St. Jude Community Hospital', type: 'Community & General Care', bedCount: '180 Beds' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Hospital Network Facilities &amp; Ward Distribution
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              3 Facilities • 8 Wards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Multi-site hospital inventory topology. Monitor physical reserves across central supply depots, intensive care pods, emergency trauma rooms, and surgical suites.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('transfers')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Rebalance Stock Across Facilities
        </button>
      </div>

      {/* Hospital Sites Grid */}
      <div className="space-y-6">
        {hospitals.map(hosp => {
          const hospLocations = locations.filter(l => l.hospitalId === hosp.id);
          const hospLocationIds = new Set(hospLocations.map(l => l.id));

          const hospBatches = batches.filter(b => hospLocationIds.has(b.locationId) && b.status === 'active');
          const hospStock = hospBatches.reduce((acc, b) => acc + b.currentStock, 0);

          const hospValue = hospBatches.reduce((acc, b) => {
            const it = itemMap.get(b.itemId);
            return acc + b.currentStock * (it?.unitCost || 100);
          }, 0);

          const nearExpiryInHosp = hospBatches.filter(b => {
            const p = predictions.get(b.id);
            return p && p.daysToExpiry <= 60 && p.daysToExpiry > 0;
          }).length;

          return (
            <div key={hosp.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{hosp.name}</h2>
                    <span className="text-xs text-slate-500">{hosp.type} • {hosp.bedCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">On-Hand Stock</span>
                    <span className="font-bold text-slate-900 text-sm">{hospStock.toLocaleString()} units</span>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-4">
                    <span className="text-slate-400 block text-[10px]">Capital Held</span>
                    <span className="font-bold text-slate-900 text-sm">₹{hospValue.toLocaleString()}</span>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-4">
                    <span className="text-slate-400 block text-[10px]">Near Expiry</span>
                    <span className={`font-bold text-sm ${nearExpiryInHosp > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {nearExpiryInHosp} Lots
                    </span>
                  </div>
                </div>
              </div>

              {/* Department / Wards list in this hospital */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {hospLocations.map(loc => {
                  const locBatches = batches.filter(b => b.locationId === loc.id && b.status === 'active');
                  const locStock = locBatches.reduce((acc, b) => acc + b.currentStock, 0);

                  return (
                    <div
                      key={loc.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition bg-slate-50/30 space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-800">{loc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {loc.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Total Batches:</span>
                        <span className="font-mono font-bold text-slate-800">{locBatches.length}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs text-slate-500">
                        <span>Physical Units:</span>
                        <span className="font-mono font-bold text-indigo-600">{locStock.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
