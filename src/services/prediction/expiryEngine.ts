import { Batch, Item, Prediction, RiskLevel, PurchaseOrder } from '../../types/inventory';

// Reference anchor date for realistic simulation: 2026-10-05 (matching current time)
export const CURRENT_DATE_STRING = '2026-10-05';

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysToExpiry(expiryDateStr: string, referenceDateStr: string = CURRENT_DATE_STRING): number {
  return calculateDaysBetween(referenceDateStr, expiryDateStr);
}

export interface PredictionInput {
  item: Item;
  batch: Batch;
  averageDailyConsumption: number;
  historicalRecordCount?: number;
  pendingPOs?: PurchaseOrder[];
  referenceDateStr?: string;
  demandMultiplier?: number; // e.g. 1.2 for +20% what-if
}

/**
 * Deterministic "Will Expire Before Use" calculation as specified in the proposal.
 */
export function willExpireBeforeUse(
  currentStock: number,
  daysToExpiry: number,
  averageDailyConsumption: number,
  safetyStock: number,
  demandMultiplier: number = 1.0
): {
  prediction: 'WILL LIKELY EXPIRE BEFORE USE' | 'Likely to be consumed before expiry';
  forecastConsumption: number;
  potentialExcess: number;
} {
  const effectiveDailyRate = Math.max(0.1, averageDailyConsumption * demandMultiplier);
  const effectiveDays = Math.max(0, daysToExpiry);
  const forecastConsumptionBeforeExpiry = Math.round(effectiveDailyRate * effectiveDays);
  const remainingAfterExpectedConsumption = currentStock - forecastConsumptionBeforeExpiry;
  const potentialExcess = Math.max(0, remainingAfterExpectedConsumption);

  const prediction = remainingAfterExpectedConsumption > safetyStock
    ? 'WILL LIKELY EXPIRE BEFORE USE'
    : 'Likely to be consumed before expiry';

  return {
    prediction,
    forecastConsumption: forecastConsumptionBeforeExpiry,
    potentialExcess,
  };
}

/**
 * Transparent 0–100 Expiry Risk Scoring Engine:
 * - Days-to-expiry risk: 30%
 * - Excess inventory risk: 25%
 * - Consumption velocity: 20%
 * - Demand forecast: 15%
 * - Pending PO impact: 10%
 */
export function calculateExpiryPrediction(input: PredictionInput): Prediction {
  const {
    item,
    batch,
    averageDailyConsumption,
    historicalRecordCount = 30,
    pendingPOs = [],
    referenceDateStr = CURRENT_DATE_STRING,
    demandMultiplier = 1.0,
  } = input;

  const daysToExpiry = getDaysToExpiry(batch.expiryDate, referenceDateStr);
  const effectiveDailyConsumption = Math.max(0.1, averageDailyConsumption * demandMultiplier);

  // 1. Will Expire Before Use & Forecast
  const { prediction: willExpire, forecastConsumption, potentialExcess } = willExpireBeforeUse(
    batch.currentStock,
    daysToExpiry,
    effectiveDailyConsumption,
    item.safetyStock,
    1.0
  );

  // If already expired
  if (daysToExpiry <= 0) {
    return {
      itemId: item.id,
      batchId: batch.id,
      daysToExpiry,
      forecastConsumption: 0,
      potentialExcess: batch.currentStock,
      riskScore: 100,
      riskLevel: 'Critical',
      willExpireBeforeUse: 'WILL LIKELY EXPIRE BEFORE USE',
      confidence: 'High',
      confidenceReason: 'Batch has already passed expiry date. Immediate quarantine/disposal required.',
      breakdown: {
        expiryRiskScore: 30,
        excessRiskScore: 25,
        consumptionRiskScore: 20,
        forecastRiskScore: 15,
        poRiskScore: 10,
        daysToExpiry,
        expectedConsumption: 0,
        potentialExcess: batch.currentStock,
        consumptionVelocityDaily: effectiveDailyConsumption,
        safetyStock: item.safetyStock,
      },
      potentialExpiryLoss: batch.currentStock * item.unitCost,
    };
  }

  // 2. Component normalization (each 0 - 100)
  // Component A: Days to Expiry (Weight 30%)
  // <= 15 days -> 100
  // <= 30 days -> 85
  // <= 60 days -> 60
  // <= 90 days -> 40
  // <= 180 days -> 20
  // > 180 days -> 5
  let normalizedExpiryRisk = 0;
  if (daysToExpiry <= 15) normalizedExpiryRisk = 100;
  else if (daysToExpiry <= 30) normalizedExpiryRisk = 85;
  else if (daysToExpiry <= 45) normalizedExpiryRisk = 75;
  else if (daysToExpiry <= 60) normalizedExpiryRisk = 60;
  else if (daysToExpiry <= 90) normalizedExpiryRisk = 40;
  else if (daysToExpiry <= 180) normalizedExpiryRisk = 20;
  else normalizedExpiryRisk = 5;

  // Component B: Excess Inventory Risk (Weight 25%)
  // Ratio of potential excess to current stock
  const excessRatio = batch.currentStock > 0 ? (potentialExcess / batch.currentStock) : 0;
  const normalizedExcessRisk = Math.min(100, Math.max(0, Math.round(excessRatio * 100)));

  // Component C: Consumption Velocity Risk (Weight 20%)
  // Runout days = stock / daily consumption. If runout days > daysToExpiry, high velocity risk
  const daysOfSupply = batch.currentStock / effectiveDailyConsumption;
  let normalizedConsumptionRisk = 0;
  if (daysOfSupply > daysToExpiry * 2) {
    normalizedConsumptionRisk = 95;
  } else if (daysOfSupply > daysToExpiry * 1.3) {
    normalizedConsumptionRisk = 80;
  } else if (daysOfSupply > daysToExpiry) {
    normalizedConsumptionRisk = 65;
  } else if (daysOfSupply > daysToExpiry * 0.7) {
    normalizedConsumptionRisk = 30;
  } else {
    normalizedConsumptionRisk = 10;
  }

  // Component D: Demand Forecast Risk (Weight 15%)
  // If department demand or upcoming procedures show slower consumption
  let normalizedDemandRisk = 0;
  if (demandMultiplier < 0.8) {
    normalizedDemandRisk = 85; // demand drop
  } else if (demandMultiplier < 1.0) {
    normalizedDemandRisk = 60;
  } else if (demandMultiplier === 1.0) {
    normalizedDemandRisk = 35;
  } else {
    normalizedDemandRisk = 15; // surge absorbs stock
  }

  // Component E: Pending Purchase Order Risk (Weight 10%)
  // If there are pending POs arriving before or near expiry when we already have excess
  const relevantPOs = pendingPOs.filter(po => po.itemId === item.id && po.status === 'pending');
  const pendingQty = relevantPOs.reduce((acc, po) => acc + po.quantity, 0);
  let normalizedPORisk = 0;
  if (potentialExcess > 0 && pendingQty > 0) {
    normalizedPORisk = 85; // adding more to already excess stock
  } else if (pendingQty > 0 && batch.currentStock > item.safetyStock * 2) {
    normalizedPORisk = 50;
  } else {
    normalizedPORisk = 10;
  }

  // Weighted calculation
  const weightedExpiry = normalizedExpiryRisk * 0.30;
  const weightedExcess = normalizedExcessRisk * 0.25;
  const weightedConsumption = normalizedConsumptionRisk * 0.20;
  const weightedDemand = normalizedDemandRisk * 0.15;
  const weightedPO = normalizedPORisk * 0.10;

  const rawScore = weightedExpiry + weightedExcess + weightedConsumption + weightedDemand + weightedPO;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk Level mapping
  let riskLevel: RiskLevel = 'Low';
  if (riskScore >= 81) riskLevel = 'Critical';
  else if (riskScore >= 61) riskLevel = 'High';
  else if (riskScore >= 31) riskLevel = 'Medium';
  else riskLevel = 'Low';

  // Confidence assessment based on data volume
  let confidence: 'Low' | 'Medium' | 'High' = 'High';
  let confidenceReason = 'High confidence: robust historical consumption data (>60 days observed).';
  if (historicalRecordCount < 10) {
    confidence = 'Low';
    confidenceReason = 'Prediction confidence is low because historical consumption data is limited (<10 records).';
  } else if (historicalRecordCount < 25) {
    confidence = 'Medium';
    confidenceReason = 'Moderate confidence: limited time-series observations available.';
  }

  const potentialExpiryLoss = potentialExcess * item.unitCost;

  return {
    itemId: item.id,
    batchId: batch.id,
    daysToExpiry,
    forecastConsumption,
    potentialExcess,
    riskScore,
    riskLevel,
    willExpireBeforeUse: willExpire,
    confidence,
    confidenceReason,
    breakdown: {
      expiryRiskScore: Math.round(weightedExpiry * 10) / 10,
      excessRiskScore: Math.round(weightedExcess * 10) / 10,
      consumptionRiskScore: Math.round(weightedConsumption * 10) / 10,
      forecastRiskScore: Math.round(weightedDemand * 10) / 10,
      poRiskScore: Math.round(weightedPO * 10) / 10,
      daysToExpiry,
      expectedConsumption: forecastConsumption,
      potentialExcess,
      consumptionVelocityDaily: Math.round(effectiveDailyConsumption * 10) / 10,
      safetyStock: item.safetyStock,
    },
    potentialExpiryLoss,
  };
}
