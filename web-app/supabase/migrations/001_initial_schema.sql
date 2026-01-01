-- FITNESS-TRACKER Initial Schema Migration
-- Created: 2025-12-29
-- Description: Creates all tables for the fitness tracking application

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Training focus for persons
CREATE TYPE training_focus AS ENUM ('powerlifting', 'cardio', 'mixed');

-- Workout intensity levels
CREATE TYPE workout_intensity AS ENUM ('low', 'medium', 'high');

-- Meal type categories
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Recipe category (same as meal_type for consistency)
CREATE TYPE recipe_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- ============================================================================
-- TABLE: persons
-- ============================================================================
-- Tracks household members and their training preferences

CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    training_focus training_focus NOT NULL DEFAULT 'mixed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE persons IS 'Household members being tracked for fitness';
COMMENT ON COLUMN persons.training_focus IS 'Primary training style: powerlifting, cardio, or mixed';

-- ============================================================================
-- TABLE: weight_entries
-- ============================================================================
-- Daily weight tracking per person

CREATE TABLE weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_lbs DECIMAL(5,1) NOT NULL CHECK (weight_lbs > 0 AND weight_lbs < 1000),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_person_date UNIQUE (person_id, date)
);

COMMENT ON TABLE weight_entries IS 'Daily weight measurements for tracking progress';
COMMENT ON COLUMN weight_entries.weight_lbs IS 'Weight in pounds with one decimal precision';

-- Indexes for common queries
CREATE INDEX idx_weight_entries_person_id ON weight_entries(person_id);
CREATE INDEX idx_weight_entries_date ON weight_entries(date DESC);
CREATE INDEX idx_weight_entries_person_date ON weight_entries(person_id, date DESC);

-- ============================================================================
-- TABLE: workouts
-- ============================================================================
-- Workout sessions with exercises stored as JSONB

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(100) NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes < 600),
    intensity workout_intensity,
    notes TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workouts IS 'Workout sessions including exercises as JSONB array';
COMMENT ON COLUMN workouts.exercises IS 'Array of exercise objects: [{name, sets, reps, weight_lbs, rpe, notes}]';
COMMENT ON COLUMN workouts.type IS 'Workout type: e.g., Squat Day, HIIT, Yoga, Upper Body';

-- Indexes for common queries
CREATE INDEX idx_workouts_person_id ON workouts(person_id);
CREATE INDEX idx_workouts_date ON workouts(date DESC);
CREATE INDEX idx_workouts_person_date ON workouts(person_id, date DESC);
CREATE INDEX idx_workouts_completed ON workouts(completed) WHERE completed = false;

-- ============================================================================
-- TABLE: meals
-- ============================================================================
-- Meal entries for nutrition tracking

CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    meal_type meal_type NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    calories INTEGER CHECK (calories >= 0),
    protein_g DECIMAL(6,1) CHECK (protein_g >= 0),
    carbs_g DECIMAL(6,1) CHECK (carbs_g >= 0),
    fat_g DECIMAL(6,1) CHECK (fat_g >= 0),
    fiber_g DECIMAL(6,1) CHECK (fiber_g >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE meals IS 'Meal entries for daily nutrition tracking';
COMMENT ON COLUMN meals.meal_type IS 'Category: breakfast, lunch, dinner, or snack';

-- Indexes for common queries
CREATE INDEX idx_meals_date ON meals(date DESC);
CREATE INDEX idx_meals_date_type ON meals(date, meal_type);

-- ============================================================================
-- TABLE: pantry_items
-- ============================================================================
-- Inventory tracking for kitchen pantry

CREATE TABLE pantry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    expires_at DATE,
    low_stock_threshold DECIMAL(10,2) CHECK (low_stock_threshold >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pantry_items IS 'Kitchen pantry inventory tracking';
COMMENT ON COLUMN pantry_items.low_stock_threshold IS 'Alert when quantity falls below this value';
COMMENT ON COLUMN pantry_items.location IS 'Storage location: e.g., Fridge, Freezer, Pantry, Cupboard';

-- Indexes for common queries
CREATE INDEX idx_pantry_items_category ON pantry_items(category);
CREATE INDEX idx_pantry_items_expires_at ON pantry_items(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_pantry_items_low_stock ON pantry_items(quantity, low_stock_threshold)
    WHERE low_stock_threshold IS NOT NULL;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pantry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pantry_items_updated_at
    BEFORE UPDATE ON pantry_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pantry_updated_at();

-- ============================================================================
-- TABLE: recipes
-- ============================================================================
-- Recipe library with ingredients and instructions as JSONB

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category recipe_category NOT NULL,
    prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
    servings INTEGER NOT NULL DEFAULT 1 CHECK (servings > 0),
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition JSONB,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE recipes IS 'Recipe library for meal planning';
COMMENT ON COLUMN recipes.ingredients IS 'Array of ingredient objects: [{item, quantity, unit, notes}]';
COMMENT ON COLUMN recipes.instructions IS 'Array of instruction strings';
COMMENT ON COLUMN recipes.nutrition IS 'Object with calories, protein_g, carbs_g, fat_g, fiber_g';
COMMENT ON COLUMN recipes.tags IS 'Array of tags for filtering: e.g., high-protein, quick, meal-prep';

-- Indexes for common queries
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_name ON recipes(name);

-- ============================================================================
-- TABLE: grocery_items
-- ============================================================================
-- Shopping list items

CREATE TABLE grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    store VARCHAR(100),
    checked BOOLEAN NOT NULL DEFAULT false,
    estimated_price DECIMAL(10,2) CHECK (estimated_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE grocery_items IS 'Shopping list for grocery runs';
COMMENT ON COLUMN grocery_items.store IS 'Preferred store: Costco, Safeway, Superstore';
COMMENT ON COLUMN grocery_items.checked IS 'Whether item has been purchased/checked off';

-- Indexes for common queries
CREATE INDEX idx_grocery_items_store ON grocery_items(store) WHERE store IS NOT NULL;
CREATE INDEX idx_grocery_items_category ON grocery_items(category);
CREATE INDEX idx_grocery_items_checked ON grocery_items(checked) WHERE checked = false;

-- ============================================================================
-- SEED DATA: persons
-- ============================================================================

INSERT INTO persons (name, training_focus) VALUES
    ('Him', 'powerlifting'),
    ('Her', 'cardio');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional for Supabase Auth
-- ============================================================================
-- Uncomment these if you want to enable RLS with Supabase Auth

-- ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- Example policy for authenticated users (adjust as needed):
-- CREATE POLICY "Allow authenticated access" ON persons
--     FOR ALL USING (auth.role() = 'authenticated');
