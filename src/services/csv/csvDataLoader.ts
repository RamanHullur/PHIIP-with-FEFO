import { Item, Batch, Location, PurchaseOrder, AuditLog, UserAccount } from '../../types/inventory';

// ====================================================================
// RAW CSV DATASETS
// In accordance with data architecture guidelines, all static data is defined in CSV format.
// This allows straightforward porting to PostgreSQL, SQLite, MySQL, or Cloud SQL.
// ====================================================================

export const RAW_CSV_LOCATIONS = `id,name,type,hospitalId,hospitalName
loc_apex_central,Central Pharmacy Warehouse,Central Store,hosp_apex,Apex Metro Super-Speciality
loc_apex_icu,Main Intensive Care Unit (ICU),ICU,hosp_apex,Apex Metro Super-Speciality
loc_apex_er,Emergency & Trauma Care,Emergency,hosp_apex,Apex Metro Super-Speciality
loc_apex_ot,Surgical Suites & Operation Theatres,Surgical Suite,hosp_apex,Apex Metro Super-Speciality
loc_apex_onc,Comprehensive Oncology Infusion Center,Oncology,hosp_apex,Apex Metro Super-Speciality
loc_city_central,North Central Pharmacy,Central Store,hosp_city,City Health North Hospital
loc_city_icu,City North ICU & CCU,ICU,hosp_city,City Health North Hospital
loc_stjude_main,St. Jude General Dispensary,Central Store,hosp_stjude,St. Jude Community Hospital`;

export const RAW_CSV_ITEMS = `id,code,name,category,manufacturer,supplier,unitCost,reorderLevel,safetyStock,unit,description,storageConditions
item_cftx_1g,ABX-CFTX-01,Ceftriaxone Injection 1g,Antibiotics,Roche Healthcare,Apollo MedSupply Co.,185,1200,800,Vial,"Broad-spectrum 3rd gen cephalosporin for severe respiratory, abdominal, and sepsis infections.","Store below 25°C, protect from light"
item_mero_1g,ABX-MERO-02,Meropenem IV 1g,Antibiotics,AstraZeneca Pharma,MedEx Logistics,850,400,250,Vial,"Carbapenem antibiotic reserved for multi-drug resistant bacterial infections in ICU.","Store at 20°C - 25°C"
item_piptaz_45,ABX-PTAZ-03,Piperacillin + Tazobactam 4.5g,Antibiotics,Pfizer Global,Apollo MedSupply Co.,460,600,350,Vial,"Extended spectrum penicillin with beta-lactamase inhibitor for hospital-acquired pneumonia.","Store below 25°C"
item_vanco_500,ABX-VANC-04,Vancomycin Hydrochloride 500mg,Antibiotics,Cipla Therapeutics,CityMed Distributors,310,300,150,Vial,"Glycopeptide antibiotic indicated for MRSA and serious gram-positive infections.","Store below 25°C"
item_amox_12,ABX-AMOX-05,Amoxicillin + Clavulanic Acid 1.2g IV,Antibiotics,GlaxoSmithKline,Apollo MedSupply Co.,140,800,500,Vial,"Standard surgical prophylaxis and broad coverage beta-lactam.","Store below 25°C"
item_epi_1mg,CC-EPIN-01,Epinephrine (Adrenaline) 1mg/ml,Critical Care,Sun Pharma,Emergency Health Care,42,500,300,Ampoule,"Life-saving vasopressor for cardiac arrest, anaphylaxis, and profound shock.","Store at 2°C - 8°C in amber ampoule"
item_norepi_4mg,CC-NEPI-02,Norepinephrine 4mg/2ml,Critical Care,Hospira / Pfizer,Emergency Health Care,195,350,200,Ampoule,"First-line inotropic vasopressor for septic shock resuscitation in ICU.","Store below 25°C, protect from light"
item_dopa_200,CC-DOPA-03,Dopamine Hydrochloride 200mg/5ml,Critical Care,Neon Laboratories,MedEx Logistics,65,250,150,Ampoule,"Inotropic agent for acute cardiogenic shock and hemodynamically significant hypotension.","Store below 30°C"
item_atro_06,CC-ATRO-04,Atropine Sulfate 0.6mg/ml,Critical Care,Sun Pharma,CityMed Distributors,28,400,250,Ampoule,"Anticholinergic for symptomatic bradycardia and organophosphate toxicity reversal.","Store below 25°C"
item_pcm_1g,ANA-PCM-01,Paracetamol IV 1000mg Infusion,Analgesics,Baxter Healthcare,Apollo MedSupply Co.,75,1500,1000,Bottle,"Intravenous antipyretic and non-opioid post-operative analgesic.","Store below 30°C"
item_fent_100,ANA-FENT-02,Fentanyl Citrate 100mcg/2ml,Analgesics,Troikaa Pharma,Direct Central Depot,120,300,200,Ampoule,"Schedule X potent synthetic opioid for surgical anesthesia and ventilator sedation.","Controlled vault, locked custody"
item_midaz_5mg,ANA-MID-03,Midazolam Injection 5mg/5ml,Analgesics,Roche Healthcare,Direct Central Depot,55,400,250,Vial,"Rapid-onset benzodiazepine for procedural conscious sedation and ICU intubation.","Store below 25°C"
item_tram_100,ANA-TRAM-04,Tramadol IV 100mg/2ml,Analgesics,Cadila Pharma,CityMed Distributors,35,600,300,Ampoule,"Centrally acting analgesic for moderate to moderately severe acute surgical pain.","Store below 30°C"
item_ns_500,IVF-NS-01,Normal Saline (0.9% NaCl) 500ml,IV Fluids,B. Braun Medical,National IV Infusions Ltd.,26,3000,2000,Infusion Bag,"Isotonic crystalloid fluid replacement and medication reconstitution vehicle.","Store at 15°C - 30°C"
item_rl_500,IVF-RL-02,Ringer Lactate Solution 500ml,IV Fluids,Baxter Healthcare,National IV Infusions Ltd.,32,2500,1500,Infusion Bag,"Balanced electrolyte solution for surgical fluid maintenance and burn trauma.","Store at 15°C - 30°C"
item_d5_500,IVF-D5-03,Dextrose 5% Solution 500ml,IV Fluids,Fresenius Kabi,National IV Infusions Ltd.,29,1500,800,Infusion Bag,"Isotonic sugar crystalloid for cellular dehydration and hypoglycemic maintenance.","Store at 15°C - 30°C"
item_kcl_20,IVF-KCL-04,Potassium Chloride 20mEq Concentrate,IV Fluids,Fresenius Kabi,MedEx Logistics,45,500,300,Ampoule,"High-alert electrolyte concentrate for intravenous dilution in hypokalemia.","High-alert storage with dilution warning label"
item_iv_set,SURG-IVST-01,IV Infusion Administration Set (Vented),Consumables & Surgical,Becton Dickinson (BD),Surgical Direct Supplies,22,2000,1200,Set,"Sterile gravity infusion set with 15 micron chamber filter and luer-lock connector.","Keep dry, avoid moisture"
item_gloves_75,SURG-GLV-02,Surgical Sterile Gloves Size 7.5,Consumables & Surgical,Ansell Healthcare,Surgical Direct Supplies,58,4000,2500,Pair,"Powder-free micro-textured latex surgical barrier gloves for sterile operating theatre.","Store in cool dry space away from ozone and UV"
item_syr_10,SURG-SYR-03,Disposable Hypodermic Syringes 10ml,Consumables & Surgical,HMD Dispovan,Apollo MedSupply Co.,7,5000,3000,Unit,"Medical grade polypropylene 3-part syringe with siliconized plunger.","Standard ambient"
item_foley_16,SURG-FOL-04,Silicone Foley Catheter 2-Way 16Fr,Consumables & Surgical,Teleflex Medical,Surgical Direct Supplies,145,300,150,Unit,"100% silicone indwelling urinary drainage catheter with 10ml retention balloon.","Sterile packaging, store flat"
item_ett_75,SURG-ETT-05,Endotracheal Tube Cuffed 7.5mm,Consumables & Surgical,Medtronic Surgical,Emergency Health Care,165,250,120,Unit,"Thermosensitive PVC endotracheal tube with high-volume low-pressure cuff.","Store below 35°C"
item_stopcock_3w,SURG-3WAY-06,3-Way Stopcock Luer-Lock,Consumables & Surgical,B. Braun Medical,Surgical Direct Supplies,35,1000,600,Unit,"Lipid-resistant polycarbonate 3-way manifold valve for simultaneous IV infusions.","Standard dry medical store"
item_pacli_100,ONC-PACL-01,Paclitaxel Infusion 100mg/16.7ml,Oncology,Bristol-Myers Squibb,OncoMed Specialty Rx,3200,60,30,Vial,"Taxane antineoplastic chemotherapy agent for breast, lung, and ovarian malignancies.","Store at 20°C - 25°C, cytotoxic safety containment"
item_carbo_450,ONC-CARB-02,Carboplatin Injection 450mg/45ml,Oncology,Sanofi Oncology,OncoMed Specialty Rx,2750,50,25,Vial,"Platinum-based DNA cross-linking chemotherapeutic agent for solid tumors.","Cytotoxic biohazard storage, protect from light"
item_albu_20,ONC-ALBU-03,Human Albumin Solution 20% 100ml,Oncology,CSL Behring,Blood & Plasma Direct,4100,80,40,Vial,"Pasteurized plasma fraction for severe hypoalbuminemia, cirrhosis, and nephrotic edema.","Store at 2°C - 8°C, do not freeze"
item_blood_bag,LAB-BLD-01,Blood Bag CPDA-1 Triple 350ml,Laboratory & Reagents,Terumo Penpol,Blood & Plasma Direct,320,200,100,Set,"Sterile closed blood collection system with citrate phosphate dextrose anticoagulant.","Store clean dry, room temperature"
item_trop_i,LAB-TROP-02,Troponin-I Quantitative Rapid Reagent Kit,Laboratory & Reagents,Abbott Diagnostics,BioLab Instruments,550,150,75,Kit (25 Tests),"High-sensitivity cardiac biomarker assay for acute myocardial infarction triage.","Store at 2°C - 8°C, refrigerated testing fridge"
item_covid_ag,LAB-COV-03,SARS-CoV-2 Rapid Antigen Cassette Kit,Laboratory & Reagents,SD Biosensor,BioLab Instruments,180,300,150,Box of 25,"Immunochromatographic lateral flow detection for respiratory viral triage.","Store at 2°C - 30°C"
item_edta_tube,LAB-EDTA-04,Vacutainer EDTA K2 Tubes 3ml,Laboratory & Reagents,Becton Dickinson (BD),BioLab Instruments,14,1500,800,Tube,"Whole blood hematology vacuum phlebotomy tube for CBC and blood grouping.","Standard ambient"`;

export const RAW_CSV_BATCHES = `id,itemId,batchNumber,receivedDate,expiryDate,quantityReceived,currentStock,locationId,status,notes
batch_cftx_001,item_cftx_1g,CFX-2025-001,2025-11-20,2026-11-19,6000,5000,loc_apex_central,active,"Demo target batch: High excess stock, expiring in 45 days."
batch_cftx_002,item_cftx_1g,CFX-2026-002,2026-03-10,2027-02-15,1000,300,loc_apex_icu,active,
batch_cftx_003,item_cftx_1g,CFX-2026-003,2026-06-01,2027-08-30,2000,700,loc_apex_icu,active,
batch_mero_001,item_mero_1g,MER-8819,2025-09-12,2026-10-25,500,240,loc_apex_central,active,
batch_mero_002,item_mero_1g,MER-9102,2026-01-15,2027-04-30,600,480,loc_apex_icu,active,
batch_ptaz_001,item_piptaz_45,PTZ-4410,2025-10-10,2026-11-05,800,410,loc_apex_central,active,
batch_ptaz_002,item_piptaz_45,PTZ-4921,2026-04-12,2027-07-20,1200,1100,loc_city_central,active,
batch_vanc_001,item_vanco_500,VNC-1044,2025-05-10,2026-09-15,300,45,loc_apex_central,quarantine,"Expired stock quarantined during morning ward check."
batch_vanc_002,item_vanco_500,VNC-1190,2026-02-14,2027-03-31,500,380,loc_apex_icu,active,
batch_epi_001,item_epi_1mg,EPN-7731,2026-01-20,2026-11-30,600,350,loc_apex_er,active,
batch_epi_002,item_epi_1mg,EPN-8104,2026-05-18,2027-09-15,1000,950,loc_apex_central,active,
batch_norepi_001,item_norepi_4mg,NOR-5521,2025-12-05,2026-10-31,400,180,loc_apex_icu,active,
batch_norepi_002,item_norepi_4mg,NOR-6200,2026-03-22,2027-05-18,600,520,loc_apex_central,active,
batch_pcm_001,item_pcm_1g,PCM-3031,2025-11-01,2026-12-15,2500,1400,loc_apex_central,active,
batch_pcm_002,item_pcm_1g,PCM-3510,2026-04-01,2027-08-30,3000,2800,loc_city_central,active,
batch_fent_001,item_fent_100,FNT-9912,2026-02-10,2027-06-15,400,280,loc_apex_ot,active,
batch_ns_001,item_ns_500,NS-2025-11,2025-08-01,2026-10-18,4000,1200,loc_apex_central,active,
batch_ns_002,item_ns_500,NS-2026-03,2026-03-01,2028-02-28,5000,4200,loc_apex_er,active,
batch_ns_003,item_ns_500,NS-2026-07,2026-07-01,2028-06-30,6000,5800,loc_stjude_main,active,
batch_rl_001,item_rl_500,RL-1088,2025-12-10,2027-01-20,3000,2100,loc_apex_central,active,
batch_ivset_001,item_iv_set,IVS-6001,2025-10-01,2026-12-04,2500,2000,loc_apex_central,active,"Requirement example: 2000 stock, 60 days to expiry, 1700 forecast usage."
batch_ivset_002,item_iv_set,IVS-7210,2026-04-10,2028-03-31,4000,3500,loc_apex_icu,active,
batch_glv_001,item_gloves_75,GLV-75-01,2025-06-15,2027-04-03,12000,10000,loc_apex_ot,active,"Requirement example: 10,000 stock, 180 days, Low risk."
batch_syr_001,item_syr_10,SYR-10-88,2025-09-01,2027-08-31,10000,6500,loc_apex_central,active,
batch_fol_001,item_foley_16,FOL-16-04,2025-04-10,2026-09-28,400,60,loc_city_central,quarantine,"Quarantined post-monthly audit."
batch_fol_002,item_foley_16,FOL-16-12,2026-02-15,2028-01-30,500,420,loc_apex_ot,active,
batch_pacli_001,item_pacli_100,PAC-4401,2025-11-15,2026-11-20,120,85,loc_apex_onc,active,
batch_pacli_002,item_pacli_100,PAC-4822,2026-05-10,2027-11-10,150,140,loc_apex_central,active,
batch_carbo_001,item_carbo_450,CRB-201,2026-03-01,2027-09-20,80,65,loc_apex_onc,active,
batch_albu_001,item_albu_20,ALB-902,2025-10-10,2026-10-30,90,48,loc_apex_central,active,"High-value cold chain product expiring shortly."
batch_trop_001,item_trop_i,TRP-501,2025-11-01,2026-10-28,180,95,loc_apex_er,active,
batch_trop_002,item_trop_i,TRP-612,2026-04-10,2027-04-10,200,170,loc_city_central,active,
batch_cov_001,item_covid_ag,COV-882,2025-07-20,2026-09-10,400,120,loc_apex_central,quarantine,"Quarantined expired test cassettes."
batch_ett_001,item_ett_75,ETT-75-01,2025-08-15,2028-08-15,350,220,loc_apex_ot,active,`;

export const RAW_CSV_PURCHASE_ORDERS = `id,poNumber,itemId,quantity,expectedDate,status,supplier,unitPrice
po_101,PO-2026-0891,item_cftx_1g,2000,2026-10-20,pending,Apollo MedSupply Co.,180
po_102,PO-2026-0895,item_gloves_75,5000,2026-11-05,pending,Surgical Direct Supplies,56
po_103,PO-2026-0902,item_mero_1g,300,2026-10-15,pending,MedEx Logistics,840
po_104,PO-2026-0910,item_iv_set,3000,2026-10-25,pending,Surgical Direct Supplies,21
po_105,PO-2026-0914,item_ns_500,4000,2026-10-18,pending,National IV Infusions Ltd.,25
po_106,PO-2026-0920,item_epi_1mg,500,2026-11-12,pending,Emergency Health Care,40
po_107,PO-2026-0925,item_pacli_100,50,2026-10-30,pending,OncoMed Specialty Rx,3150
po_108,PO-2026-0933,item_albu_20,60,2026-11-01,pending,Blood & Plasma Direct,4050`;

export const RAW_CSV_USERS = `id,name,email,role,hospitalName,avatar,department
user_admin,Dr. Rajeshwari Rao,admin@apexmetro.health,Hospital Administrator,Apex Metro Super-Speciality,RR,Executive Medical Board & Clinical Governance
user_inv,Rajesh Nair,inventory@apexmetro.health,Inventory Manager,Apex Metro Super-Speciality,RN,Central Warehouse & Supply Chain Logistics
user_rx,Dr. Anita Sharma,pharmacy@apexmetro.health,Pharmacist,Apex Metro Super-Speciality,AS,Clinical Inpatient Pharmacy & Dispensing
user_po,Kavita Menon,procurement@apexmetro.health,Procurement Manager,Apex Metro Super-Speciality,KM,Global Sourcing & Vendor Contracts`;

export const RAW_CSV_AUDIT_LOGS = `id,timestamp,user,role,actionType,description,details
log_001,2026-10-04 18:42:10,Dr. Anita Sharma,Pharmacist,FEFO_RECOMMENDED,"Auto-allocated Batch CFX-2025-001 (500 units) and CFX-2026-002 (100 units) to fulfill ICU Emergency Ceftriaxone indent of 600 units.","{""itemId"":""item_cftx_1g"",""requested"":600,""compliance"":""100% FEFO""}"
log_002,2026-10-04 15:20:00,Rajesh Nair,Inventory Manager,STOCK_ADJUSTMENT,"Quarantined Batch VNC-1044 (45 units) following expiry cutoff trigger.","{""batchId"":""batch_vanc_001"",""reason"":""Past shelf-life milestone""}"
log_003,2026-10-03 11:05:32,Kavita Menon,Procurement Manager,PROCUREMENT_ACTION,"Flagged PO-2026-0891 for Ceftriaxone (2,000 units) with DELAY recommendation due to on-hand 5,000 unit inventory.",
log_004,2026-10-02 09:14:15,System Bot,Hospital Administrator,DATA_IMPORT,"Completed automated morning hospital inventory synchronization across 8 locations.",`;

// ====================================================================
// ROBUST CSV PARSER
// Correctly parses commas, quoted strings, and escaped quotes
// ====================================================================

export function parseCSVToRows(csvText: string): string[][] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  // Parse each line into fields
  return lines.map(line => {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nextC = line[i + 1];

      if (c === '"') {
        if (inQuotes && nextC === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  });
}

// ====================================================================
// CSV DATA LOADERS
// Parse raw CSV datasets into typed TypeScript entities
// ====================================================================

export function loadLocationsFromCSV(): Location[] {
  const rows = parseCSVToRows(RAW_CSV_LOCATIONS);
  if (rows.length < 2) return [];

  // skip header: id,name,type,hospitalId,hospitalName
  return rows.slice(1).map(cols => ({
    id: cols[0],
    name: cols[1],
    type: cols[2] as any,
    hospitalId: cols[3],
    hospitalName: cols[4],
  }));
}

export function loadItemsFromCSV(): Item[] {
  const rows = parseCSVToRows(RAW_CSV_ITEMS);
  if (rows.length < 2) return [];

  // header: id,code,name,category,manufacturer,supplier,unitCost,reorderLevel,safetyStock,unit,description,storageConditions
  return rows.slice(1).map(cols => ({
    id: cols[0],
    code: cols[1],
    name: cols[2],
    category: cols[3] as any,
    manufacturer: cols[4],
    supplier: cols[5],
    unitCost: Number(cols[6]) || 0,
    reorderLevel: Number(cols[7]) || 500,
    safetyStock: Number(cols[8]) || 300,
    unit: cols[9] || 'Unit',
    description: cols[10] || '',
    storageConditions: cols[11] || '',
  }));
}

export function loadBatchesFromCSV(): Batch[] {
  const rows = parseCSVToRows(RAW_CSV_BATCHES);
  if (rows.length < 2) return [];

  // header: id,itemId,batchNumber,receivedDate,expiryDate,quantityReceived,currentStock,locationId,status,notes
  return rows.slice(1).map(cols => ({
    id: cols[0],
    itemId: cols[1],
    batchNumber: cols[2],
    receivedDate: cols[3],
    expiryDate: cols[4],
    quantityReceived: Number(cols[5]) || 0,
    currentStock: Number(cols[6]) || 0,
    locationId: cols[7],
    status: (cols[8] as any) || 'active',
    notes: cols[9] || undefined,
  }));
}

export function loadPurchaseOrdersFromCSV(): PurchaseOrder[] {
  const rows = parseCSVToRows(RAW_CSV_PURCHASE_ORDERS);
  if (rows.length < 2) return [];

  // header: id,poNumber,itemId,quantity,expectedDate,status,supplier,unitPrice
  return rows.slice(1).map(cols => ({
    id: cols[0],
    poNumber: cols[1],
    itemId: cols[2],
    quantity: Number(cols[3]) || 0,
    expectedDate: cols[4],
    status: (cols[5] as any) || 'pending',
    supplier: cols[6],
    unitPrice: Number(cols[7]) || 0,
  }));
}

export function loadUsersFromCSV(): UserAccount[] {
  const rows = parseCSVToRows(RAW_CSV_USERS);
  if (rows.length < 2) return [];

  // header: id,name,email,role,hospitalName,avatar,department
  return rows.slice(1).map(cols => ({
    id: cols[0],
    name: cols[1],
    email: cols[2],
    role: cols[3] as any,
    hospitalName: cols[4],
    avatar: cols[5],
    department: cols[6],
  }));
}

export function loadAuditLogsFromCSV(): AuditLog[] {
  const rows = parseCSVToRows(RAW_CSV_AUDIT_LOGS);
  if (rows.length < 2) return [];

  // header: id,timestamp,user,role,actionType,description,details
  return rows.slice(1).map(cols => {
    let details: any = undefined;
    if (cols[6]) {
      try {
        details = JSON.parse(cols[6]);
      } catch {
        details = cols[6];
      }
    }
    return {
      id: cols[0],
      timestamp: cols[1],
      user: cols[2],
      role: cols[3] as any,
      actionType: cols[4] as any,
      description: cols[5],
      details,
    };
  });
}

// Download helper for UI
export function downloadCSVContent(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
