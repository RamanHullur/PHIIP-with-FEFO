# Apex Health Network - Hospital Inventory Database Design & CSV Data Dictionary

This directory contains the database schema specifications, SQL DDL scripts, and relational mapping derived from the application's static dataset.

## 📂 CSV Files Directory
All exported CSV files are located in `/public/data/csv/` and `/src/data/csv/`:

| Table Name | CSV File | Records | Primary Key | Description |
|---|---|---|---|---|
| **items** | `items.csv` | 30 | `id` | Master catalog of pharmaceutical SKUs, dosages, categories, unit costs & safety stocks |
| **batches** | `batches.csv` | 34 | `id` | Inventory lots with lot numbers, physical location, manufacture/expiry dates, on-hand counts |
| **locations** | `locations.csv` | 8 | `id` | Central pharmacy, ICUs, emergency trauma rooms, surgical suites across hospitals |
| **purchase_orders** | `purchase_orders.csv` | 8 | `id` | Inbound procurement contracts, supplier details, delivery schedules, order statuses |
| **users** | `users.csv` | 4 | `id` | System user accounts with Role-Based Access Control (Admin, Pharmacist, Inventory, Procurement) |
| **audit_logs** | `audit_logs.csv` | 4 | `id` | Regulatory traceability logs, automated FEFO allocations, manual stock overrides |
| **consumption_history**| `consumption_history.csv` | 1,800 | `id` | 60-day historical dispensing log across wards used to compute daily run-rates |

---

## 🗄️ Database Architecture & Entity Relationships

```
┌──────────────┐          ┌───────────────────────┐          ┌───────────────────┐
│  hospitals   │ 1 ──── * │       locations       │ 1 ──── * │      batches      │
└──────────────┘          └───────────────────────┘          └─────────┬─────────┘
        │                             │                                │
        │ 1                           │ 1                              │ *
        │ *                           │ *                              │
┌───────┴──────┐          ┌───────────┴───────────┐                    │
│    users     │          │  consumption_history  │ * ─────────────────┘
└──────────────┘          └───────────┬───────────┘
                                      │ *
                                      │ 1
┌───────────────────────┐ 1 ──────────┘
│         items         │
└───────────┬───────────┘
            │ 1
            │ *
┌───────────┴───────────┐
│    purchase_orders    │
└───────────────────────┘
```

### Key Foreign Key Constraints:
- `batches.item_id` ➔ `items.id`
- `batches.location_id` ➔ `locations.locations.id`
- `purchase_orders.item_id` ➔ `items.id`
- `consumption_history.item_id` ➔ `items.id`
- `consumption_history.location_id` ➔ `locations.id`
- `locations.hospital_id` ➔ `hospitals.id`

---

## 🚀 How to Import into PostgreSQL / Cloud SQL

1. Run the database creation script:
```bash
psql -h <HOST> -U <USER> -d <DATABASE> -f database/schema.sql
```

2. Load data from the CSV files using `\copy`:
```sql
\copy locations FROM 'public/data/csv/locations.csv' WITH (FORMAT csv, HEADER true);
\copy users FROM 'public/data/csv/users.csv' WITH (FORMAT csv, HEADER true);
\copy items FROM 'public/data/csv/items.csv' WITH (FORMAT csv, HEADER true);
\copy batches FROM 'public/data/csv/batches.csv' WITH (FORMAT csv, HEADER true);
\copy purchase_orders FROM 'public/data/csv/purchase_orders.csv' WITH (FORMAT csv, HEADER true);
\copy consumption_history FROM 'public/data/csv/consumption_history.csv' WITH (FORMAT csv, HEADER true);
\copy audit_logs FROM 'public/data/csv/audit_logs.csv' WITH (FORMAT csv, HEADER true);
```

---

## 💡 Algorithmic Integration
- **FEFO Allocation Engine**: Uses `batches.expiry_date ASC` where `status = 'active'` and `current_stock > 0`.
- **Run-Rate Calculation**: Computed via `AVG(quantity_consumed)` from `consumption_history` grouped by `item_id` over the past 30-60 days.
- **Expiry Risk Score**: Calculated by comparing `current_stock` with `(days_to_expiry * daily_run_rate)`.
