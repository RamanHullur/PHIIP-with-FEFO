import { Item, Batch, Location, PurchaseOrder, ConsumptionRecord, AuditLog, UserAccount } from '../types/inventory';
import { parseCsv } from '../utils/csvParser';

// Import raw CSV static dataset files
import itemsCsv from './csv/items.csv?raw';
import batchesCsv from './csv/batches.csv?raw';
import locationsCsv from './csv/locations.csv?raw';
import posCsv from './csv/purchase_orders.csv?raw';
import auditLogsCsv from './csv/audit_logs.csv?raw';
import usersCsv from './csv/users.csv?raw';
import consumptionCsv from './csv/consumption_history.csv?raw';

// Anchor date: 2026-10-05
export const DEMO_DATE = '2026-10-05';

// Export raw CSV strings for download, viewing, and database migration
export const RAW_CSV_FILES = {
  items: { filename: 'items.csv', title: 'Master SKUs & Medicines Catalog', content: itemsCsv, table: 'items' },
  batches: { filename: 'batches.csv', title: 'Warehouse Batches & Physical Lots', content: batchesCsv, table: 'batches' },
  locations: { filename: 'locations.csv', title: 'Hospital Facilities & Storage Units', content: locationsCsv, table: 'locations' },
  purchaseOrders: { filename: 'purchase_orders.csv', title: 'Inbound Procurement Orders', content: posCsv, table: 'purchase_orders' },
  users: { filename: 'users.csv', title: 'User Accounts & Clinical RBAC', content: usersCsv, table: 'users' },
  auditLogs: { filename: 'audit_logs.csv', title: 'Traceability & FEFO Audit Trail', content: auditLogsCsv, table: 'audit_logs' },
  consumptionHistory: { filename: 'consumption_history.csv', title: '60-Day Historical Ward Dispensing Records', content: consumptionCsv, table: 'consumption_history' },
};

// Parse structured entities dynamically from the CSV files
export const INITIAL_LOCATIONS: Location[] = parseCsv<Location>(locationsCsv);
export const INITIAL_ITEMS: Item[] = parseCsv<Item>(itemsCsv);
export const INITIAL_BATCHES: Batch[] = parseCsv<Batch>(batchesCsv);
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = parseCsv<PurchaseOrder>(posCsv);
export const INITIAL_AUDIT_LOGS: AuditLog[] = parseCsv<AuditLog>(auditLogsCsv);
export const INITIAL_USERS: UserAccount[] = parseCsv<UserAccount>(usersCsv);

// Historical consumption loaded from consumption_history.csv
export function generateMockConsumptionHistory(): ConsumptionRecord[] {
  const records = parseCsv<ConsumptionRecord>(consumptionCsv);
  return records;
}
