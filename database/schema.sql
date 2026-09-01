-- ============================================================
-- YieldSense AI Database Schema
-- PostgreSQL 18 Syntax
-- Crop Yield Prediction and Agricultural Productivity Platform
-- Milestone 1: Database Schema
-- ============================================================

-- ============================================================
-- TABLE 1: roles
-- ============================================================
-- Purpose: Stores user roles (admin, user)
-- Ensures role-based access control

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: users
-- ============================================================
-- Purpose: Stores user authentication and profile information
-- role_id references roles.id for role-based authorization

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role_id 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 3: regions
-- ============================================================
-- Purpose: Stores geographic regions for agricultural observations
-- Lookup table for one-hot encoded cat__region_* columns in ML dataset

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: crops
-- ============================================================
-- Purpose: Stores crop types for agricultural observations
-- Lookup table for one-hot encoded cat__crop_type_* columns in ML dataset

CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    crop_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 5: irrigation_types
-- ============================================================
-- Purpose: Stores irrigation methods for agricultural observations
-- Lookup table for one-hot encoded cat__irrigation_type_* columns in ML dataset

CREATE TABLE irrigation_types (
    id SERIAL PRIMARY KEY,
    irrigation_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 6: fertilizer_types
-- ============================================================
-- Purpose: Stores fertilizer types for agricultural observations
-- Lookup table for one-hot encoded cat__fertilizer_type_* columns in ML dataset

CREATE TABLE fertilizer_types (
    id SERIAL PRIMARY KEY,
    fertilizer_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 7: disease_statuses
-- ============================================================
-- Purpose: Stores disease status levels for agricultural observations
-- Lookup table for one-hot encoded cat__crop_disease_status_* columns in ML dataset

CREATE TABLE disease_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 8: agricultural_observations
-- ============================================================
-- Purpose: Main table storing agricultural dataset observations
-- Normalized structure with foreign keys to lookup tables
-- Replaces one-hot encoded categorical columns with normalized references

CREATE TABLE agricultural_observations (
    -- IDENTIFICATION
    id SERIAL PRIMARY KEY,
    
    -- FOREIGN KEYS (Categorical Lookup Tables)
    region_id INTEGER NOT NULL,
    crop_id INTEGER NOT NULL,
    irrigation_type_id INTEGER,
    fertilizer_type_id INTEGER,
    disease_status_id INTEGER,
    
    -- LOCATION
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    
    -- SOIL
    soil_moisture DECIMAL(10, 4),
    soil_ph DECIMAL(5, 2),
    
    -- WEATHER / ENVIRONMENT
    temperature DECIMAL(10, 4),
    rainfall DECIMAL(10, 4),
    humidity DECIMAL(10, 4),
    sunlight_hours DECIMAL(10, 4),
    
    -- CROP / AGRICULTURAL MANAGEMENT
    pesticide_usage_ml DECIMAL(12, 4),
    total_days DECIMAL(10, 2),
    
    -- VEGETATION
    ndvi_index DECIMAL(10, 6),
    
    -- TEMPORAL
    sowing_month INTEGER,
    sowing_day INTEGER,
    observation_month INTEGER,
    observation_day INTEGER,
    
    -- DERIVED FEATURES
    days_since_sowing DECIMAL(10, 2),
    crop_cycle_progress DECIMAL(10, 6),
    
    -- TARGET
    yield_kg_per_hectare DECIMAL(15, 4),
    
    -- METADATA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- FOREIGN KEY CONSTRAINTS
    CONSTRAINT fk_agricultural_observations_region_id 
        FOREIGN KEY (region_id) 
        REFERENCES regions(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_agricultural_observations_crop_id 
        FOREIGN KEY (crop_id) 
        REFERENCES crops(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_agricultural_observations_irrigation_type_id 
        FOREIGN KEY (irrigation_type_id) 
        REFERENCES irrigation_types(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_agricultural_observations_fertilizer_type_id 
        FOREIGN KEY (fertilizer_type_id) 
        REFERENCES fertilizer_types(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_agricultural_observations_disease_status_id 
        FOREIGN KEY (disease_status_id) 
        REFERENCES disease_statuses(id) 
        ON DELETE RESTRICT
);

-- ============================================================
-- SEED DATA INSERTION
-- ============================================================
-- Using ON CONFLICT DO NOTHING to ensure idempotency
-- Schema can be executed multiple times without duplicate errors

-- Insert roles
INSERT INTO roles (role_name) VALUES
    ('admin'),
    ('user')
ON CONFLICT (role_name) DO NOTHING;

-- Insert regions
INSERT INTO regions (region_name) VALUES
    ('Central USA'),
    ('East Africa'),
    ('North India'),
    ('South India'),
    ('South USA')
ON CONFLICT (region_name) DO NOTHING;

-- Insert crops
INSERT INTO crops (crop_name) VALUES
    ('Cotton'),
    ('Maize'),
    ('Rice'),
    ('Soybean'),
    ('Wheat')
ON CONFLICT (crop_name) DO NOTHING;

-- Insert irrigation types
INSERT INTO irrigation_types (irrigation_name) VALUES
    ('Drip'),
    ('Manual'),
    ('Sprinkler'),
    ('Unknown')
ON CONFLICT (irrigation_name) DO NOTHING;

-- Insert fertilizer types
INSERT INTO fertilizer_types (fertilizer_name) VALUES
    ('Inorganic'),
    ('Mixed'),
    ('Organic')
ON CONFLICT (fertilizer_name) DO NOTHING;

-- Insert disease statuses
INSERT INTO disease_statuses (status_name) VALUES
    ('Mild'),
    ('Moderate'),
    ('Severe'),
    ('Unknown')
ON CONFLICT (status_name) DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================
-- Improve query performance on frequently accessed columns
-- Note: users.email already has a UNIQUE constraint which creates an index

CREATE INDEX idx_agricultural_observations_region_id 
    ON agricultural_observations(region_id);

CREATE INDEX idx_agricultural_observations_crop_id 
    ON agricultural_observations(crop_id);

CREATE INDEX idx_agricultural_observations_irrigation_type_id 
    ON agricultural_observations(irrigation_type_id);

CREATE INDEX idx_agricultural_observations_fertilizer_type_id 
    ON agricultural_observations(fertilizer_type_id);

CREATE INDEX idx_agricultural_observations_disease_status_id 
    ON agricultural_observations(disease_status_id);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
