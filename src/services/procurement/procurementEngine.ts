import { Item, Batch, PurchaseOrder, ProcurementRecommendation } from '../../types/inventory';

export interface ProcurementEngineInput {
  items: Item[];
  batches: Batch[];
  purchaseOrders: PurchaseOrder[];
  averageDailyConsumptionMap: Map<string, number>;
}

export function calculateProcurementRecommendations(input: ProcurementEngineInput): ProcurementRecommendation[] {
  const { items, batches, purchaseOrders, averageDailyConsumptionMap } = input;
  const recommendations: ProcurementRecommendation[] = [];

  for (const item of items) {
    const activeBatches = batches.filter(b => b.itemId === item.id && b.status === 'active');
    const currentStock = activeBatches.reduce((acc, b) => acc + b.currentStock, 0);

    const pendingPOs = purchaseOrders.filter(po => po.itemId === item.id && po.status === 'pending');
    const pendingPOQty = pendingPOs.reduce((acc, po) => acc + po.quantity, 0);

    const dailyRate = Math.max(1, averageDailyConsumptionMap.get(item.id) || 20);
    const leadTimeDays = 14; // standard hospital supplier lead time
    const forecastDemand30d = Math.round(dailyRate * 30);
    const forecastDemandLeadTime = Math.round(dailyRate * leadTimeDays);

    const totalAvailableAndIncoming = currentStock + pendingPOQty;
    const reorderPoint = item.reorderLevel;
    const safetyStock = item.safetyStock;

    let action: ProcurementRecommendation['action'] = 'MAINTAIN';
    let reason = '';
    let potentialExcessCreated = 0;
    let recommendedOrderQuantity = 0;
    let estimatedSavings = 0;
    let urgency: ProcurementRecommendation['urgency'] = 'Low';

    // Scenario 1: Critical Stock-Out Risk / Understock
    if (currentStock <= safetyStock * 0.5 && pendingPOQty === 0) {
      action = 'EMERGENCY_ORDER';
      urgency = 'Critical';
      const daysOfSupply = Math.round(currentStock / dailyRate);
      recommendedOrderQuantity = Math.max(100, Math.round((forecastDemand30d * 2) - currentStock));
      reason = `Critical stock-out alert: Available stock (${currentStock} units) covers only ${daysOfSupply} days of demand (below safety threshold of ${safetyStock}). No pending PO in transit. Immediate expedited order required.`;
      estimatedSavings = Math.round(recommendedOrderQuantity * item.unitCost * 0.15); // avoided stockout/emergency surcharge
    } else if (currentStock <= reorderPoint && pendingPOQty === 0) {
      action = 'REORDER_NOW';
      urgency = 'High';
      recommendedOrderQuantity = Math.max(100, Math.round((forecastDemand30d * 2) - currentStock));
      reason = `Stock has dipped below reorder point (${currentStock} < ${reorderPoint}). Lead time is ${leadTimeDays} days. Recommend standard purchase order of ${recommendedOrderQuantity} units to avoid stock-out.`;
    } 
    // Scenario 2: Severe Overstock with Pending PO -> CANCEL or DELAY
    else if (totalAvailableAndIncoming > (forecastDemand30d * 4) + safetyStock && pendingPOQty > 0) {
      potentialExcessCreated = totalAvailableAndIncoming - ((forecastDemand30d * 3) + safetyStock);
      estimatedSavings = potentialExcessCreated * item.unitCost;

      if (currentStock > (forecastDemand30d * 3) + safetyStock) {
        action = 'CANCEL_PROCUREMENT';
        urgency = 'Critical';
        reason = `Excess procurement alert: Current stock alone (${currentStock} units) already covers >90 days of forecast demand (${forecastDemand30d * 3} units). Pending PO for ${pendingPOQty} units will trigger severe expiry risk. Recommend cancelling PO.`;
      } else {
        action = 'DELAY_PROCUREMENT';
        urgency = 'High';
        reason = `Sufficient runway: Current inventory (${currentStock} units) covers near-term requirements. Pending PO for ${pendingPOQty} units should be deferred by 30–60 days to synchronize with consumption velocity.`;
      }
    } 
    // Scenario 3: Adequate Coverage
    else if (currentStock > forecastDemand30d + safetyStock && pendingPOQty === 0) {
      action = 'MAINTAIN';
      urgency = 'Low';
      const monthsOfSupply = (currentStock / (forecastDemand30d || 1)).toFixed(1);
      reason = `Inventory health optimal: Current stock (${currentStock} units) provides ${monthsOfSupply} months of supply. No additional procurement needed at this time.`;
    } else {
      action = 'MAINTAIN';
      urgency = 'Low';
      reason = `Pipeline balanced: Current stock (${currentStock}) plus incoming orders (${pendingPOQty}) adequately buffers forecast demand (${forecastDemand30d} units/month).`;
    }

    recommendations.push({
      itemId: item.id,
      itemName: item.name,
      currentStock,
      pendingPO: pendingPOQty,
      safetyStock,
      forecastDemand30d,
      reorderPoint,
      leadTimeDays,
      action,
      reason,
      potentialExcessCreated,
      recommendedOrderQuantity,
      estimatedSavings,
      urgency,
    });
  }

  // Sort by urgency Critical -> High -> Medium -> Low
  const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return recommendations.sort((a, b) => weight[b.urgency] - weight[a.urgency]);
}
