import { Item, Batch, Location, PurchaseOrder } from '../../types/inventory';

export interface CSVRowValidation {
  rowNumber: number;
  item?: Partial<Item>;
  batch?: Partial<Batch>;
  dailyConsumption?: number;
  pendingPO?: number;
  errors: string[];
  isValid: boolean;
}

export interface CSVParseResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  validatedData: CSVRowValidation[];
}

export const CSV_EXPECTED_HEADERS = [
  'Item ID',
  'Item Name',
  'Category',
  'Batch Number',
  'Received Date',
  'Expiry Date',
  'Quantity Received',
  'Current Stock',
  'Daily Consumption',
  'Location',
  'Unit Cost',
  'Supplier',
  'Pending PO',
  'Safety Stock',
];

export function generateSampleCSV(): string {
  const headers = CSV_EXPECTED_HEADERS.join(',');
  const sampleRows = [
    'ABX-CFTX-01,Ceftriaxone Injection 1g,Antibiotics,CFX-DEMO-01,2025-11-20,2026-11-19,6000,5000,50,Central Pharmacy Warehouse,185,Apollo MedSupply Co.,2000,800',
    'SURG-IVST-01,IV Infusion Administration Set,Consumables & Surgical,IVS-DEMO-02,2025-10-01,2026-12-04,2500,2000,28,Central Pharmacy Warehouse,22,Surgical Direct Supplies,3000,1200',
    'SURG-GLV-02,Surgical Sterile Gloves Size 7.5,Consumables & Surgical,GLV-DEMO-03,2025-06-15,2027-04-03,12000,10000,53,Surgical Suites,58,Surgical Direct Supplies,5000,2500',
    'CC-EPIN-01,Epinephrine 1mg/ml,Critical Care,EPN-DEMO-04,2026-01-20,2026-11-30,600,350,18,Emergency & Trauma Care,42,Emergency Health Care,500,300',
    'ANA-PCM-01,Paracetamol IV 1000mg,Analgesics,PCM-DEMO-05,2025-11-01,2026-12-15,2500,1400,45,Central Pharmacy Warehouse,75,Baxter Healthcare,0,1000',
  ];
  return `${headers}\n${sampleRows.join('\n')}`;
}

export function parseAndValidateCSV(csvText: string): CSVParseResult {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: ['The uploaded CSV file is empty.'],
      validatedData: [],
    };
  }

  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Validate required headers
  const missingHeaders = CSV_EXPECTED_HEADERS.filter(
    eh => !headers.some(h => h.toLowerCase() === eh.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    return {
      totalRows: lines.length - 1,
      validRows: 0,
      invalidRows: lines.length - 1,
      errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
      validatedData: [],
    };
  }

  const validatedData: CSVRowValidation[] = [];
  let validCount = 0;
  let invalidCount = 0;
  const globalErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // 1-indexed including header
    const rawCols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    if (rawCols.length < headers.length) {
      validatedData.push({
        rowNumber,
        errors: [`Column count mismatch: expected ${headers.length}, found ${rawCols.length}`],
        isValid: false,
      });
      invalidCount++;
      continue;
    }

    const rowMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowMap[h.toLowerCase()] = rawCols[idx] || '';
    });

    const rowErrors: string[] = [];

    // Extract & Validate Fields
    const itemId = rowMap['item id'];
    const itemName = rowMap['item name'];
    const category = rowMap['category'];
    const batchNumber = rowMap['batch number'];
    const receivedDate = rowMap['received date'];
    const expiryDate = rowMap['expiry date'];
    const rawQtyRecv = rowMap['quantity received'];
    const rawStock = rowMap['current stock'];
    const rawDaily = rowMap['daily consumption'];
    const location = rowMap['location'];
    const rawCost = rowMap['unit cost'];
    const supplier = rowMap['supplier'];
    const rawPO = rowMap['pending po'];
    const rawSafety = rowMap['safety stock'];

    if (!itemId) rowErrors.push('Missing Item ID');
    if (!itemName) rowErrors.push('Missing Item Name');
    if (!batchNumber) rowErrors.push('Missing Batch Number');

    if (!expiryDate) {
      rowErrors.push('Missing Expiry Date');
    } else if (isNaN(Date.parse(expiryDate))) {
      rowErrors.push(`Invalid Expiry Date format: "${expiryDate}" (expected YYYY-MM-DD)`);
    }

    const currentStock = Number(rawStock);
    if (isNaN(currentStock)) {
      rowErrors.push(`Invalid Current Stock: "${rawStock}"`);
    } else if (currentStock < 0) {
      rowErrors.push(`Negative Current Stock is prohibited: ${currentStock}`);
    }

    const quantityReceived = Number(rawQtyRecv);
    if (isNaN(quantityReceived) || quantityReceived <= 0) {
      rowErrors.push(`Invalid Quantity Received: "${rawQtyRecv}"`);
    }

    const unitCost = Number(rawCost);
    if (isNaN(unitCost) || unitCost < 0) {
      rowErrors.push(`Invalid Unit Cost: "${rawCost}"`);
    }

    const dailyConsumption = Number(rawDaily);
    if (isNaN(dailyConsumption) || dailyConsumption <= 0) {
      rowErrors.push(`Invalid Daily Consumption: "${rawDaily}"`);
    }

    const safetyStock = Number(rawSafety);
    if (isNaN(safetyStock) || safetyStock < 0) {
      rowErrors.push(`Invalid Safety Stock: "${rawSafety}"`);
    }

    const isValid = rowErrors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    validatedData.push({
      rowNumber,
      errors: rowErrors,
      isValid,
      item: {
        id: itemId,
        name: itemName,
        category: (category as any) || 'Consumables & Surgical',
        manufacturer: 'Generic Pharma Lab',
        supplier: supplier || 'Standard Distributor',
        unitCost: unitCost || 50,
        reorderLevel: safetyStock * 1.5 || 500,
        safetyStock: safetyStock || 300,
        unit: 'Unit',
      },
      batch: {
        id: `batch_imp_${Date.now()}_${i}`,
        itemId,
        batchNumber,
        receivedDate: receivedDate || '2026-01-01',
        expiryDate,
        quantityReceived,
        currentStock,
        locationId: 'loc_apex_central',
        status: 'active',
      },
      dailyConsumption,
      pendingPO: Number(rawPO) || 0,
    });
  }

  return {
    totalRows: lines.length - 1,
    validRows: validCount,
    invalidRows: invalidCount,
    errors: globalErrors,
    validatedData,
  };
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
