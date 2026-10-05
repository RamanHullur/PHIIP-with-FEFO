import React, { useState } from 'react';
import { FileClock, Search, Filter, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { exportToCSV } from '../services/csv/csvService';

export const AuditTrailPage: React.FC = () => {
  const { auditLogs } = useInventory();
  const [search, setSearch] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction !== 'all' && log.actionType !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportAudit = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action Type', 'Description'];
    const rows = filteredLogs.map(l => [l.id, l.timestamp, l.user, l.role, l.actionType, l.description]);
    exportToCSV(`hospital_inventory_audit_log_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const actionTypes = [
    'FEFO_RECOMMENDED',
    'FEFO_OVERRIDE',
    'TRANSFER_INITIATED',
    'PROCUREMENT_ACTION',
    'STOCK_ADJUSTMENT',
    'DATA_IMPORT',
    'DATA_RESET',
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileClock className="w-6 h-6 text-indigo-600" />
              Audit Trail &amp; Regulatory Compliance Register
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Immutable Local Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Cryptographic-style audit register tracking automated FEFO suggestions, clinical overrides, inter-hospital transfers, stock adjustments, and quarantine enforcement.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
        >
          <Download className="w-4 h-4" />
          Export Audit Trail (.CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit descriptions, clinical users, roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
        >
          <option value="all">All Action Types</option>
          {actionTypes.map(at => (
            <option key={at} value={at}>
              {at.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Clinical User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-4">Event Description &amp; Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isOverride = log.actionType === 'FEFO_OVERRIDE';
                  const isTransfer = log.actionType === 'TRANSFER_INITIATED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{log.user}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isOverride
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isTransfer
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-xl">
                        {log.description}
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
