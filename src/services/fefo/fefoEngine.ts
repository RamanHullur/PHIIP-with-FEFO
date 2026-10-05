import { Batch, BatchAllocation, FEFORecommendation } from '../../types/inventory';
import { getDaysToExpiry, CURRENT_DATE_STRING } from '../prediction/expiryEngine';

export interface FEFORequest {
  itemId: string;
  requestedQuantity: number;
  availableBatches: Batch[];
  locationId?: string;
  referenceDateStr?: string;
}

/**
 * Pure deterministic FEFO allocation engine.
 * Sorts active non-expired batches strictly by expiry date ascending (earliest first).
 */
export function calculateFEFORecommendation(request: FEFORequest): FEFORecommendation {
  const {
    itemId,
    requestedQuantity,
    availableBatches,
    locationId,
    referenceDateStr = CURRENT_DATE_STRING,
  } = request;

  // Filter batches for this item (and location if specified)
  const candidateBatches = availableBatches
    .filter(b => b.itemId === itemId && (!locationId || b.locationId === locationId))
    .filter(b => b.status === 'active' && b.currentStock > 0);

  // Sort strictly by expiryDate ASC
  candidateBatches.sort((a, b) => {
    const diff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    if (diff !== 0) return diff;
    return a.batchNumber.localeCompare(b.batchNumber);
  });

  let remainingToAllocate = requestedQuantity;
  const allocations: BatchAllocation[] = [];
  let totalAllocated = 0;

  for (let i = 0; i < candidateBatches.length; i++) {
    const batch = candidateBatches[i];
    const daysToExpiry = getDaysToExpiry(batch.expiryDate, referenceDateStr);
    const available = batch.currentStock;
    const allocate = Math.min(available, Math.max(0, remainingToAllocate));
    const remaining = available - allocate;

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysToExpiry,
      available,
      allocate,
      remaining,
      isEarliestExpiry: i === 0,
    });

    remainingToAllocate -= allocate;
    totalAllocated += allocate;
  }

  const isFullyFulfilled = remainingToAllocate <= 0;
  const unfulfilledQuantity = Math.max(0, remainingToAllocate);

  // Formulate clear, explainable reasoning
  let explanation = '';
  if (allocations.length === 0) {
    explanation = 'No active stock available for this item in selected location.';
  } else if (allocations.length === 1) {
    const first = allocations[0];
    explanation = `Batch ${first.batchNumber} (Expires: ${first.expiryDate}, ${first.daysToExpiry} days left) has sufficient available stock (${first.available} units) to fulfill the request.`;
  } else {
    const allocatedBatches = allocations.filter(a => a.allocate > 0);
    if (allocatedBatches.length === 1) {
      const b = allocatedBatches[0];
      explanation = `Batch ${b.batchNumber} is selected first because it has the earliest expiry (${b.expiryDate}, ${b.daysToExpiry} days remaining).`;
    } else {
      const names = allocatedBatches.map(b => `${b.batchNumber} (${b.allocate} units, exp ${b.expiryDate})`).join(' and ');
      explanation = `Split allocation across batches ${names} strictly adhering to First-Expiry, First-Out sequence to prevent premature expiration.`;
    }
  }

  return {
    itemId,
    requestedQuantity,
    locationId,
    allocations,
    isFullyFulfilled,
    totalAllocated,
    unfulfilledQuantity,
    explanation,
    isCompliant: true,
  };
}

/**
 * Validates whether a manual user batch selection complies with FEFO.
 * Detects if user bypassed an earlier expiring batch with available stock.
 */
export function validateManualBatchSelection(
  selectedBatchId: string,
  selectedQuantity: number,
  allBatches: Batch[],
  referenceDateStr: string = CURRENT_DATE_STRING
): {
  isCompliant: boolean;
  earlierBatches: Batch[];
  warningMessage?: string;
  recommendedBatchNumber?: string;
} {
  const targetBatch = allBatches.find(b => b.id === selectedBatchId);
  if (!targetBatch) {
    return { isCompliant: false, earlierBatches: [] };
  }

  const targetExpiry = new Date(targetBatch.expiryDate).getTime();

  // Find any active batch of the same item with earlier expiry and positive stock
  const earlierBatches = allBatches.filter(b => {
    if (b.itemId !== targetBatch.itemId || b.id === targetBatch.id) return false;
    if (b.status !== 'active' || b.currentStock <= 0) return false;
    const bExpiry = new Date(b.expiryDate).getTime();
    return bExpiry < targetExpiry;
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  if (earlierBatches.length > 0) {
    const earliest = earlierBatches[0];
    const earlierDays = getDaysToExpiry(earliest.expiryDate, referenceDateStr);
    const targetDays = getDaysToExpiry(targetBatch.expiryDate, referenceDateStr);

    return {
      isCompliant: false,
      earlierBatches,
      recommendedBatchNumber: earliest.batchNumber,
      warningMessage: `FEFO Violation Warning: Batch ${earliest.batchNumber} expires earlier (${earliest.expiryDate}, in ${earlierDays} days) with ${earliest.currentStock} units available. Selecting ${targetBatch.batchNumber} (expires in ${targetDays} days) increases risk of waste.`,
    };
  }

  return {
    isCompliant: true,
    earlierBatches: [],
  };
}
