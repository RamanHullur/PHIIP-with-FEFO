import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  parseAndValidateCSV,
  generateSampleCSV,
  exportToCSV,
  CSVParseResult,
} from '../services/csv/csvService';

export const ReportsPage: React.FC = () => {
  const {
    items,
    batches,
    predictions,
    transfers,
    procurements,
    consumptionRecords,
    stats,
    importCSVRecords,
  } = useInventory();

  // CSV Upload State
  const [csvResult, setCsvResult] = useState<CSVParseResult | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Download Sample Template
  const handleDownloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hospital_inventory_sample_template.csv';
    link.click();
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const result = parseAndValidateCSV(content);
      setCsvResult(result);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Commit valid records to state
  const handleCommitImport = () => {
    if (!csvResult || csvResult.validRows === 0) return;

    const validRows = csvResult.validatedData.filter(d => d.isValid);
    importCSVRecords(validRows);
    setImportSuccessMsg(`Successfully imported ${validRows.length} inventory records! System recalculated live predictions.`);
    setCsvResult(null);
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  // Report Exporters
  const itemMap = new Map(items.map(i => [i.id, i]));

  const exportInventoryReport = () => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Manufacturer', 'Supplier', 'Unit Cost', 'Safety Stock', 'Reorder Level'];
    const rows = items.map(i => [i.code, i.name, i.category, i.manufacturer, i.supplier, i.unitCost, i.safetyStock, i.reorderLevel]);
    exportToCSV('hospital_inventory_catalog_report', headers, rows);
  };

  const exportExpiryReport = () => {
    const headers = ['Item Name', 'Batch Lot', 'Current Stock', 'Expiry Date', 'Days to Expiry', 'Forecast Consumption', 'Potential Excess', 'Risk Score', 'Risk Level'];
    const rows = batches.map(b => {
      const item = itemMap.get(b.itemId);
      const p = predictions.get(b.id);
      return [item?.name || 'Item', b.batchNumber, b.currentStock, b.expiryDate, p?.daysToExpiry || 0, p?.forecastConsumption || 0, p?.potentialExcess || 0, p?.riskScore || 0, p?.riskLevel || 'Low'];
    });
    exportToCSV('hospital_expiry_risk_report', headers, rows);
  };

  const exportBatchReport = () => {
    const headers = ['Batch ID', 'Item Code', 'Batch Number', 'Received Date', 'Expiry Date', 'Quantity Received', 'Current Stock', 'Status'];
    const rows = batches.map(b => [b.id, itemMap.get(b.itemId)?.code || 'UNK', b.batchNumber, b.receivedDate, b.expiryDate, b.quantityReceived, b.currentStock, b.status]);
    exportToCSV('hospital_batches_audit_report', headers, rows);
  };

  const exportConsumptionReport = () => {
    const headers = ['Record Date', 'Item Name', 'Quantity Consumed', 'Department'];
    const rows = consumptionRecords.slice(0, 500).map(cr => [cr.date, itemMap.get(cr.itemId)?.name || 'Item', cr.quantityConsumed, cr.department]);
    exportToCSV('hospital_consumption_history_report', headers, rows);
  };

  const exportTransfersReport = () => {
    const headers = ['Item Name', 'Batch Number', 'Source Facility', 'Destination Facility', 'Transfer Quantity', 'Prevented Expiry', 'Estimated Savings (₹)'];
    const rows = transfers.map(t => [t.itemName, t.batchNumber, t.sourceLocationName, t.destLocationName, t.recommendedTransferQuantity, t.expectedExpiryPrevented, t.estimatedSavings]);
    exportToCSV('hospital_transfer_rebalancing_report', headers, rows);
  };

  const exportProcurementReport = () => {
    const headers = ['Item Name', 'Current Stock', 'Pending PO', 'Safety Stock', '30d Forecast Demand', 'Directive', 'Reason'];
    const rows = procurements.map(p => [p.itemName, p.currentStock, p.pendingPO, p.safetyStock, p.forecastDemand30d, p.action, p.reason]);
    exportToCSV('hospital_procurement_directives_report', headers, rows);
  };

  const reportsList = [
    {
      title: 'Full Inventory Catalog Report',
      description: 'Complete SKU list with manufacturer, acquisition cost, and minimum safety buffers.',
      count: `${items.length} SKUs`,
      onClick: exportInventoryReport,
    },
    {
      title: 'Expiry Risk & Excess Exposure Report',
      description: 'Lot-by-lot predictive analysis of days-to-expiry and potential financial write-offs.',
      count: `${batches.length} Batches`,
      onClick: exportExpiryReport,
    },
    {
      title: 'Batch Traceability & Audit Report',
      description: 'Warehouse lot ledger with received dates, initial quantities, and quarantine flags.',
      count: `${batches.length} Records`,
      onClick: exportBatchReport,
    },
    {
      title: 'Historical Consumption Time-Series',
      description: 'Daily ward dispensing records across medical departments for trend analysis.',
      count: `${consumptionRecords.length} Entries`,
      onClick: exportConsumptionReport,
    },
    {
      title: 'Transfer Opportunities & Savings Report',
      description: 'Inter-hospital and inter-department inventory balancing with calculated avoided losses.',
      count: `${transfers.length} Transfers`,
      onClick: exportTransfersReport,
    },
    {
      title: 'Procurement Pipeline & PO Report',
      description: 'Order schedule, stock-out alerts, and procurement delay directives.',
      count: `${procurements.length} Recommendations`,
      onClick: exportProcurementReport,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              Reports, CSV Import &amp; Data Pipeline
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              CSV Export &amp; Validation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Export standard clinical and administrative reports to CSV for regulatory compliance and audit trails.
            Upload external hospital ERP spreadsheets with automated schema validation and live predictive risk recalculation.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV Template
        </button>
      </div>

      {importSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* CSV Upload & Validation Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          Upload Inventory CSV
        </h2>

        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition bg-slate-50/50">
          <input
            type="file"
            accept=".csv"
            id="csv-file-input"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-700">
              Click to select or drop hospital CSV spreadsheet here
            </div>
            <p className="text-[11px] text-slate-400">
              Expected columns: Item ID, Item Name, Category, Batch Number, Received Date, Expiry Date, Quantity Received, Current Stock, Daily Consumption, Location, Unit Cost, Supplier, Pending PO, Safety Stock
            </p>
          </label>
        </div>

        {/* Validation Result Box */}
        {csvResult && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">Validation Summary:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {csvResult.validRows} Valid Rows
                </span>
                {csvResult.invalidRows > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                    {csvResult.invalidRows} Invalid Rows
                  </span>
                )}
              </div>

              {csvResult.validRows > 0 && (
                <button
                  onClick={handleCommitImport}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                >
                  Import {csvResult.validRows} Valid Records
                </button>
              )}
            </div>

            {/* Invalid Rows Table if errors found */}
            {csvResult.invalidRows > 0 && (
              <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20 text-xs">
                <div className="p-2.5 bg-rose-100/60 font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Validation Issues Flagged:
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-rose-100 p-2">
                  {csvResult.validatedData
                    .filter(d => !d.isValid)
                    .map((d, i) => (
                      <div key={i} className="py-1.5 px-2 flex justify-between items-center text-[11px]">
                        <span className="font-mono font-bold text-slate-700">Row #{d.rowNumber}:</span>
                        <span className="text-rose-700">{d.errors.join(' • ')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Reports Export Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Standard Administrative &amp; Clinical Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsList.map((rep, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-400 font-semibold">{rep.count}</span>
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{rep.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.description}</p>
              </div>

              <button
                onClick={rep.onClick}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report (.CSV)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
