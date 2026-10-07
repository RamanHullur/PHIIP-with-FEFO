import {
  ActionRecommendation,
  Batch,
  Item,
  Prediction,
  ProcurementRecommendation,
  TransferRecommendation,
} from '../../types/inventory';

export interface ActionEngineInput {
  items: Item[];
  batches: Batch[];
  predictions: Map<string, Prediction>; // key: batchId
  transfers: TransferRecommendation[];
  procurements: ProcurementRecommendation[];
}

export function generateActionRecommendations(input: ActionEngineInput): ActionRecommendation[] {
  const { items, batches, predictions, transfers, procurements } = input;
  const actions: ActionRecommendation[] = [];
  const itemMap = new Map(items.map(i => [i.id, i]));

  // 1. Evaluate Expired Batches -> Quarantine / Dispose
  for (const batch of batches) {
    const item = itemMap.get(batch.itemId);
    if (!item) continue;
    const pred = predictions.get(batch.id);

    if (pred && pred.daysToExpiry <= 0 && batch.currentStock > 0) {
      actions.push({
        id: `act_quarantine_${batch.id}`,
        type: batch.status === 'quarantine' ? 'DISPOSE' : 'QUARANTINE',
        itemId: item.id,
        batchId: batch.id,
        itemName: item.name,
        batchNumber: batch.batchNumber,
        quantity: batch.currentStock,
        reason: `Batch ${batch.batchNumber} has passed expiry date (${pred.daysToExpiry} days past). Must be segregated from dispensing inventory immediately to comply with clinical safety standards.`,
        expectedBenefit: `Eliminates patient safety hazard and ensures non-conforming product audit compliance.`,
        urgency: 'Critical',
        confidence: 'High',
        estimatedSavings: 0,
        detailedExplanation: `Batch ${batch.batchNumber} expired on ${batch.expiryDate}. Clinical pharmacy policy strictly prohibits issuing expired pharmaceuticals. Isolating ${batch.currentStock} units into quarantine prevents accidental administration.`,
      });
    }
  }

  // 2. High & Critical Expiry Risk Batches
  for (const batch of batches) {
    const item = itemMap.get(batch.itemId);
    if (!item || batch.currentStock <= 0) continue;
    const pred = predictions.get(batch.id);
    if (!pred || pred.daysToExpiry <= 0) continue;

    if (pred.riskLevel === 'Critical' || pred.riskLevel === 'High') {
      // Check if there is an active transfer recommendation for this batch
      const matchingTransfer = transfers.find(t => t.batchId === batch.id);

      if (matchingTransfer) {
        actions.push({
          id: `act_transfer_${batch.id}`,
          type: matchingTransfer.sourceHospital !== matchingTransfer.destHospital ? 'INTER_HOSPITAL_TRANSFER' : 'TRANSFER_INVENTORY',
          itemId: item.id,
          batchId: batch.id,
          itemName: item.name,
          batchNumber: batch.batchNumber,
          quantity: matchingTransfer.recommendedTransferQuantity,
          reason: `Critical expiry risk: Batch ${batch.batchNumber} has ${pred.potentialExcess} excess units expiring in ${pred.daysToExpiry} days. Transferring ${matchingTransfer.recommendedTransferQuantity} units to ${matchingTransfer.destLocationName} prevents stock waste.`,
          expectedBenefit: `Prevents $${matchingTransfer.estimatedSavings.toLocaleString()} in anticipated expiry loss by absorbing inventory in high-turnover department.`,
          urgency: pred.riskLevel === 'Critical' ? 'Critical' : 'High',
          confidence: pred.confidence,
          estimatedSavings: matchingTransfer.estimatedSavings,
          detailedExplanation: `${matchingTransfer.reason} Source stock remains comfortably above safety stock (${matchingTransfer.remainingSourceStock} >= ${item.safetyStock}).`,
        });
      } else {
        // Recommend Prioritize Consumption locally or Return to Vendor if very short dated
        if (pred.daysToExpiry <= 30 && pred.potentialExcess > item.safetyStock) {
          actions.push({
            id: `act_fefo_priority_${batch.id}`,
            type: 'PRIORITIZE_CONSUMPTION',
            itemId: item.id,
            batchId: batch.id,
            itemName: item.name,
            batchNumber: batch.batchNumber,
            quantity: Math.min(batch.currentStock, pred.potentialExcess),
            reason: `Urgent shelf-life warning: Batch ${batch.batchNumber} expires in ${pred.daysToExpiry} days. Fast-track dispensing via FEFO priority across all inpatient wards.`,
            expectedBenefit: `Recovers up to $${pred.potentialExpiryLoss.toLocaleString()} by exhausting inventory before cut-off date.`,
            urgency: 'Critical',
            confidence: pred.confidence,
            estimatedSavings: pred.potentialExpiryLoss,
            detailedExplanation: `Calculated average consumption rate is ${pred.breakdown.consumptionVelocityDaily} units/day. Without active intervention, ${pred.potentialExcess} units will expire unused. Adjust routing algorithms to prioritize this batch for high-acuity orders.`,
          });
        } else if (pred.daysToExpiry > 60 && pred.potentialExcess > 1000) {
          actions.push({
            id: `act_return_vendor_${batch.id}`,
            type: 'RETURN_TO_VENDOR',
            itemId: item.id,
            batchId: batch.id,
            itemName: item.name,
            batchNumber: batch.batchNumber,
            quantity: Math.round(pred.potentialExcess * 0.8),
            reason: `Significant excess volume: ${pred.potentialExcess} units beyond anticipated usage. Vendor contractual return window is open (>60 days before expiry).`,
            expectedBenefit: `Full or partial credit refund of $${Math.round(pred.potentialExcess * 0.8 * item.unitCost).toLocaleString()} before expiry milestone.`,
            urgency: 'Medium',
            confidence: 'High',
            estimatedSavings: Math.round(pred.potentialExcess * 0.8 * item.unitCost),
            detailedExplanation: `Inventory exceeds 120-day absorption horizon. Initiating vendor return protocol recovers capital expenditure without incurring write-offs.`,
          });
        }
      }
    }
  }

  // 3. Procurement-driven actions (Delay or Cancel POs)
  for (const proc of procurements) {
    if (proc.action === 'CANCEL_PROCUREMENT' || proc.action === 'DELAY_PROCUREMENT') {
      const item = itemMap.get(proc.itemId);
      if (!item) continue;

      actions.push({
        id: `act_proc_${proc.itemId}`,
        type: proc.action,
        itemId: item.id,
        itemName: item.name,
        quantity: proc.pendingPO,
        reason: proc.reason,
        expectedBenefit: `Prevents $${proc.estimatedSavings.toLocaleString()} in avoidable working capital lockup and future expiry dumping.`,
        urgency: proc.urgency,
        confidence: 'High',
        estimatedSavings: proc.estimatedSavings,
        detailedExplanation: `Existing on-hand stock covers demand. Authorizing pending PO of ${proc.pendingPO} units would overshoot storage capacity and push older lots into expiration.`,
      });
    }
  }

  // 4. Low risk items -> Monitor
  for (const item of items) {
    const itemBatches = batches.filter(b => b.itemId === item.id && b.status === 'active');
    const allLow = itemBatches.every(b => {
      const p = predictions.get(b.id);
      return p && p.riskLevel === 'Low';
    });

    if (allLow && itemBatches.length > 0 && actions.every(a => a.itemId !== item.id)) {
      actions.push({
        id: `act_monitor_${item.id}`,
        type: 'MONITOR',
        itemId: item.id,
        itemName: item.name,
        quantity: itemBatches.reduce((acc, b) => acc + b.currentStock, 0),
        reason: `Healthy velocity and balanced shelf-life. Consumption tracking is on target with no near-term expiry threats.`,
        expectedBenefit: `Maintains operational readiness with zero waste.`,
        urgency: 'Low',
        confidence: 'High',
        estimatedSavings: 0,
        detailedExplanation: `All active batches have >120 days shelf life and runout duration aligns with demand trends. Continuous routine monitoring recommended.`,
      });
    }
  }

  const urgencyWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return actions.sort((a, b) => {
    const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (diff !== 0) return diff;
    return b.estimatedSavings - a.estimatedSavings;
  });
}
