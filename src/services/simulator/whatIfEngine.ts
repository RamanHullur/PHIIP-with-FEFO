import { Item, Batch, Prediction, RiskLevel } from '../../types/inventory';
import { calculateExpiryPrediction, CURRENT_DATE_STRING } from '../prediction/expiryEngine';

export interface WhatIfParameters {
  stockDeltaPercent: number; // e.g. 0, +20%, -30%
  stockOverride?: number;
  consumptionDeltaPercent: number; // e.g. +20%
  expiryDaysOverride?: number;
  pendingPODelta: number;
  transferOutQty: number;
  safetyStockOverride?: number;
}

export interface WhatIfComparison {
  baseline: {
    stock: number;
    dailyConsumption: number;
    daysToExpiry: number;
    forecastConsumption: number;
    potentialExcess: number;
    riskScore: number;
    riskLevel: RiskLevel;
    willExpireBeforeUse: string;
    financialLoss: number;
    stockOutRisk: boolean;
  };
  simulated: {
    stock: number;
    dailyConsumption: number;
    daysToExpiry: number;
    forecastConsumption: number;
    potentialExcess: number;
    riskScore: number;
    riskLevel: RiskLevel;
    willExpireBeforeUse: string;
    financialLoss: number;
    stockOutRisk: boolean;
  };
  delta: {
    stockChange: number;
    riskScoreChange: number;
    potentialExcessChange: number;
    financialLossChange: number; // negative means savings achieved!
    potentialSavings: number;
  };
  aiInsight: string;
}

export function runWhatIfSimulation(
  item: Item,
  batch: Batch,
  baselineDailyConsumption: number,
  params: WhatIfParameters
): WhatIfComparison {
  // Baseline prediction
  const baselinePred = calculateExpiryPrediction({
    item,
    batch,
    averageDailyConsumption: baselineDailyConsumption,
  });

  const baselineStock = batch.currentStock;
  const baselineDays = baselinePred.daysToExpiry;

  // Compute simulated values
  let simStock = params.stockOverride !== undefined
    ? params.stockOverride
    : Math.max(0, Math.round(baselineStock * (1 + params.stockDeltaPercent / 100)));

  // Apply transfer out if any
  simStock = Math.max(0, simStock - params.transferOutQty);

  const simDaily = Math.max(0.1, baselineDailyConsumption * (1 + params.consumptionDeltaPercent / 100));

  let simDays = params.expiryDaysOverride !== undefined
    ? params.expiryDaysOverride
    : baselineDays;

  // Calculate synthetic expiry date for simulated days
  const simExpiryDate = new Date(CURRENT_DATE_STRING);
  simExpiryDate.setDate(simExpiryDate.getDate() + simDays);
  const simExpiryStr = simExpiryDate.toISOString().split('T')[0];

  const simulatedBatch: Batch = {
    ...batch,
    currentStock: simStock,
    expiryDate: simExpiryStr,
  };

  const simulatedItem: Item = {
    ...item,
    safetyStock: params.safetyStockOverride !== undefined ? params.safetyStockOverride : item.safetyStock,
  };

  // Run simulated prediction
  const simPred = calculateExpiryPrediction({
    item: simulatedItem,
    batch: simulatedBatch,
    averageDailyConsumption: simDaily,
  });

  const baselineLoss = baselinePred.potentialExpiryLoss;
  const simLoss = simPred.potentialExpiryLoss;
  const financialLossChange = simLoss - baselineLoss;
  const potentialSavings = Math.max(0, -financialLossChange);

  const baselineDaysOfSupply = baselineStock / baselineDailyConsumption;
  const simDaysOfSupply = simStock / simDaily;

  const baselineStockOut = baselineDaysOfSupply < 7;
  const simStockOut = simDaysOfSupply < 7;

  // Generate automated natural language insight
  let insight = '';
  if (params.consumptionDeltaPercent > 0 && simPred.potentialExcess < baselinePred.potentialExcess) {
    const reducedExcess = baselinePred.potentialExcess - simPred.potentialExcess;
    insight = `A ${params.consumptionDeltaPercent}% surge in daily consumption increases absorption, preventing ${reducedExcess} units from expiring and unlocking ₹${potentialSavings.toLocaleString()} in waste mitigation.`;
  } else if (params.transferOutQty > 0) {
    insight = `Transferring ${params.transferOutQty} units safely reduces excess inventory at the source, dropping risk score from ${baselinePred.riskScore} to ${simPred.riskScore} while retaining minimum safety stock.`;
  } else if (simStockOut) {
    insight = `Warning: High demand combined with current stock levels shrinks supply runway to under 7 days (${Math.round(simDaysOfSupply)} days), creating an acute stock-out hazard.`;
  } else {
    insight = `Simulation reflects updated parameters: Risk score moved by ${simPred.riskScore - baselinePred.riskScore > 0 ? '+' : ''}${simPred.riskScore - baselinePred.riskScore} points with ₹${simLoss.toLocaleString()} remaining exposure.`;
  }

  return {
    baseline: {
      stock: baselineStock,
      dailyConsumption: baselineDailyConsumption,
      daysToExpiry: baselineDays,
      forecastConsumption: baselinePred.forecastConsumption,
      potentialExcess: baselinePred.potentialExcess,
      riskScore: baselinePred.riskScore,
      riskLevel: baselinePred.riskLevel,
      willExpireBeforeUse: baselinePred.willExpireBeforeUse,
      financialLoss: baselineLoss,
      stockOutRisk: baselineStockOut,
    },
    simulated: {
      stock: simStock,
      dailyConsumption: Math.round(simDaily * 10) / 10,
      daysToExpiry: simDays,
      forecastConsumption: simPred.forecastConsumption,
      potentialExcess: simPred.potentialExcess,
      riskScore: simPred.riskScore,
      riskLevel: simPred.riskLevel,
      willExpireBeforeUse: simPred.willExpireBeforeUse,
      financialLoss: simLoss,
      stockOutRisk: simStockOut,
    },
    delta: {
      stockChange: simStock - baselineStock,
      riskScoreChange: simPred.riskScore - baselinePred.riskScore,
      potentialExcessChange: simPred.potentialExcess - baselinePred.potentialExcess,
      financialLossChange,
      potentialSavings,
    },
    aiInsight: insight,
  };
}
