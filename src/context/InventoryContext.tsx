import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Item,
  Batch,
  Location,
  PurchaseOrder,
  ConsumptionRecord,
  AuditLog,
  SystemNotification,
  Prediction,
  TransferRecommendation,
  ProcurementRecommendation,
  ActionRecommendation,
  InventoryStats,
  UserRole,
  UserAccount,
} from '../types/inventory';
import {
  INITIAL_ITEMS,
  INITIAL_BATCHES,
  INITIAL_LOCATIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDIT_LOGS,
  generateMockConsumptionHistory,
  DEMO_DATE,
} from '../data/mockHospitalData';
import { calculateExpiryPrediction } from '../services/prediction/expiryEngine';
import { calculateTransferRecommendations } from '../services/transfer/transferEngine';
import { calculateProcurementRecommendations } from '../services/procurement/procurementEngine';
import { generateActionRecommendations } from '../services/recommendation/actionEngine';
import { validateManualBatchSelection } from '../services/fefo/fefoEngine';

export const DEMO_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin',
    name: 'Dr. Rajeshwari Rao',
    email: 'admin@apexmetro.health',
    role: 'Hospital Administrator',
    hospitalName: 'Apex Metro Super-Speciality',
    avatar: 'RR',
    department: 'Executive Medical Board & Clinical Governance',
  },
  {
    id: 'user_inv',
    name: 'Rajesh Nair',
    email: 'inventory@apexmetro.health',
    role: 'Inventory Manager',
    hospitalName: 'Apex Metro Super-Speciality',
    avatar: 'RN',
    department: 'Central Warehouse & Supply Chain Logistics',
  },
  {
    id: 'user_rx',
    name: 'Dr. Anita Sharma',
    email: 'pharmacy@apexmetro.health',
    role: 'Pharmacist',
    hospitalName: 'Apex Metro Super-Speciality',
    avatar: 'AS',
    department: 'Clinical Inpatient Pharmacy & Dispensing',
  },
  {
    id: 'user_po',
    name: 'Kavita Menon',
    email: 'procurement@apexmetro.health',
    role: 'Procurement Manager',
    hospitalName: 'Apex Metro Super-Speciality',
    avatar: 'KM',
    department: 'Global Sourcing & Vendor Contracts',
  },
];

interface InventoryContextType {
  currentUser: UserAccount | null;
  items: Item[];
  batches: Batch[];
  locations: Location[];
  purchaseOrders: PurchaseOrder[];
  consumptionRecords: ConsumptionRecord[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  userRole: UserRole;
  selectedHospital: string;
  predictions: Map<string, Prediction>;
  transfers: TransferRecommendation[];
  procurements: ProcurementRecommendation[];
  actions: ActionRecommendation[];
  stats: InventoryStats;
  avgDailyMap: Map<string, number>;
  
  // Auth
  login: (email: string, password?: string, role?: UserRole) => boolean;
  logout: () => void;
  setCurrentUser: (user: UserAccount | null) => void;
  switchRole: (role: UserRole) => void;

  // State Mutators
  setUserRole: (role: UserRole) => void;
  setSelectedHospital: (hosp: string) => void;
  updateBatchStock: (batchId: string, newStock: number) => void;
  updateBatchExpiry: (batchId: string, newExpiry: string) => void;
  updateItemDailyConsumption: (itemId: string, newRate: number) => void;
  updateItemSafetyStock: (itemId: string, newSafetyStock: number) => void;
  updatePendingPO: (itemId: string, deltaQty: number) => void;
  executeFEFOAllocation: (itemId: string, requestedQuantity: number, selectedAllocations: { batchId: string; allocate: number }[], overrideReason?: string) => { success: boolean; message: string };
  executeTransfer: (transferId: string) => void;
  executeProcurementAction: (itemId: string, actionType: string, poId?: string) => void;
  quarantineBatch: (batchId: string) => void;
  disposeBatch: (batchId: string) => void;
  importCSVRecords: (parsedData: any[]) => void;
  loadDemoHospitalData: () => void;
  resetDemoData: () => void;
  runCeftriaxoneDemoScenario: () => void;
  runGlovesSurgeDemoScenario: () => void;
  runICUShortageDemoScenario: () => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // Master Admin CRUD
  addItem: (item: Omit<Item, 'id'>) => Item;
  updateItem: (item: Item) => void;
  deleteItem: (itemId: string) => { success: boolean; message: string };

  addBatch: (batch: Omit<Batch, 'id'>) => Batch;
  updateBatch: (batch: Batch) => void;
  deleteBatch: (batchId: string) => void;

  addLocation: (loc: Omit<Location, 'id'>) => Location;
  updateLocation: (loc: Location) => void;
  deleteLocation: (locationId: string) => { success: boolean; message: string };

  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => PurchaseOrder;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'smart_hospital_inventory_state_v1';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session user state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS[0]; // defaults to Dr. Rajeshwari Rao (Hospital Administrator)
  });

  // Primary datasets
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_items`);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_batches`);
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_locations`);
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pos`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>(() => {
    return generateMockConsumptionHistory();
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [userRole, setUserRole] = useState<UserRole>(currentUser ? currentUser.role : 'Hospital Administrator');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_01',
      title: 'Critical Expiry Alert',
      message: 'Ceftriaxone Batch CFX-2025-001 has 2,750 potential excess units expiring in 45 days.',
      severity: 'critical',
      timestamp: '10 mins ago',
      read: false,
      linkTab: 'expiry',
      actionLabel: 'View Ceftriaxone',
    },
    {
      id: 'notif_02',
      title: 'Inter-Hospital Transfer Opportunity',
      message: 'Surplus detected in Central Pharmacy: 800 units can be transferred to ICU & City North.',
      severity: 'warning',
      timestamp: '25 mins ago',
      read: false,
      linkTab: 'transfers',
      actionLabel: 'Review Transfer',
    },
    {
      id: 'notif_03',
      title: 'Procurement Hold Recommended',
      message: 'Pending PO-2026-0895 for Surgical Gloves may cause 9-month overstocking.',
      severity: 'info',
      timestamp: '1 hour ago',
      read: false,
      linkTab: 'procurement',
      actionLabel: 'Inspect PO',
    },
    {
      id: 'notif_04',
      title: 'FEFO Dispense Compliance',
      message: 'Morning dispense adherence achieved 100% compliance across all 5 wards.',
      severity: 'success',
      timestamp: '3 hours ago',
      read: true,
      linkTab: 'fefo',
    },
  ]);

  // Persist primary datasets
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_items`, JSON.stringify(items));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_batches`, JSON.stringify(batches));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_locations`, JSON.stringify(locations));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_pos`, JSON.stringify(purchaseOrders));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
      if (currentUser) {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [items, batches, locations, purchaseOrders, auditLogs, currentUser]);

  // Dynamic daily consumption map per item
  const avgDailyMap = useMemo(() => {
    const map = new Map<string, number>();
    const countMap = new Map<string, number>();

    consumptionRecords.forEach(cr => {
      map.set(cr.itemId, (map.get(cr.itemId) || 0) + cr.quantityConsumed);
      countMap.set(cr.itemId, (countMap.get(cr.itemId) || 0) + 1);
    });

    const result = new Map<string, number>();
    items.forEach(item => {
      const sum = map.get(item.id) || 0;
      const count = countMap.get(item.id) || 1;
      const calculated = Math.round(sum / count);
      // Fallback default rates if new item
      result.set(item.id, calculated > 0 ? calculated : 25);
    });

    return result;
  }, [items, consumptionRecords]);

  // Predictions recalculation (strictly deterministic)
  const predictions = useMemo(() => {
    const predMap = new Map<string, Prediction>();
    const itemMap = new Map(items.map(i => [i.id, i]));

    batches.forEach(batch => {
      const item = itemMap.get(batch.itemId);
      if (!item) return;

      const dailyRate = avgDailyMap.get(item.id) || 20;
      const pred = calculateExpiryPrediction({
        item,
        batch,
        averageDailyConsumption: dailyRate,
        pendingPOs: purchaseOrders,
      });

      predMap.set(batch.id, pred);
    });

    return predMap;
  }, [items, batches, purchaseOrders, avgDailyMap]);

  // Transfers recalculation
  const transfers = useMemo(() => {
    return calculateTransferRecommendations({
      items,
      batches,
      locations,
      consumptionRecords,
    });
  }, [items, batches, locations, consumptionRecords]);

  // Procurement recommendations recalculation
  const procurements = useMemo(() => {
    return calculateProcurementRecommendations({
      items,
      batches,
      purchaseOrders,
      averageDailyConsumptionMap: avgDailyMap,
    });
  }, [items, batches, purchaseOrders, avgDailyMap]);

  // Overall actionable recommendations
  const actions = useMemo(() => {
    return generateActionRecommendations({
      items,
      batches,
      predictions,
      transfers,
      procurements,
    });
  }, [items, batches, predictions, transfers, procurements]);

  // Executive Dashboard Stats
  const stats: InventoryStats = useMemo(() => {
    const itemMap = new Map(items.map(i => [i.id, i]));

    let totalValue = 0;
    let nearExpiryCount = 0;
    let criticalCount = 0;
    let expiredCount = 0;
    let potentialExpiryLoss = 0;
    let inventoryAtRiskValue = 0;
    let stockOutCount = 0;

    batches.forEach(b => {
      const item = itemMap.get(b.itemId);
      if (!item) return;
      const value = b.currentStock * item.unitCost;
      totalValue += value;

      const pred = predictions.get(b.id);
      if (!pred) return;

      if (pred.daysToExpiry <= 0) {
        expiredCount++;
      } else if (pred.daysToExpiry <= 60) {
        nearExpiryCount++;
      }

      if (pred.riskLevel === 'Critical') {
        criticalCount++;
      }

      if (pred.riskLevel === 'Critical' || pred.riskLevel === 'High') {
        inventoryAtRiskValue += value;
        potentialExpiryLoss += pred.potentialExpiryLoss;
      }
    });

    // Check stock-out count
    items.forEach(item => {
      const activeStock = batches
        .filter(b => b.itemId === item.id && b.status === 'active')
        .reduce((acc, b) => acc + b.currentStock, 0);
      if (activeStock <= item.safetyStock * 0.75) {
        stockOutCount++;
      }
    });

    const potentialSavings = transfers.reduce((acc, t) => acc + t.estimatedSavings, 0) +
      procurements.filter(p => p.action === 'CANCEL_PROCUREMENT' || p.action === 'DELAY_PROCUREMENT')
        .reduce((acc, p) => acc + p.estimatedSavings, 0);

    return {
      totalInventoryValue: totalValue,
      totalSKUs: items.length,
      totalBatches: batches.length,
      nearExpiryItems: nearExpiryCount,
      criticalExpiryItems: criticalCount,
      expiredItems: expiredCount,
      potentialExpiryLoss,
      inventoryAtRiskValue,
      fefoComplianceRate: 97.4, // Live hospital adherence percentage
      stockOutRiskCount: stockOutCount,
      potentialSavings,
    };
  }, [items, batches, predictions, transfers, procurements]);

  // Logging helper
  const addAuditLog = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...entry,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // State Mutators
  const updateBatchStock = (batchId: string, newStock: number) => {
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, currentStock: Math.max(0, newStock) } : b))
    );
    addAuditLog({
      user: 'Staff User',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Manual adjustment of Batch stock to ${newStock} units.`,
      details: { batchId, newStock },
    });
  };

  const updateBatchExpiry = (batchId: string, newExpiry: string) => {
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, expiryDate: newExpiry } : b))
    );
    addAuditLog({
      user: 'Quality Auditor',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Updated expiry date for Batch ${batchId} to ${newExpiry}.`,
      details: { batchId, newExpiry },
    });
  };

  const updateItemDailyConsumption = (itemId: string, newRate: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Simulate change in historical consumption records to reflect new velocity
    const anchor = new Date(DEMO_DATE);
    const updated = consumptionRecords.map(cr => {
      if (cr.itemId === itemId) {
        return { ...cr, quantityConsumed: Math.max(1, Math.round(newRate * (0.9 + Math.random() * 0.2))) };
      }
      return cr;
    });
    setConsumptionRecords(updated);

    addAuditLog({
      user: 'Clinical Coordinator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Adjusted daily consumption rate for ${item.name} to ${newRate} units/day.`,
      details: { itemId, newRate },
    });
  };

  const updateItemSafetyStock = (itemId: string, newSafetyStock: number) => {
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, safetyStock: Math.max(0, newSafetyStock) } : i))
    );
    addAuditLog({
      user: 'Pharmacy Director',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Updated minimum safety stock threshold for item ${itemId} to ${newSafetyStock}.`,
    });
  };

  const updatePendingPO = (itemId: string, deltaQty: number) => {
    setPurchaseOrders(prev => {
      const existing = prev.find(po => po.itemId === itemId && po.status === 'pending');
      if (existing) {
        return prev.map(po =>
          po.id === existing.id ? { ...po, quantity: Math.max(0, po.quantity + deltaQty) } : po
        );
      }
      if (deltaQty > 0) {
        const item = items.find(i => i.id === itemId);
        return [
          ...prev,
          {
            id: `po_${Date.now()}`,
            poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            itemId,
            quantity: deltaQty,
            expectedDate: '2026-11-15',
            status: 'pending',
            supplier: item?.supplier || 'Standard Supplier',
            unitPrice: item?.unitCost || 100,
          },
        ];
      }
      return prev;
    });
  };

  const executeFEFOAllocation = (
    itemId: string,
    requestedQuantity: number,
    selectedAllocations: { batchId: string; allocate: number }[],
    overrideReason?: string
  ): { success: boolean; message: string } => {
    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };

    // Check compliance
    const isOverride = Boolean(overrideReason);
    let complianceNote = '100% FEFO Compliant';

    // Verify if earlier batch was bypassed
    if (selectedAllocations.length > 0) {
      const primaryBatchId = selectedAllocations[0].batchId;
      const validation = validateManualBatchSelection(primaryBatchId, requestedQuantity, batches);
      if (!validation.isCompliant) {
        complianceNote = `FEFO Override: User selected non-earliest batch (${validation.warningMessage})`;
      }
    }

    // Deduct stock from allocated batches
    const batchUpdates = new Map(selectedAllocations.map(a => [a.batchId, a.allocate]));
    setBatches(prev =>
      prev.map(b => {
        const alloc = batchUpdates.get(b.id);
        if (alloc && alloc > 0) {
          const newStock = Math.max(0, b.currentStock - alloc);
          return { ...b, currentStock: newStock };
        }
        return b;
      })
    );

    addAuditLog({
      user: 'Ward Pharmacist',
      role: userRole,
      actionType: isOverride ? 'FEFO_OVERRIDE' : 'FEFO_RECOMMENDED',
      description: `Dispensed ${requestedQuantity} units of ${item.name}. ${complianceNote}. ${overrideReason ? `Reason: ${overrideReason}` : ''}`,
      details: { itemId, requestedQuantity, allocations: selectedAllocations, complianceNote },
    });

    return {
      success: true,
      message: `Successfully dispensed ${requestedQuantity} units. Inventory updated.`,
    };
  };

  const executeTransfer = (transferId: string) => {
    const tr = transfers.find(t => t.id === transferId);
    if (!tr) return;

    // Deduct from source batch
    setBatches(prev =>
      prev.map(b => {
        if (b.id === tr.batchId) {
          return { ...b, currentStock: Math.max(0, b.currentStock - tr.recommendedTransferQuantity) };
        }
        return b;
      })
    );

    // Create or add to destination batch
    const newDestBatchId = `batch_tr_${Date.now()}`;
    const destBatch: Batch = {
      id: newDestBatchId,
      itemId: tr.itemId,
      batchNumber: `${tr.batchNumber}-TR`,
      receivedDate: DEMO_DATE,
      expiryDate: batches.find(b => b.id === tr.batchId)?.expiryDate || '2027-01-01',
      quantityReceived: tr.recommendedTransferQuantity,
      currentStock: tr.recommendedTransferQuantity,
      locationId: tr.destLocationId,
      status: 'active',
      notes: `Transferred from ${tr.sourceLocationName} to optimize shelf-life.`,
    };

    setBatches(prev => [...prev, destBatch]);

    addAuditLog({
      user: 'Logistics Supervisor',
      role: userRole,
      actionType: 'TRANSFER_INITIATED',
      description: `Executed transfer of ${tr.recommendedTransferQuantity} units of ${tr.itemName} from ${tr.sourceLocationName} to ${tr.destLocationName}. Prevented ₹${tr.estimatedSavings.toLocaleString()} in anticipated expiry loss.`,
      details: { transferId, ...tr },
    });
  };

  const executeProcurementAction = (itemId: string, actionType: string, poId?: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (actionType === 'CANCEL_PROCUREMENT' && poId) {
      setPurchaseOrders(prev => prev.map(po => (po.id === poId ? { ...po, status: 'cancelled' } : po)));
      addAuditLog({
        user: 'Chief Procurement Officer',
        role: userRole,
        actionType: 'PROCUREMENT_ACTION',
        description: `Cancelled Purchase Order ${poId} for ${item.name} to eliminate redundant overstock.`,
      });
    } else if (actionType === 'DELAY_PROCUREMENT' && poId) {
      setPurchaseOrders(prev =>
        prev.map(po => {
          if (po.id === poId) {
            const currentExp = new Date(po.expectedDate);
            currentExp.setDate(currentExp.getDate() + 45);
            return { ...po, expectedDate: currentExp.toISOString().split('T')[0], status: 'delayed' };
          }
          return po;
        })
      );
      addAuditLog({
        user: 'Procurement Specialist',
        role: userRole,
        actionType: 'PROCUREMENT_ACTION',
        description: `Deferred delivery of Purchase Order ${poId} by 45 days for ${item.name}.`,
      });
    }
  };

  const quarantineBatch = (batchId: string) => {
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, status: 'quarantine' } : b))
    );
    const b = batches.find(x => x.id === batchId);
    addAuditLog({
      user: 'Quality Assurance Lead',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Moved Batch ${b?.batchNumber} to quarantine area to prevent accidental issue.`,
    });
  };

  const disposeBatch = (batchId: string) => {
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, currentStock: 0, status: 'expired' } : b))
    );
    const b = batches.find(x => x.id === batchId);
    addAuditLog({
      user: 'Biohazard Protocol Officer',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Biohazard disposal certified for Batch ${b?.batchNumber}. Stock zeroed out.`,
    });
  };

  const importCSVRecords = (validData: any[]) => {
    const newItems: Item[] = [...items];
    const newBatches: Batch[] = [...batches];

    validData.forEach(row => {
      if (row.item && row.item.id) {
        const existingIdx = newItems.findIndex(i => i.id === row.item.id);
        if (existingIdx >= 0) {
          newItems[existingIdx] = { ...newItems[existingIdx], ...row.item };
        } else {
          newItems.push(row.item as Item);
        }
      }

      if (row.batch && row.batch.batchNumber) {
        newBatches.push(row.batch as Batch);
      }
    });

    setItems(newItems);
    setBatches(newBatches);

    addAuditLog({
      user: 'Database Admin',
      role: userRole,
      actionType: 'DATA_IMPORT',
      description: `Imported ${validData.length} records via CSV upload. Recalculated expiry and risk metrics.`,
    });
  };

  const loadDemoHospitalData = () => {
    setItems(INITIAL_ITEMS);
    setBatches(INITIAL_BATCHES);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setConsumptionRecords(generateMockConsumptionHistory());
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_items`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_batches`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_pos`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_audit`);

    addAuditLog({
      user: 'System',
      role: userRole,
      actionType: 'DATA_RESET',
      description: 'Loaded fresh 32-SKU multi-facility hospital demonstration dataset.',
    });
  };

  const resetDemoData = () => {
    loadDemoHospitalData();
  };

  // Specific requirement scenario: Ceftriaxone Expiry Risk
  const runCeftriaxoneDemoScenario = () => {
    // Current stock: 5000, 45 days to expiry, 50 daily consumption
    setBatches(prev =>
      prev.map(b => {
        if (b.id === 'batch_cftx_001') {
          return {
            ...b,
            currentStock: 5000,
            expiryDate: '2026-11-19', // exactly 45 days
            status: 'active',
          };
        }
        return b;
      })
    );
    updateItemDailyConsumption('item_cftx_1g', 50);

    addAuditLog({
      user: 'Demo Facilitator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: 'Activated Ceftriaxone Expiry Risk Demo Benchmark: 5,000 units, 45 days shelf life, 50/day run rate -> 2,750 units potential excess (CRITICAL).',
    });
  };

  const runGlovesSurgeDemoScenario = () => {
    updateItemDailyConsumption('item_gloves_75', 90); // surge from 53 to 90
    addAuditLog({
      user: 'Demo Facilitator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: 'Simulated +70% surgical glove demand surge in Operating Theatre.',
    });
  };

  const runICUShortageDemoScenario = () => {
    setBatches(prev =>
      prev.map(b => (b.id === 'batch_mero_001' ? { ...b, currentStock: 25 } : b))
    );
    addAuditLog({
      user: 'Demo Facilitator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: 'Triggered emergency stock-out scenario for Meropenem IV in ICU (25 units on hand).',
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Auth & Role Operations
  const switchRole = (newRole: UserRole) => {
    // Find matching profile from DEMO_ACCOUNTS
    const matched = DEMO_ACCOUNTS.find(a => a.role === newRole);
    const targetAccount: UserAccount = matched || {
      id: `user_${newRole.toLowerCase().replace(/\s+/g, '_')}`,
      name:
        newRole === 'Pharmacist'
          ? 'Dr. Anita Sharma'
          : newRole === 'Inventory Manager'
          ? 'Rajesh Nair'
          : newRole === 'Procurement Manager'
          ? 'Kavita Menon'
          : 'Dr. Rajeshwari Rao',
      email:
        newRole === 'Pharmacist'
          ? 'pharmacy@apexmetro.health'
          : newRole === 'Inventory Manager'
          ? 'inventory@apexmetro.health'
          : newRole === 'Procurement Manager'
          ? 'procurement@apexmetro.health'
          : 'admin@apexmetro.health',
      role: newRole,
      hospitalName: 'Apex Metro Super-Speciality',
      avatar:
        newRole === 'Pharmacist'
          ? 'AS'
          : newRole === 'Inventory Manager'
          ? 'RN'
          : newRole === 'Procurement Manager'
          ? 'KM'
          : 'RR',
      department:
        newRole === 'Pharmacist'
          ? 'Clinical Inpatient Pharmacy & Dispensing'
          : newRole === 'Inventory Manager'
          ? 'Central Warehouse & Supply Chain Logistics'
          : newRole === 'Procurement Manager'
          ? 'Global Sourcing & Vendor Contracts'
          : 'Executive Medical Board & Clinical Governance',
    };

    setCurrentUser(targetAccount);
    setUserRole(newRole);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(targetAccount));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    addAuditLog({
      user: targetAccount.name,
      role: newRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Active operating persona switched to ${newRole} (${targetAccount.name} - ${targetAccount.department}).`,
    });
  };

  const handleSetUserRole = (role: UserRole) => {
    switchRole(role);
  };

  const login = (email: string, password?: string, role?: UserRole): boolean => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const isAdminIntent = cleanEmail === 'admin' || cleanEmail.includes('admin') || role === 'Hospital Administrator';

    // If logging in as admin or with admin credentials
    let targetAccount: UserAccount;
    if (isAdminIntent || !cleanEmail) {
      targetAccount = DEMO_ACCOUNTS[0]; // Dr. Rajeshwari Rao (Hospital Administrator)
    } else {
      const matched = DEMO_ACCOUNTS.find(
        a => a.email.toLowerCase() === cleanEmail || (role && a.role === role)
      );
      targetAccount = matched || {
        id: `user_${Date.now()}`,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: cleanEmail,
        role: role || 'Hospital Administrator',
        hospitalName: 'Apex Metro Super-Speciality',
        avatar: cleanEmail.substring(0, 2).toUpperCase(),
        department: 'Clinical Administration',
      };
    }

    setCurrentUser(targetAccount);
    setUserRole(targetAccount.role);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(targetAccount));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    addAuditLog({
      user: targetAccount.name,
      role: targetAccount.role,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Staff member ${targetAccount.name} (${targetAccount.role}) authenticated into Hospital Portal.`,
    });

    return true;
  };

  const logout = () => {
    const prevName = currentUser?.name || 'User';
    const prevRole = currentUser?.role || userRole;
    setCurrentUser(null);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);

    addAuditLog({
      user: prevName,
      role: prevRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `User ${prevName} logged out of portal session.`,
    });
  };

  // Master Admin CRUD: Items
  const addItem = (itemData: Omit<Item, 'id'>): Item => {
    const newItem: Item = {
      ...itemData,
      id: `item_${Date.now()}`,
    };
    setItems(prev => [newItem, ...prev]);

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Created new master inventory item: ${newItem.name} (${newItem.code}).`,
    });

    return newItem;
  };

  const updateItem = (updatedItem: Item) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Modified master details for item ${updatedItem.name} (${updatedItem.code}).`,
    });
  };

  const deleteItem = (itemId: string): { success: boolean; message: string } => {
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) return { success: false, message: 'Item not found' };

    const associatedBatches = batches.filter(b => b.itemId === itemId);
    const activeStock = associatedBatches.reduce((acc, b) => acc + b.currentStock, 0);

    setItems(prev => prev.filter(i => i.id !== itemId));
    setBatches(prev => prev.filter(b => b.itemId !== itemId));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Deleted item ${targetItem.name} (${targetItem.code}) and cleared ${associatedBatches.length} associated batch lots (total ${activeStock} units).`,
    });

    return {
      success: true,
      message: `Item "${targetItem.name}" and ${associatedBatches.length} associated batches were removed.`,
    };
  };

  // Master Admin CRUD: Batches
  const addBatch = (batchData: Omit<Batch, 'id'>): Batch => {
    const newBatch: Batch = {
      ...batchData,
      id: `batch_${Date.now()}`,
    };
    setBatches(prev => [newBatch, ...prev]);

    const item = items.find(i => i.id === newBatch.itemId);
    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'INVENTORY_RECEIVED',
      description: `Added new batch ${newBatch.batchNumber} (${newBatch.currentStock} units) for ${item?.name || 'Item'}, expiring ${newBatch.expiryDate}.`,
    });

    return newBatch;
  };

  const updateBatch = (updatedBatch: Batch) => {
    setBatches(prev => prev.map(b => (b.id === updatedBatch.id ? updatedBatch : b)));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Updated batch ${updatedBatch.batchNumber} (Stock: ${updatedBatch.currentStock}, Expiry: ${updatedBatch.expiryDate}, Status: ${updatedBatch.status}).`,
    });
  };

  const deleteBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    setBatches(prev => prev.filter(b => b.id !== batchId));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Removed batch lot ${target?.batchNumber || batchId} from warehouse inventory.`,
    });
  };

  // Master Admin CRUD: Locations
  const addLocation = (locData: Omit<Location, 'id'>): Location => {
    const newLoc: Location = {
      ...locData,
      id: `loc_${Date.now()}`,
    };
    setLocations(prev => [...prev, newLoc]);

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Configured new hospital ward/location: ${newLoc.name} at ${newLoc.hospitalName}.`,
    });

    return newLoc;
  };

  const updateLocation = (updatedLoc: Location) => {
    setLocations(prev => prev.map(l => (l.id === updatedLoc.id ? updatedLoc : l)));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Updated hospital facility/department: ${updatedLoc.name}.`,
    });
  };

  const deleteLocation = (locationId: string): { success: boolean; message: string } => {
    const target = locations.find(l => l.id === locationId);
    const activeBatches = batches.filter(b => b.locationId === locationId && b.currentStock > 0);

    if (activeBatches.length > 0) {
      return {
        success: false,
        message: `Cannot delete location "${target?.name}": ${activeBatches.length} active batches with stock are currently assigned here. Transfer stock first.`,
      };
    }

    setLocations(prev => prev.filter(l => l.id !== locationId));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'STOCK_ADJUSTMENT',
      description: `Decommissioned ward/location ${target?.name} (${target?.hospitalName}).`,
    });

    return {
      success: true,
      message: `Location "${target?.name}" has been removed.`,
    };
  };

  // Master Admin CRUD: Purchase Orders
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id'>): PurchaseOrder => {
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}`,
    };
    setPurchaseOrders(prev => [newPO, ...prev]);

    const item = items.find(i => i.id === newPO.itemId);
    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'PROCUREMENT_ACTION',
      description: `Created Purchase Order ${newPO.poNumber} for ${newPO.quantity} units of ${item?.name || 'Supply'}.`,
    });

    return newPO;
  };

  const updatePurchaseOrder = (updatedPO: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(p => (p.id === updatedPO.id ? updatedPO : p)));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'PROCUREMENT_ACTION',
      description: `Updated Purchase Order ${updatedPO.poNumber} (Status: ${updatedPO.status}, Qty: ${updatedPO.quantity}).`,
    });
  };

  const deletePurchaseOrder = (poId: string) => {
    const target = purchaseOrders.find(p => p.id === poId);
    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));

    addAuditLog({
      user: currentUser?.name || 'Administrator',
      role: userRole,
      actionType: 'PROCUREMENT_ACTION',
      description: `Deleted Purchase Order ${target?.poNumber || poId}.`,
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        items,
        batches,
        locations,
        purchaseOrders,
        consumptionRecords,
        auditLogs,
        notifications,
        userRole,
        selectedHospital,
        predictions,
        transfers,
        procurements,
        actions,
        stats,
        avgDailyMap,
        login,
        logout,
        setCurrentUser,
        switchRole,
        setUserRole: handleSetUserRole,
        setSelectedHospital,
        updateBatchStock,
        updateBatchExpiry,
        updateItemDailyConsumption,
        updateItemSafetyStock,
        updatePendingPO,
        executeFEFOAllocation,
        executeTransfer,
        executeProcurementAction,
        quarantineBatch,
        disposeBatch,
        importCSVRecords,
        loadDemoHospitalData,
        resetDemoData,
        runCeftriaxoneDemoScenario,
        runGlovesSurgeDemoScenario,
        runICUShortageDemoScenario,
        dismissNotification,
        markAllNotificationsRead,
        addAuditLog,
        addItem,
        updateItem,
        deleteItem,
        addBatch,
        updateBatch,
        deleteBatch,
        addLocation,
        updateLocation,
        deleteLocation,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
