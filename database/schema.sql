-- ============================================================================
-- APEX HEALTH NETWORK - HOSPITAL INVENTORY INTELLIGENCE DATABASE SCHEMA
-- Target RDBMS: PostgreSQL 14+ / Cloud SQL / Supabase / Amazon Aurora
-- Generated from Application Static Data (.csv files)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. HOSPITALS (Master Network Facilities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Metropolitan',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial hospital records
INSERT INTO hospitals (id, name, license_number, city) VALUES
    ('hosp_apex', 'Apex Metro Super-Speciality', 'HOSP-DEL-2024-9981', 'Central Metro'),
    ('hosp_city', 'City Health North Hospital', 'HOSP-NCR-2023-4120', 'North District'),
    ('hosp_stjude', 'St. Jude Community Hospital', 'HOSP-SJD-2022-1082', 'South Suburban')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. LOCATIONS (Storage Facilities, Operating Theatres, ICU & Pharmacies)
-- CSV File: locations.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Central Store', 'ICU', 'Emergency', 'Surgical Suite', 'Oncology', 'Ward')),
    hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_hospital ON locations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- ----------------------------------------------------------------------------
-- 3. USERS (Staff Accounts & Role-Based Access Control)
-- CSV File: users.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Hospital Administrator', 'Inventory Manager', 'Pharmacist', 'Procurement Manager', 'Doctor', 'Nurse')),
    hospital_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10),
    department VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 4. ITEMS (Master Medicines, Consumables & Pharmaceutical SKUs)
-- CSV File: items.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    supplier VARCHAR(150) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    reorder_level INT NOT NULL DEFAULT 100 CHECK (reorder_level >= 0),
    safety_stock INT NOT NULL DEFAULT 50 CHECK (safety_stock >= 0),
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    storage_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier);

-- ----------------------------------------------------------------------------
-- 5. BATCHES (Physical Lots, Expiry Dates, On-Hand Stock)
-- CSV File: batches.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INT NOT NULL CHECK (quantity_received >= 0),
    current_stock INT NOT NULL CHECK (current_stock >= 0),
    location_id VARCHAR(50) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantine', 'depleted', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_lte_received CHECK (current_stock <= quantity_received)
);

CREATE INDEX IF NOT EXISTS idx_batches_item ON batches(item_id);
CREATE INDEX IF NOT EXISTS idx_batches_location ON batches(location_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_number ON batches(batch_number);

-- ----------------------------------------------------------------------------
-- 6. PURCHASE_ORDERS (Replenishment Contracts & Inbound Pipeline)
-- CSV File: purchase_orders.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    expected_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delayed', 'cancelled', 'received')),
    supplier VARCHAR(150) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_item ON purchase_orders(item_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);

-- ----------------------------------------------------------------------------
-- 7. CONSUMPTION_HISTORY (Daily Dispensing & Historical Demand Run-Rates)
-- CSV File: consumption_history.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumption_history (
    id VARCHAR(100) PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id VARCHAR(50),
    location_id VARCHAR(50) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    quantity_consumed INT NOT NULL CHECK (quantity_consumed >= 0),
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cons_item_date ON consumption_history(item_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cons_location ON consumption_history(location_id);
CREATE INDEX IF NOT EXISTS idx_cons_date ON consumption_history(date DESC);

-- ----------------------------------------------------------------------------
-- 8. AUDIT_LOGS (Traceability, FEFO Overrides & Master Console Operations)
-- CSV File: audit_logs.csv
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_name);

-- ============================================================================
-- CSV BULK IMPORT COMMANDS (PostgreSQL psql / Cloud SQL)
-- Run inside psql with CSV files located in your working directory
-- ============================================================================
/*
\copy locations (id, name, type, hospital_id, hospital_name) FROM 'locations.csv' WITH (FORMAT csv, HEADER true);
\copy users (id, name, email, role, hospital_name, avatar, department) FROM 'users.csv' WITH (FORMAT csv, HEADER true);
\copy items (id, name, code, category, manufacturer, supplier, unit_cost, reorder_level, safety_stock, unit, description, storage_conditions) FROM 'items.csv' WITH (FORMAT csv, HEADER true);
\copy batches (id, item_id, batch_number, received_date, expiry_date, quantity_received, current_stock, location_id, status, notes) FROM 'batches.csv' WITH (FORMAT csv, HEADER true);
\copy purchase_orders (id, po_number, item_id, quantity, expected_date, status, supplier, unit_price) FROM 'purchase_orders.csv' WITH (FORMAT csv, HEADER true);
\copy consumption_history (id, item_id, batch_id, location_id, date, quantity_consumed, department) FROM 'consumption_history.csv' WITH (FORMAT csv, HEADER true);
\copy audit_logs (id, timestamp, user_name, role, action_type, description, details) FROM 'audit_logs.csv' WITH (FORMAT csv, HEADER true);
*/
