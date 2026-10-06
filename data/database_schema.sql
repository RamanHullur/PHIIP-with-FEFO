-- ====================================================================
-- Smart Hospital Inventory Intelligence Platform
-- Relational Database Schema (PostgreSQL / SQLite / MySQL compatible)
-- Designed from Normalized CSV Datasets in /data/*.csv
-- ====================================================================

-- 1. Hospital Facilities & Departments / Wards
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL, -- 'Central Store', 'ICU', 'Emergency', 'Surgical Suite', 'Oncology', 'General Ward'
    hospital_id VARCHAR(64) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Catalog SKUs / Items
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Antibiotics', 'Critical Care', 'Analgesics', 'IV Fluids', 'Consumables & Surgical', 'Oncology', 'Laboratory & Reagents'
    manufacturer VARCHAR(255) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 500,
    safety_stock INTEGER NOT NULL DEFAULT 300,
    unit VARCHAR(32) NOT NULL, -- 'Vial', 'Ampoule', 'Bottle', 'Infusion Bag', 'Set', 'Pair', 'Unit'
    description TEXT,
    storage_conditions VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Warehouse Inventory Batches / Physical Lots
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_number VARCHAR(64) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INTEGER NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'quarantine', 'expired', 'depleted'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on item_id and expiry_date for fast FEFO lookups
CREATE INDEX IF NOT EXISTS idx_batches_item_expiry ON batches(item_id, expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_batches_location ON batches(location_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

-- 4. Procurement Purchase Orders Pipeline
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(64) PRIMARY KEY,
    po_number VARCHAR(64) NOT NULL UNIQUE,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    expected_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'delayed', 'cancelled'
    supplier VARCHAR(255) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_item ON purchase_orders(item_id);
CREATE INDEX IF NOT EXISTS idx_pos_status ON purchase_orders(status);

-- 5. Institutional Staff & RBAC Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(64) NOT NULL, -- 'Hospital Administrator', 'Pharmacist', 'Inventory Manager', 'Procurement Manager'
    hospital_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(8),
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Historical Daily Consumption Records
CREATE TABLE IF NOT EXISTS consumption_history (
    id VARCHAR(128) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id VARCHAR(64),
    location_id VARCHAR(64) REFERENCES locations(id),
    date DATE NOT NULL,
    quantity_consumed INTEGER NOT NULL,
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consumption_item_date ON consumption_history(item_id, date DESC);

-- 7. Immutable Regulatory Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- 'FEFO_RECOMMENDED', 'STOCK_ADJUSTMENT', 'PROCUREMENT_ACTION', 'DATA_IMPORT', etc.
    description TEXT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
