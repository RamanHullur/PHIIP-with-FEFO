export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 
  | 'Inventory Manager'
  | 'Pharmacist'
  | 'Procurement Manager'
  | 'Hospital Administrator';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalName: string;
  avatar?: string;
  department?: string;
}

export type RecommendationType =
  | 'PRIORITIZE_CONSUMPTION'
  | 'TRANSFER_INVENTORY'
  | 'INTER_HOSPITAL_TRANSFER'
  | 'RETURN_TO_VENDOR'
  | 'DELAY_PROCUREMENT'
  | 'CANCEL_PROCUREMENT'
  | 'QUARANTINE'
  | 'DISPOSE'
  | 'MONITOR';

export interface Item {
  id: string;
  name: string;
  code: string;
  category: 'Antibiotics' | 'Critical Care' | 'Analgesics' | 'IV Fluids' | 'Consumables & Surgical' | 'Oncology' | 'Laboratory & Reagents';
  manufacturer: string;
  supplier: string;
  unitCost: number; // in USD ($)
  reorderLevel: number;
  safetyStock: number;
  unit: string; // e.g. "Vial", "Ampoule", "Pack of 100", "Infusion Bag", "Box"
  description?: string;
  storageConditions?: string;
}

export interface Batch {
  id: string;
  itemId: string;
  batchNumber: string;
  receivedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantityReceived: number;
  currentStock: number;
  locationId: string;
  status: 'active' | 'quarantine' | 'expired' | 'depleted';
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'Central Store' | 'ICU' | 'Emergency' | 'Oncology' | 'Surgical Suite' | 'General Ward';
  hospitalId: string;
  hospitalName: string;
}

export interface ConsumptionRecord {
  id: string;
  itemId: string;
  batchId: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  quantityConsumed: number;
  department: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  itemId: string;
  quantity: number;
  expectedDate: string; // YYYY-MM-DD
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'delayed';
  supplier: string;
  unitPrice: number;
}

export interface PredictionBreakdown {
  expiryRiskScore: number; // 0 - 30 weight
  excessRiskScore: number; // 0 - 25 weight
  consumptionRiskScore: number; // 0 - 20 weight
  forecastRiskScore: number; // 0 - 15 weight
  poRiskScore: number; // 0 - 10 weight
  daysToExpiry: number;
  expectedConsumption: number;
  potentialExcess: number;
  consumptionVelocityDaily: number;
  safetyStock: number;
}

export interface Prediction {
  itemId: string;
  batchId: string;
  daysToExpiry: number;
  forecastConsumption: number;
  potentialExcess: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  willExpireBeforeUse: 'WILL LIKELY EXPIRE BEFORE USE' | 'Likely to be consumed before expiry';
  confidence: 'Low' | 'Medium' | 'High';
  confidenceReason?: string;
  breakdown: PredictionBreakdown;
  potentialExpiryLoss: number; // $ value
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  daysToExpiry: number;
  available: number;
  allocate: number;
  remaining: number;
  isEarliestExpiry: boolean;
}

export interface FEFORecommendation {
  itemId: string;
  requestedQuantity: number;
  locationId?: string;
  allocations: BatchAllocation[];
  isFullyFulfilled: boolean;
  totalAllocated: number;
  unfulfilledQuantity: number;
  explanation: string;
  isCompliant: boolean;
  overrideWarning?: string;
}

export interface TransferRecommendation {
  id: string;
  itemId: string;
  itemName: string;
  batchId: string;
  batchNumber: string;
  sourceHospital: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destHospital: string;
  destLocationId: string;
  destLocationName: string;
  availableExcess: number;
  destRequirement: number;
  recommendedTransferQuantity: number;
  remainingSourceStock: number;
  expectedExpiryPrevented: number;
  estimatedSavings: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
}

export interface ProcurementRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  pendingPO: number;
  safetyStock: number;
  forecastDemand30d: number;
  reorderPoint: number;
  leadTimeDays: number;
  action: 'DELAY_PROCUREMENT' | 'CANCEL_PROCUREMENT' | 'MAINTAIN' | 'REORDER_NOW' | 'EMERGENCY_ORDER';
  reason: string;
  potentialExcessCreated: number;
  recommendedOrderQuantity: number;
  estimatedSavings: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ActionRecommendation {
  id: string;
  type: RecommendationType;
  itemId: string;
  batchId?: string;
  itemName: string;
  batchNumber?: string;
  quantity: number;
  reason: string;
  expectedBenefit: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: 'Low' | 'Medium' | 'High';
  estimatedSavings: number;
  detailedExplanation?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  actionType: 'INVENTORY_RECEIVED' | 'INVENTORY_ISSUED' | 'FEFO_RECOMMENDED' | 'FEFO_OVERRIDE' | 'TRANSFER_INITIATED' | 'PROCUREMENT_ACTION' | 'DATA_IMPORT' | 'DATA_RESET' | 'STOCK_ADJUSTMENT';
  description: string;
  details?: Record<string, any>;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
  linkTab?: string;
  actionLabel?: string;
}

export interface InventoryStats {
  totalInventoryValue: number;
  totalSKUs: number;
  totalBatches: number;
  nearExpiryItems: number; // <= 60 days
  criticalExpiryItems: number; // score >= 81 or <= 30 days with excess
  expiredItems: number;
  potentialExpiryLoss: number;
  inventoryAtRiskValue: number;
  fefoComplianceRate: number; // 0 - 100%
  stockOutRiskCount: number;
  potentialSavings: number;
}
