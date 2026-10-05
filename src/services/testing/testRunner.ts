import { Batch, Item, Location } from '../../types/inventory';
import { calculateFEFORecommendation, validateManualBatchSelection } from '../fefo/fefoEngine';
import { willExpireBeforeUse, calculateExpiryPrediction, CURRENT_DATE_STRING } from '../prediction/expiryEngine';
import { calculateTransferRecommendations } from '../transfer/transferEngine';
import { calculateProcurementRecommendations } from '../procurement/procurementEngine';
import { parseAndValidateCSV } from '../csv/csvService';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'FEFO Engine' | 'Expiry & Prediction' | 'Risk Scoring' | 'Transfers' | 'Procurement' | 'CSV Validation';
  status: 'passed' | 'failed';
  expected: string;
  actual: string;
  durationMs: number;
  error?: string;
}

export function runAllAutomatedTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // TEST 1: FEFO Allocation Test (Specific proposal requirement: B001=500 earlier, B002=300 later. Request 600 -> B001=500, B002=100)
  {
    const start = performance.now();
    try {
      const mockBatches: Batch[] = [
        {
          id: 'B002',
          itemId: 'item_test_01',
          batchNumber: 'B002',
          receivedDate: '2026-01-01',
          expiryDate: '2026-11-15', // Later expiry
          quantityReceived: 300,
          currentStock: 300,
          locationId: 'loc_test',
          status: 'active',
        },
        {
          id: 'B001',
          itemId: 'item_test_01',
          batchNumber: 'B001',
          receivedDate: '2025-12-01',
          expiryDate: '2026-10-20', // Earlier expiry
          quantityReceived: 500,
          currentStock: 500,
          locationId: 'loc_test',
          status: 'active',
        },
      ];

      const res = calculateFEFORecommendation({
        itemId: 'item_test_01',
        requestedQuantity: 600,
        availableBatches: mockBatches,
      });

      const allocB001 = res.allocations.find(a => a.batchId === 'B001')?.allocate;
      const allocB002 = res.allocations.find(a => a.batchId === 'B002')?.allocate;

      const passed = allocB001 === 500 && allocB002 === 100 && res.isFullyFulfilled;

      results.push({
        id: 'test_fefo_01',
        name: 'FEFO Multi-Batch Greedy Allocation',
        category: 'FEFO Engine',
        status: passed ? 'passed' : 'failed',
        expected: 'B001: 500 units, B002: 100 units, 100% fulfilled',
        actual: `B001: ${allocB001} units, B002: ${allocB002} units, fulfilled=${res.isFullyFulfilled}`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_fefo_01',
        name: 'FEFO Multi-Batch Greedy Allocation',
        category: 'FEFO Engine',
        status: 'failed',
        expected: 'B001: 500, B002: 100',
        actual: 'Error thrown',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 2: FEFO Manual Override Validation
  {
    const start = performance.now();
    try {
      const mockBatches: Batch[] = [
        {
          id: 'B001',
          itemId: 'item_test_01',
          batchNumber: 'B001',
          receivedDate: '2025-12-01',
          expiryDate: '2026-10-20', // Earlier
          quantityReceived: 500,
          currentStock: 500,
          locationId: 'loc_test',
          status: 'active',
        },
        {
          id: 'B002',
          itemId: 'item_test_01',
          batchNumber: 'B002',
          receivedDate: '2026-01-01',
          expiryDate: '2027-01-15', // Later
          quantityReceived: 300,
          currentStock: 300,
          locationId: 'loc_test',
          status: 'active',
        },
      ];

      // User manually picks B002 instead of B001
      const validation = validateManualBatchSelection('B002', 100, mockBatches);
      const passed = !validation.isCompliant && validation.recommendedBatchNumber === 'B001';

      results.push({
        id: 'test_fefo_02',
        name: 'FEFO Manual Override Violation Detection',
        category: 'FEFO Engine',
        status: passed ? 'passed' : 'failed',
        expected: 'isCompliant: false, recommendedBatchNumber: B001',
        actual: `isCompliant: ${validation.isCompliant}, recommended: ${validation.recommendedBatchNumber}`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_fefo_02',
        name: 'FEFO Manual Override Violation Detection',
        category: 'FEFO Engine',
        status: 'failed',
        expected: 'Non-compliant detection',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 3: Deterministic "Will Expire Before Use" (Ceftriaxone Requirement: Stock 5000, Days 45, Daily 50 -> Expected 2250, Excess 2750)
  {
    const start = performance.now();
    try {
      const currentStock = 5000;
      const daysToExpiry = 45;
      const avgDaily = 50;
      const safetyStock = 800;

      const res = willExpireBeforeUse(currentStock, daysToExpiry, avgDaily, safetyStock);
      const passed =
        res.forecastConsumption === 2250 &&
        res.potentialExcess === 2750 &&
        res.prediction === 'WILL LIKELY EXPIRE BEFORE USE';

      results.push({
        id: 'test_pred_01',
        name: 'Will Expire Before Use (Ceftriaxone 5000 stock benchmark)',
        category: 'Expiry & Prediction',
        status: passed ? 'passed' : 'failed',
        expected: 'Forecast: 2250, Excess: 2750, Prediction: "WILL LIKELY EXPIRE BEFORE USE"',
        actual: `Forecast: ${res.forecastConsumption}, Excess: ${res.potentialExcess}, Prediction: "${res.prediction}"`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_pred_01',
        name: 'Will Expire Before Use',
        category: 'Expiry & Prediction',
        status: 'failed',
        expected: 'Forecast 2250, Excess 2750',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 4: Transparent Risk Scoring Engine (0 - 100 Range and Critical Mapping)
  {
    const start = performance.now();
    try {
      const mockItem: Item = {
        id: 'item_test_cftx',
        name: 'Ceftriaxone 1g',
        code: 'ABX-CFTX',
        category: 'Antibiotics',
        manufacturer: 'Roche',
        supplier: 'Apollo',
        unitCost: 185,
        reorderLevel: 1200,
        safetyStock: 800,
        unit: 'Vial',
      };

      const mockBatch: Batch = {
        id: 'batch_cftx_bench',
        itemId: 'item_test_cftx',
        batchNumber: 'CFX-BENCH',
        receivedDate: '2025-11-20',
        expiryDate: '2026-11-19', // 45 days from 2026-10-05
        quantityReceived: 6000,
        currentStock: 5000,
        locationId: 'loc_main',
        status: 'active',
      };

      const pred = calculateExpiryPrediction({
        item: mockItem,
        batch: mockBatch,
        averageDailyConsumption: 50,
        historicalRecordCount: 60,
      });

      const passed = pred.riskScore >= 81 && pred.riskLevel === 'Critical' && pred.potentialExpiryLoss === 2750 * 185;

      results.push({
        id: 'test_score_01',
        name: 'Transparent Risk Scoring & Critical Threshold (>= 81)',
        category: 'Risk Scoring',
        status: passed ? 'passed' : 'failed',
        expected: 'Score >= 81, Level: "Critical", Potential Loss: ₹508,750',
        actual: `Score: ${pred.riskScore}, Level: "${pred.riskLevel}", Potential Loss: ₹${pred.potentialExpiryLoss.toLocaleString()}`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_score_01',
        name: 'Risk Scoring',
        category: 'Risk Scoring',
        status: 'failed',
        expected: 'Critical Risk',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 5: Inventory Transfer Engine (Surplus rebalancing without breaching source safety stock)
  {
    const start = performance.now();
    try {
      const mockItem: Item = {
        id: 'item_transfer_test',
        name: 'Test Ceftriaxone',
        code: 'ABX-CFTX',
        category: 'Antibiotics',
        manufacturer: 'Roche',
        supplier: 'Apollo',
        unitCost: 200,
        reorderLevel: 1000,
        safetyStock: 800,
        unit: 'Vial',
      };

      const mockLocations: Location[] = [
        { id: 'loc_source', name: 'Central Store', type: 'Central Store', hospitalId: 'h1', hospitalName: 'Hospital A' },
        { id: 'loc_dest', name: 'ICU Ward', type: 'ICU', hospitalId: 'h2', hospitalName: 'Hospital B' },
      ];

      const mockBatches: Batch[] = [
        {
          id: 'batch_transfer_source',
          itemId: 'item_transfer_test',
          batchNumber: 'BT-SRC-01',
          receivedDate: '2025-10-01',
          expiryDate: '2026-11-04', // 30 days
          quantityReceived: 5000,
          currentStock: 5000,
          locationId: 'loc_source',
          status: 'active',
        },
      ];

      const transfers = calculateTransferRecommendations({
        items: [mockItem],
        batches: mockBatches,
        locations: mockLocations,
        consumptionRecords: [],
      });

      const hasTransfer = transfers.length > 0;
      const topTransfer = transfers[0];
      const sourceStockSafe = topTransfer ? topTransfer.remainingSourceStock >= mockItem.safetyStock : false;

      const passed = hasTransfer && sourceStockSafe && topTransfer.estimatedSavings > 0;

      results.push({
        id: 'test_trans_01',
        name: 'Inter-Facility Transfer Recommendation & Safety Stock Guard',
        category: 'Transfers',
        status: passed ? 'passed' : 'failed',
        expected: 'Transfer generated, remaining source stock >= safety stock (800)',
        actual: hasTransfer
          ? `Transfer Qty: ${topTransfer.recommendedTransferQuantity}, Remaining: ${topTransfer.remainingSourceStock} (Safe: ${sourceStockSafe})`
          : 'No transfer generated',
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_trans_01',
        name: 'Transfer Recommendation',
        category: 'Transfers',
        status: 'failed',
        expected: 'Valid transfer generated',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 6: Smart Procurement Overstock Detection (Delay PO when stock + pending PO exceeds demand)
  {
    const start = performance.now();
    try {
      const mockItem: Item = {
        id: 'item_proc_test',
        name: 'Surgical Gloves',
        code: 'GLV-TEST',
        category: 'Consumables & Surgical',
        manufacturer: 'Ansell',
        supplier: 'Surgical Direct',
        unitCost: 50,
        reorderLevel: 2000,
        safetyStock: 1000,
        unit: 'Pair',
      };

      const mockBatches: Batch[] = [
        {
          id: 'b_gloves',
          itemId: 'item_proc_test',
          batchNumber: 'GLV-01',
          receivedDate: '2026-01-01',
          expiryDate: '2027-06-01',
          quantityReceived: 10000,
          currentStock: 10000,
          locationId: 'loc_main',
          status: 'active',
        },
      ];

      const dailyMap = new Map([['item_proc_test', 50]]); // 1500/month demand

      const procs = calculateProcurementRecommendations({
        items: [mockItem],
        batches: mockBatches,
        purchaseOrders: [
          {
            id: 'po_test_excess',
            poNumber: 'PO-EXCESS',
            itemId: 'item_proc_test',
            quantity: 5000,
            expectedDate: '2026-11-01',
            status: 'pending',
            supplier: 'Surgical Direct',
            unitPrice: 50,
          },
        ],
        averageDailyConsumptionMap: dailyMap,
      });

      const proc = procs.find(p => p.itemId === 'item_proc_test');
      const passed = proc?.action === 'CANCEL_PROCUREMENT' || proc?.action === 'DELAY_PROCUREMENT';

      results.push({
        id: 'test_proc_01',
        name: 'Procurement Overstock Prevention (Delay / Cancel PO)',
        category: 'Procurement',
        status: passed ? 'passed' : 'failed',
        expected: 'Action: DELAY_PROCUREMENT or CANCEL_PROCUREMENT',
        actual: `Action: ${proc?.action} (Reason: ${proc?.reason.substring(0, 45)}...)`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_proc_01',
        name: 'Procurement Recommendation',
        category: 'Procurement',
        status: 'failed',
        expected: 'Overstock action',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  // TEST 7: CSV Parser & Validation
  {
    const start = performance.now();
    try {
      const validCSV = `Item ID,Item Name,Category,Batch Number,Received Date,Expiry Date,Quantity Received,Current Stock,Daily Consumption,Location,Unit Cost,Supplier,Pending PO,Safety Stock
TEST-01,Test Antibiotic,Antibiotics,B-101,2026-01-01,2026-12-31,1000,800,25,Central Pharmacy,150,Apollo,500,200`;

      const invalidCSV = `Item ID,Item Name,Category,Batch Number,Received Date,Expiry Date,Quantity Received,Current Stock,Daily Consumption,Location,Unit Cost,Supplier,Pending PO,Safety Stock
TEST-02,Invalid Item,Antibiotics,B-102,2026-01-01,INVALID_DATE,1000,-50,-10,Central Pharmacy,150,Apollo,0,100`;

      const validParsed = parseAndValidateCSV(validCSV);
      const invalidParsed = parseAndValidateCSV(invalidCSV);

      const passed =
        validParsed.validRows === 1 &&
        invalidParsed.invalidRows === 1 &&
        invalidParsed.validatedData[0].errors.length > 0;

      results.push({
        id: 'test_csv_01',
        name: 'CSV Parsing & Schema Validation (Negative stock & invalid date check)',
        category: 'CSV Validation',
        status: passed ? 'passed' : 'failed',
        expected: 'Valid CSV: 1 valid row. Invalid CSV: 1 invalid row with flagged errors',
        actual: `Valid: ${validParsed.validRows} valid rows. Invalid: ${invalidParsed.invalidRows} invalid rows (${invalidParsed.validatedData[0]?.errors.length} errors)`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (e: any) {
      results.push({
        id: 'test_csv_01',
        name: 'CSV Validation',
        category: 'CSV Validation',
        status: 'failed',
        expected: 'Validation pass',
        actual: 'Error',
        error: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  return results;
}
