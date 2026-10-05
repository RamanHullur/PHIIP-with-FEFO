import { Batch, Item, Location, TransferRecommendation, ConsumptionRecord } from '../../types/inventory';
import { getDaysToExpiry, CURRENT_DATE_STRING } from '../prediction/expiryEngine';

export interface TransferEngineInput {
  items: Item[];
  batches: Batch[];
  locations: Location[];
  consumptionRecords: ConsumptionRecord[];
  referenceDateStr?: string;
}

/**
 * Calculates transfer opportunities across departments and hospital locations.
 * Matches excess at source (leaving safety stock intact) to shortage/high demand at destination.
 */
export function calculateTransferRecommendations(input: TransferEngineInput): TransferRecommendation[] {
  const {
    items,
    batches,
    locations,
    consumptionRecords,
    referenceDateStr = CURRENT_DATE_STRING,
  } = input;

  const recommendations: TransferRecommendation[] = [];
  const locationMap = new Map(locations.map(l => [l.id, l]));

  // Calculate average daily consumption per item per location
  // using last 60 days
  const consumptionByItemLoc = new Map<string, number>();
  const countsByItemLoc = new Map<string, number>();

  consumptionRecords.forEach(cr => {
    const key = `${cr.itemId}_${cr.locationId}`;
    consumptionByItemLoc.set(key, (consumptionByItemLoc.get(key) || 0) + cr.quantityConsumed);
    countsByItemLoc.set(key, (countsByItemLoc.get(key) || 0) + 1);
  });

  const getAvgDaily = (itemId: string, locationId: string, defaultRate: number = 10): number => {
    const key = `${itemId}_${locationId}`;
    const total = consumptionByItemLoc.get(key);
    const count = countsByItemLoc.get(key);
    if (total && count && count > 0) {
      return Math.max(1, Math.round(total / count));
    }
    return defaultRate;
  };

  for (const item of items) {
    const itemBatches = batches.filter(b => b.itemId === item.id && b.status === 'active' && b.currentStock > 0);
    if (itemBatches.length === 0) continue;

    // Group batches by location
    const batchesByLoc = new Map<string, Batch[]>();
    itemBatches.forEach(b => {
      const list = batchesByLoc.get(b.locationId) || [];
      list.push(b);
      batchesByLoc.set(b.locationId, list);
    });

    // Check each location for excess
    for (const [sourceLocId, sBatches] of batchesByLoc.entries()) {
      const sourceLoc = locationMap.get(sourceLocId);
      if (!sourceLoc) continue;

      const sourceDaily = getAvgDaily(item.id, sourceLocId, 25);
      const totalSourceStock = sBatches.reduce((acc, b) => acc + b.currentStock, 0);

      // Find the earliest expiring batch in source that has excess
      sBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      const earlyBatch = sBatches[0];
      const daysToExpiry = getDaysToExpiry(earlyBatch.expiryDate, referenceDateStr);

      if (daysToExpiry <= 0) continue; // expired, quarantine instead

      const expectedSourceUsage = Math.round(sourceDaily * daysToExpiry);
      const rawExcess = Math.max(0, earlyBatch.currentStock - expectedSourceUsage);

      // Guard: Ensure source never drops below safety stock
      const maxTransferable = Math.max(0, Math.min(rawExcess, totalSourceStock - item.safetyStock));

      if (maxTransferable <= 20) continue; // Skip negligible amounts

      // Find destination locations with need (shortage, higher consumption velocity, or low stock)
      for (const destLoc of locations) {
        if (destLoc.id === sourceLocId) continue;

        const destBatches = batches.filter(b => b.itemId === item.id && b.locationId === destLoc.id && b.status === 'active');
        const destCurrentStock = destBatches.reduce((acc, b) => acc + b.currentStock, 0);
        const destDaily = getAvgDaily(item.id, destLoc.id, 40);

        // Destination 30-day requirement vs current stock
        const destRequirement30d = Math.max(0, (destDaily * 30) - destCurrentStock);

        if (destRequirement30d > 0) {
          // Transfer quantity is min(maxTransferable, destRequirement30d)
          const transferQty = Math.min(maxTransferable, destRequirement30d);
          if (transferQty < 20) continue;

          const remainingSourceStock = totalSourceStock - transferQty;
          const expectedExpiryPrevented = transferQty;
          const estimatedSavings = transferQty * item.unitCost;

          let urgency: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
          if (daysToExpiry <= 45 && rawExcess >= 500) urgency = 'Critical';
          else if (daysToExpiry <= 60) urgency = 'High';

          const isInterHospital = sourceLoc.hospitalName !== destLoc.hospitalName;
          const transferType = isInterHospital ? 'Inter-Hospital' : 'Internal Department';

          recommendations.push({
            id: `tr_${sourceLocId}_${destLoc.id}_${earlyBatch.id}`,
            itemId: item.id,
            itemName: item.name,
            batchId: earlyBatch.id,
            batchNumber: earlyBatch.batchNumber,
            sourceHospital: sourceLoc.hospitalName,
            sourceLocationId: sourceLoc.id,
            sourceLocationName: sourceLoc.name,
            destHospital: destLoc.hospitalName,
            destLocationId: destLoc.id,
            destLocationName: destLoc.name,
            availableExcess: rawExcess,
            destRequirement: destRequirement30d,
            recommendedTransferQuantity: transferQty,
            remainingSourceStock,
            expectedExpiryPrevented,
            estimatedSavings,
            urgency,
            reason: `${transferType} rebalance: ${sourceLoc.name} has ${rawExcess} units excess of Batch ${earlyBatch.batchNumber} (expiring in ${daysToExpiry} days). ${destLoc.name} has high consumption (${destDaily}/day) and requires ${destRequirement30d} units to maintain safety buffer.`,
          });
        }
      }
    }
  }

  // Sort by urgency Critical -> High -> Medium -> Low and savings descending
  const urgencyWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return recommendations.sort((a, b) => {
    const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (diff !== 0) return diff;
    return b.estimatedSavings - a.estimatedSavings;
  });
}
