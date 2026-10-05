# Smart Hospital Inventory Intelligence

> **"Predict the expiry. Consume the right batch. Prevent waste. Optimize inventory."**

Smart Hospital Inventory Intelligence is an enterprise-grade hospital clinical supply chain Proof of Concept (PoC) designed to evolve hospital inventory management from:

**Reactive Inventory Management → Predictive Inventory Intelligence → AI-assisted Decision Support**

---

## 1. Product Vision & Core Capabilities

Traditional hospital management systems (HMS) only track static parameters: `Current Stock` and `Expiry Date`. This platform closes the loop with dynamic intelligence:

$$\text{Inventory} \longrightarrow \text{Consumption Velocity} \longrightarrow \text{Forecast} \longrightarrow \text{Expiry Risk Score} \longrightarrow \text{FEFO Routing} \longrightarrow \text{Actionable Rebalancing}$$

### Core Features
1. **Interactive Executive Dashboard**: Live clickable KPI cards tracking inventory capital, near-expiry lots, critical risks, FEFO adherence, and preventable loss.
2. **Comprehensive Inventory & Lot Management**: 32 hospital SKUs across 8 locations and 24 active lots with inline editing of stock and consumption rates.
3. **Deterministic Expiry Prediction Engine**: Mathematical runway analysis (`forecastConsumption = dailyVelocity × daysToExpiry`).
4. **"Will Expire Before Use" Model**: Categorization comparing expected absorption against safety buffers.
5. **Transparent 0–100 Expiry Risk Scoring**: Weighted breakdown across Days to Expiry (30%), Excess Volume (25%), Run-Rate (20%), Demand (15%), and Pending POs (10%).
6. **First-Expiry, First-Out (FEFO) Allocation Engine**: Automatic greedy multi-batch allocation with manual override detection and wrong-batch clinical alerts.
7. **Inter-Hospital & Ward Transfer Engine**: Surplus rebalancing across facilities while strictly protecting source safety buffers.
8. **Smart Procurement Guidance**: Overstock prevention, purchase order deferrals/cancellations, and stock-out reorder triggers.
9. **Interactive What-If Simulator**: Real-time parameter tweaking (consumption shifts, stock overrides, transfer out) with instant before/after delta calculation.
10. **Grounded AI Inventory Assistant**: Powered by server-side **Google Gemini 3.8 Flash**, strictly grounded on application state to eliminate hallucinations.
11. **Explainable AI (XAI)**: Step-by-step clinical and mathematical reasoning answering *"Why is this Critical?"* and *"Why am I seeing this action?"*.
12. **Automated Business Logic Test Runner**: Built-in test suite executing 7 automated assertions validating FEFO, risk scores, transfer limits, and CSV validation.
13. **CSV Data Pipeline**: External inventory import with schema validation and one-click report exports.
14. **Immutable Audit Ledger**: Traceability tracking dispenses, overrides, transfers, and stock adjustments.
15. **User Authentication & Role-Based Access (RBAC)**: Secure sign-in page with 1-click clinical demo role logins (`Hospital Administrator`, `Inventory Manager`, `Pharmacist`, `Procurement Manager`), session persistence, and logout.
16. **Admin Master Control Dashboard**: Full CRUD administrative console where **all details can be modified**:
    - **Master SKUs Catalog**: Add, edit, or remove item records, pricing, packaging units, and reorder levels.
    - **Physical Batches & Lots**: Receive new lots, modify physical quantities, update expiry dates, reassign locations, and toggle quarantine/disposal statuses.
    - **Hospital Facilities & Wards**: Configure hospital facilities and care departments.
    - **Purchase Orders Pipeline**: Create, update quantities/dates, delay, or cancel vendor POs.
    - **Algorithm & Policy Tuning**: Customize weights for the 0–100 Expiry Risk calculation engine and standard lead times.
    - **Staff Roles Matrix**: Inspect authorized staff accounts and role privileges.

---

## 2. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Express full-stack server running Vite middlewares in dev and serving production bundles in prod.
- **AI / LLM**: `@google/genai` TypeScript SDK using `gemini-3.8-flash`. All Gemini API calls are strictly server-side; keys are never exposed to the client.
- **Data & Calculations**: Pure deterministic TypeScript calculation engines. Zero mock math delegated to LLMs.
- **Persistence**: Reactive React Context with LocalStorage caching.

```
                      User Interface (React + Tailwind)
                                     │
                     Inventory Context & State Pipeline
                                     │
                   Deterministic Calculation Engines
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
   Expiry Engine                FEFO Engine               Transfer Engine
  (Run-rate / Risk)         (Earliest-First)            (Surplus Rebalancing)
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                          Structured JSON Context
                                     │
                     Server-Side Express Endpoints (/api/gemini/*)
                                     │
                   Google Gemini 3.8 Flash (Server Only)
                                     │
                    Explainable AI & Natural-Language Synthesis
```

---

## 3. The 9-Step Interactive Demo Walkthrough

Experience the end-to-end clinical workflow:

1. **Step 1: Open Executive Dashboard**
   - View ₹5.2+ Cr total network inventory, critical lots, and potential expiry loss.
2. **Step 2: Trigger Benchmark Scenario**
   - Click the prominent **Run Demo Scenario** button in the header.
   - Activates **Ceftriaxone Injection 1g**: 5,000 units on hand, 45 days to expiry, 50 units/day consumption rate.
3. **Step 3: Inspect "Will Expire Before Use"**
   - Navigate to the **Will Expire Before Use** tab.
   - Observe Ceftriaxone Batch `CFX-2025-001`: Expected consumption is $50 \times 45 = 2,250$ units. Potential unused excess is $5,000 - 2,250 = \mathbf{2,750\text{ units}}$ ($\approx ₹508,750$ financial exposure).
   - Risk score evaluates to **87/100 (CRITICAL)**.
4. **Step 4: Click "Why is this Critical?"**
   - Opens the Explainable AI modal revealing the mathematical score audit and Gemini clinical reasoning.
5. **Step 5: Test the FEFO Engine**
   - Open **FEFO Allocation Engine**. Request 600 units of Ceftriaxone.
   - The engine automatically allocates 500 units from `CFX-2025-001` (earliest expiry) and 100 units from `CFX-2026-002`.
   - Test a manual override to trigger the **Wrong-Batch Selection Warning**.
6. **Step 6: Explore Inter-Facility Transfers**
   - Open **Transfer Rebalancing**. Notice the recommendation to transfer 800 units of Ceftriaxone from Central Pharmacy to ICU. Source safety buffer remains protected above 800 units.
   - Click **Execute Transfer** to watch physical stock shift in real time!
7. **Step 7: Check Smart Procurement**
   - Open **Smart Procurement**. Notice the recommendation to **DELAY or CANCEL** pending PO-2026-0891 because warehouse stock covers >90 days of runway.
8. **Step 8: Consult the AI Assistant**
   - Open **Inventory AI Assistant**.
   - Click the chip: *"Why is Ceftriaxone high risk?"* or *"Where do we have excess IV sets?"*.
   - Review responses grounded exclusively on deterministic application figures.
9. **Step 9: Run What-If Simulator**
   - Open **What-If Simulator**.
   - Click *"What if consumption increases by +20%?"*.
   - Watch the simulated risk score drop and view the exact preventable loss.

---

## 4. Business Logic & Mathematical Formulas

### Expiry Forecast
$$\text{Expected Consumption} = \text{Daily Velocity} \times \text{Days to Expiry}$$
$$\text{Potential Excess} = \max(0, \text{Current Stock} - \text{Expected Consumption})$$
$$\text{Potential Loss} = \text{Potential Excess} \times \text{Unit Acquisition Cost}$$

### 0–100 Expiry Risk Scoring
$$\text{Risk Score} = 0.30 \times S_{\text{expiry}} + 0.25 \times S_{\text{excess}} + 0.20 \times S_{\text{velocity}} + 0.15 \times S_{\text{demand}} + 0.10 \times S_{\text{PO}}$$
- **0 – 30**: Low
- **31 – 60**: Medium
- **61 – 80**: High
- **81 – 100**: Critical

### FEFO Allocation
Active batches sorted ascending by expiry date:
$$\text{Allocate}_i = \min(\text{Stock}_i, \text{Remaining Request})$$

---

## 5. Verification & Testing

Navigate to **Automated Test Runner** in the sidebar to verify:
- ✅ Multi-batch greedy FEFO allocation
- ✅ FEFO manual override violation detection
- ✅ Ceftriaxone 5,000 units proposal benchmark
- ✅ Transparent 0–100 score thresholding
- ✅ Inter-facility transfer safety stock preservation
- ✅ Procurement overstock detection
- ✅ CSV parsing and schema validation

---

## 6. Safety & Disclaimers

> **PoC Notice**: This application uses synthetic inventory data and deterministic rules for decision support. It is not certified for direct clinical medical administration. All procurement, disposal, and transfer operations require human pharmacist and administrator approval.
