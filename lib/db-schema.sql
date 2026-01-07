-- FITNESS-TRACKER SQLite Database Schema
-- This schema mirrors the Supabase schema for local SQLite deployment

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- PERSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS persons (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
    age INTEGER NOT NULL,
    height REAL NOT NULL, -- in cm
    weight REAL NOT NULL, -- current weight in lbs
    bmi REAL NOT NULL,
    daily_calorie_target INTEGER NOT NULL,
    training_focus TEXT CHECK(training_focus IN ('powerlifting', 'cardio', 'mixed')) NOT NULL,
    workout_days_per_week INTEGER NOT NULL CHECK(workout_days_per_week >= 1 AND workout_days_per_week <= 7),
    household_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- WEIGHT ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS weight_entries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    weight_lbs REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_person_date ON weight_entries(person_id, date);

-- Unique constraint for atomic upsert operations (one weight entry per person per date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_entries_person_date_unique ON weight_entries(person_id, date);

-- ============================================================================
-- WORKOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    type TEXT NOT NULL,
    exercises TEXT NOT NULL, -- JSON array of exercise objects
    duration_minutes INTEGER,
    intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
    notes TEXT,
    completed INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workouts_person_date ON workouts(person_id, date);

-- ============================================================================
-- MEALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT, -- Optional: can be null for shared household meals
    date TEXT NOT NULL, -- YYYY-MM-DD format
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    calories INTEGER,
    protein_g REAL,
    carbs_g REAL,
    fat_g REAL,
    fiber_g REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_person_date ON meals(person_id, date);

-- ============================================================================
-- PANTRY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pantry_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    location TEXT,
    expires_at TEXT, -- YYYY-MM-DD format
    low_stock_threshold REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);

-- ============================================================================
-- RECIPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK(category IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER NOT NULL DEFAULT 1,
    base_servings INTEGER NOT NULL DEFAULT 1, -- Original serving count for scaling
    ingredients TEXT NOT NULL, -- JSON array of ingredient objects
    instructions TEXT NOT NULL, -- JSON array of instruction strings
    nutrition TEXT, -- JSON object with nutrition info
    macros_per_serving TEXT, -- JSON object with per-serving macros
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT, -- JSON array of tag strings
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

-- ============================================================================
-- GROCERY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS grocery_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    store TEXT,
    is_purchased INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
    notes TEXT,
    week_of TEXT, -- YYYY-MM-DD format (Monday of the week)
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_grocery_items_week ON grocery_items(week_of);
CREATE INDEX IF NOT EXISTS idx_grocery_items_store ON grocery_items(store);

-- ============================================================================
-- HOUSEHOLDS TABLE (for multi-person support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS households (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- FOOD LOG TABLE (for tracking individual food intake)
-- ============================================================================
CREATE TABLE IF NOT EXISTS food_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    food_name TEXT NOT NULL,
    serving_size REAL,
    serving_unit TEXT,
    calories INTEGER,
    protein_g REAL,
    carbs_g REAL,
    fat_g REAL,
    fiber_g REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_food_log_person_date ON food_log(person_id, date);

-- ============================================================================
-- WATER INTAKE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS water_intake (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    amount_ml INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_water_intake_person_date ON water_intake(person_id, date);

-- ============================================================================
-- WORKOUT SCHEDULES TABLE (for recurring workout plans)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_schedules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    person_id TEXT NOT NULL,
    name TEXT NOT NULL,
    day_of_week INTEGER CHECK(day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    workout_type TEXT NOT NULL,
    exercises TEXT NOT NULL, -- JSON array of exercise objects
    duration_minutes INTEGER,
    intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_schedules_person ON workout_schedules(person_id);
