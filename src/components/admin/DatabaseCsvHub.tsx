import React, { useState, useMemo } from 'react';
import {
  Database,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Search,
  Table,
  FileCode,
  Layers,
  Boxes,
  Building2,
  ShoppingCart,
  UserCheck,
  FileClock,
  TrendingUp,
  HardDrive,
  ExternalLink,
  Code2,
  FileText,
  Sparkles,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { RAW_CSV_FILES } from '../../data/mockHospitalData';
import { parseCsv, downloadFile, downloadAsExcelXls, toCsvString } from '../../utils/csvParser';
import { useInventory } from '../../context/InventoryContext';

export const DatabaseCsvHub: React.FC = () => {
  const { items, batches, locations, purchaseOrders, auditLogs, currentUser } = useInventory();

  // Active view: either one of the CSV files, or schema.sql, or architecture
  const [selectedFileKey, setSelectedFileKey] = useState<string>('items');
  const [viewMode, setViewMode] = useState<'table' | 'raw' | 'schema'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Schema SQL text
  const schemaSqlText = useMemo(() => {
    return `-- ============================================================================
-- APEX HEALTH NETWORK - HOSPITAL INVENTORY INTELLIGENCE DATABASE SCHEMA
-- Target RDBMS: PostgreSQL 14+ / Cloud SQL / Supabase / Amazon Aurora
-- Generated from Application Static Data (.csv files)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Metropolitan',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LOCATIONS (Storage Units, ICUs, Wards) -> CSV: locations.csv
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Central Store', 'ICU', 'Emergency', 'Surgical Suite', 'Oncology', 'Ward')),
    hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_locations_hospital ON locations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- 3. USERS (Staff Accounts & RBAC) -> CSV: users.csv
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Hospital Administrator', 'Inventory Manager', 'Pharmacist', 'Procurement Manager', 'Doctor', 'Nurse')),
    hospital_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10),
    department VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. ITEMS (Master Medicines & SKUs Catalog) -> CSV: items.csv
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    supplier VARCHAR(150) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    reorder_level INT NOT NULL DEFAULT 100 CHECK (reorder_level >= 0),
    safety_stock INT NOT NULL DEFAULT 50 CHECK (safety_stock >= 0),
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    storage_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier);

-- 5. BATCHES (Physical Lots & Expiries) -> CSV: batches.csv
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INT NOT NULL CHECK (quantity_received >= 0),
    current_stock INT NOT NULL CHECK (current_stock >= 0),
    location_id VARCHAR(50) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantine', 'depleted', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_lte_received CHECK (current_stock <= quantity_received)
);
CREATE INDEX IF NOT EXISTS idx_batches_item ON batches(item_id);
CREATE INDEX IF NOT EXISTS idx_batches_location ON batches(location_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

-- 6. PURCHASE_ORDERS (Replenishment Pipeline) -> CSV: purchase_orders.csv
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    expected_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delayed', 'cancelled', 'received')),
    supplier VARCHAR(150) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_po_item ON purchase_orders(item_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- 7. CONSUMPTION_HISTORY (60-Day Ward Run-Rates) -> CSV: consumption_history.csv
CREATE TABLE IF NOT EXISTS consumption_history (
    id VARCHAR(100) PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id VARCHAR(50),
    location_id VARCHAR(50) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    quantity_consumed INT NOT NULL CHECK (quantity_consumed >= 0),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cons_item_date ON consumption_history(item_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cons_location ON consumption_history(location_id);
CREATE INDEX IF NOT EXISTS idx_cons_date ON consumption_history(date DESC);

-- 8. AUDIT_LOGS (Traceability & FEFO Compliance) -> CSV: audit_logs.csv
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

-- BULK IMPORT COMMANDS (psql / Cloud SQL):
-- \\copy locations FROM 'locations.csv' WITH (FORMAT csv, HEADER true);
-- \\copy users FROM 'users.csv' WITH (FORMAT csv, HEADER true);
-- \\copy items FROM 'items.csv' WITH (FORMAT csv, HEADER true);
-- \\copy batches FROM 'batches.csv' WITH (FORMAT csv, HEADER true);
-- \\copy purchase_orders FROM 'purchase_orders.csv' WITH (FORMAT csv, HEADER true);
-- \\copy consumption_history FROM 'consumption_history.csv' WITH (FORMAT csv, HEADER true);
-- \\copy audit_logs FROM 'audit_logs.csv' WITH (FORMAT csv, HEADER true);`;
  }, []);

  // Table list metadata
  const tables = useMemo(() => [
    {
      key: 'items',
      label: 'items.csv',
      title: 'Master SKUs & Medicines Catalog',
      icon: Boxes,
      table: 'items',
      recordsCount: items.length,
      columnsCount: 12,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.items.content,
      description: 'Master catalog containing unit costs, reorder levels, safety stocks, and storage condition specs.',
    },
    {
      key: 'batches',
      label: 'batches.csv',
      title: 'Warehouse Batches & Physical Lots',
      icon: Layers,
      table: 'batches',
      recordsCount: batches.length,
      columnsCount: 10,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.batches.content,
      description: 'Physical inventory lots with batch IDs, manufacture/expiry dates, on-hand counts, and location FKs.',
    },
    {
      key: 'locations',
      label: 'locations.csv',
      title: 'Hospital Network Sites & Storage Units',
      icon: Building2,
      table: 'locations',
      recordsCount: locations.length,
      columnsCount: 5,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.locations.content,
      description: 'Central pharmacy warehouses, ICUs, emergency trauma rooms, surgical suites across hospitals.',
    },
    {
      key: 'purchaseOrders',
      label: 'purchase_orders.csv',
      title: 'Inbound Procurement Orders',
      icon: ShoppingCart,
      table: 'purchase_orders',
      recordsCount: purchaseOrders.length,
      columnsCount: 8,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.purchaseOrders.content,
      description: 'Pending and approved replenishment orders with contract pricing, suppliers, and expected dates.',
    },
    {
      key: 'users',
      label: 'users.csv',
      title: 'Staff Accounts & Clinical RBAC',
      icon: UserCheck,
      table: 'users',
      recordsCount: 4,
      columnsCount: 7,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.users.content,
      description: 'Institutional user accounts for Administrator, Pharmacist, Inventory Manager, and Procurement Head.',
    },
    {
      key: 'auditLogs',
      label: 'audit_logs.csv',
      title: 'Traceability & FEFO Audit Trail',
      icon: FileClock,
      table: 'audit_logs',
      recordsCount: auditLogs.length,
      columnsCount: 7,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.auditLogs.content,
      description: 'Regulatory audit events: FEFO auto-allocations, quarantine triggers, manual overrides, and logins.',
    },
    {
      key: 'consumptionHistory',
      label: 'consumption_history.csv',
      title: '60-Day Historical Ward Dispensing',
      icon: TrendingUp,
      table: 'consumption_history',
      recordsCount: 1800,
      columnsCount: 7,
      primaryKey: 'id',
      rawContent: RAW_CSV_FILES.consumptionHistory.content,
      description: 'Historical daily consumption logs by item, department, and date used to calculate consumption run-rates.',
    },
  ], [items, batches, locations, purchaseOrders, auditLogs]);

  const currentTable = tables.find(t => t.key === selectedFileKey) || tables[0];

  // Parse table rows
  const parsedRows = useMemo(() => {
    return parseCsv(currentTable.rawContent);
  }, [currentTable]);

  // Headers
  const tableHeaders = useMemo(() => {
    if (parsedRows.length === 0) return [];
    return Object.keys(parsedRows[0]);
  }, [parsedRows]);

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return parsedRows;
    const q = searchQuery.toLowerCase();
    return parsedRows.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [parsedRows, searchQuery]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download individual CSV
  const handleDownloadCsv = (tableInfo = currentTable) => {
    downloadFile(tableInfo.label, tableInfo.rawContent, 'text/csv;charset=utf-8;');
    setDownloadSuccess(`Downloaded ${tableInfo.label}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download live modified table as CSV
  const handleDownloadLiveCsv = () => {
    let liveRows: any[] = [];
    if (currentTable.key === 'items') liveRows = items;
    else if (currentTable.key === 'batches') liveRows = batches;
    else if (currentTable.key === 'locations') liveRows = locations;
    else if (currentTable.key === 'purchaseOrders') liveRows = purchaseOrders;
    else liveRows = parsedRows;

    const csvStr = toCsvString(liveRows);
    downloadFile(`live_${currentTable.label}`, csvStr, 'text/csv;charset=utf-8;');
    setDownloadSuccess(`Exported live ${currentTable.label}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download individual XLS
  const handleDownloadXls = () => {
    downloadAsExcelXls(`${currentTable.table}_export.xls`, currentTable.table, parsedRows, tableHeaders);
    setDownloadSuccess(`Exported ${currentTable.label} as Excel XLS`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download All CSVs sequentially
  const handleDownloadAllCsvs = () => {
    tables.forEach((t, idx) => {
      setTimeout(() => {
        downloadFile(t.label, t.rawContent, 'text/csv;charset=utf-8;');
      }, idx * 250);
    });
    setDownloadSuccess('Initiated bulk download for all 7 CSV files');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Download SQL DDL schema
  const handleDownloadSchemaSql = () => {
    downloadFile('schema.sql', schemaSqlText, 'application/sql;charset=utf-8;');
    setDownloadSuccess('Downloaded database schema.sql');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              Relational Database Preparation &amp; CSV Data Repository
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Hospital Inventory Static Data (.CSV / .XLS) Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              All hardcoded static data has been migrated out of application script files into structured, relational <code className="text-emerald-400 font-mono bg-slate-800/80 px-1 py-0.5 rounded">.csv</code> files in <code className="text-emerald-400 font-mono bg-slate-800/80 px-1 py-0.5 rounded">/public/data/csv/</code> and <code className="text-emerald-400 font-mono bg-slate-800/80 px-1 py-0.5 rounded">/src/data/csv/</code>.
              These files are ready to seed your PostgreSQL, Cloud SQL, Supabase, or MySQL database.
            </p>
          </div>

          {/* Master Download Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadAllCsvs}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Download All 7 CSVs
            </button>
            <button
              onClick={handleDownloadSchemaSql}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-2 border border-indigo-400/30"
            >
              <FileCode className="w-4 h-4" />
              Download schema.sql
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {downloadSuccess && (
          <div className="mt-4 px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Database Schema Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Relational Tables</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">7 Tables</div>
          <div className="text-[11px] text-slate-500 mt-1">Full 3NF relational model</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Static Records</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">1,888 Rows</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 7 standard CSV tables</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Database Engine</span>
            <Code2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">PostgreSQL / SQL</div>
          <div className="text-[11px] text-slate-500 mt-1">Compatible with Cloud SQL</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Public Location</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xs font-mono font-bold text-slate-800 truncate mt-1">/public/data/csv/</div>
          <div className="text-[11px] text-slate-500 mt-1">Directly accessible via HTTP</div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Selector Subtabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-2 overflow-x-auto flex items-center gap-1.5">
          {tables.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedFileKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedFileKey(tab.key);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.recordsCount}
                </span>
              </button>
            );
          })}

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* SQL Schema View Tab */}
          <button
            onClick={() => setViewMode(viewMode === 'schema' ? 'table' : 'schema')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              viewMode === 'schema'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>schema.sql (DDL)</span>
          </button>
        </div>

        {/* View Mode & Table Action Header */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                TABLE: {currentTable.table}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-600 font-medium">Primary Key: <code className="font-mono font-bold text-slate-900">{currentTable.primaryKey}</code></span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-500">{currentTable.columnsCount} Columns</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{currentTable.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentTable.description}</p>
          </div>

          {/* Action buttons for current table */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table View
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'raw' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Raw CSV
              </button>
            </div>

            {/* Download Buttons */}
            <button
              onClick={() => handleDownloadCsv()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Download original CSV file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>.CSV</span>
            </button>

            <button
              onClick={handleDownloadXls}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-emerald-200"
              title="Export as Microsoft Excel XLS spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>.XLS (Excel)</span>
            </button>

            <button
              onClick={() => handleCopy(currentTable.rawContent, currentTable.key)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Copy CSV content to clipboard"
            >
              {copiedKey === currentTable.key ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Section: Table vs Raw CSV vs Schema */}
        {viewMode === 'schema' ? (
          /* SQL SCHEMA VIEW */
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  PostgreSQL / Cloud SQL Relational DDL Script (`database/schema.sql`)
                </h4>
                <p className="text-xs text-slate-500">
                  Ready-to-execute schema definitions, constraints, indexes, and bulk import commands.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(schemaSqlText, 'schema_sql')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-purple-200"
                >
                  {copiedKey === 'schema_sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'schema_sql' ? 'Copied SQL' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={handleDownloadSchemaSql}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
              <pre>{schemaSqlText}</pre>
            </div>
          </div>
        ) : viewMode === 'raw' ? (
          /* RAW CSV VIEW */
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Raw CSV content stored in <code className="text-indigo-600 font-bold">/public/data/csv/{currentTable.label}</code></span>
              <span>{currentTable.rawContent.length.toLocaleString()} bytes</span>
            </div>
            <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed whitespace-pre">
              {currentTable.rawContent}
            </div>
          </div>
        ) : (
          /* TABLE VIEW */
          <div>
            {/* Search filter within table */}
            <div className="p-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${currentTable.label} rows...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{filteredRows.length}</span> of {parsedRows.length} records
              </div>
            </div>

            {/* Scrollable Data Table */}
            <div className="overflow-x-auto max-h-[540px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
                    {tableHeaders.map(col => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{col}</span>
                          {col === currentTable.primaryKey && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">PK</span>
                          )}
                          {col.toLowerCase().endsWith('id') && col !== currentTable.primaryKey && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-100 text-indigo-700 rounded font-semibold">FK</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.slice(0, 200).map((row, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/40 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      {tableHeaders.map(col => {
                        const val = row[col];
                        const isPk = col === currentTable.primaryKey;
                        return (
                          <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-700">
                            {isPk ? (
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded">
                                {String(val)}
                              </span>
                            ) : typeof val === 'object' ? (
                              <code className="text-[11px] text-slate-600 bg-slate-100 px-1 rounded truncate max-w-[200px] inline-block">
                                {JSON.stringify(val)}
                              </code>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono text-slate-900 font-medium">{val.toLocaleString()}</span>
                            ) : (
                              <span>{String(val ?? '')}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredRows.length > 200 && (
                    <tr>
                      <td colSpan={tableHeaders.length + 1} className="py-3 text-center text-slate-400 text-xs italic bg-slate-50">
                        Showing first 200 of {filteredRows.length} rows. Download full CSV or XLS for complete dataset.
                      </td>
                    </tr>
                  )}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={tableHeaders.length + 1} className="py-8 text-center text-slate-400 text-xs">
                        No records match query &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Database Design & Entity Relationship Architecture Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Relational Architecture &amp; Database Design Blueprint
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How these 7 CSV files map into your target relational database tables for hospital supply chain analytics.
            </p>
          </div>
          <button
            onClick={() => handleCopy(
              `-- PostgreSQL Copy Commands:\n\\copy locations FROM 'locations.csv' WITH (FORMAT csv, HEADER true);\n\\copy users FROM 'users.csv' WITH (FORMAT csv, HEADER true);\n\\copy items FROM 'items.csv' WITH (FORMAT csv, HEADER true);\n\\copy batches FROM 'batches.csv' WITH (FORMAT csv, HEADER true);\n\\copy purchase_orders FROM 'purchase_orders.csv' WITH (FORMAT csv, HEADER true);\n\\copy consumption_history FROM 'consumption_history.csv' WITH (FORMAT csv, HEADER true);\n\\copy audit_logs FROM 'audit_logs.csv' WITH (FORMAT csv, HEADER true);`,
              'import_commands'
            )}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {copiedKey === 'import_commands' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy psql \\copy Commands</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
              Catalog &amp; Inventory Wards
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700">items</strong> is the master parent table. <strong className="text-slate-700">batches</strong> references <code className="text-indigo-600 font-mono">items.id</code> and <code className="text-indigo-600 font-mono">locations.id</code>.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Run-Rate &amp; FEFO Dispatch
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700">consumption_history</strong> stores 60-day ward transactions to power the daily consumption velocity and expiry forecasting algorithms.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
              Pipeline &amp; Compliance Audit
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700">purchase_orders</strong> tracks inbound shipments. <strong className="text-slate-700">audit_logs</strong> records automated FEFO allocations, quarantines, and overrides.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
