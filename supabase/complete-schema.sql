-- FITNESS-TRACKER Complete Schema Setup for Supabase
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- This will create all tables with the correct columns

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE training_focus AS ENUM ('powerlifting', 'cardio', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workout_intensity AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recipe_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: households
-- ============================================================================

CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'My Household',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: profiles (linked to auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: persons (WITH ALL REQUIRED COLUMNS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK(gender IN ('male', 'female')),
    age INTEGER CHECK (age > 0 AND age < 150),
    height DECIMAL(5,1) CHECK (height > 0 AND height < 300),
    weight DECIMAL(5,1) CHECK (weight > 0 AND weight < 1000),
    bmi DECIMAL(4,1) CHECK (bmi > 0 AND bmi < 100),
    daily_calorie_target INTEGER CHECK (daily_calorie_target > 0),
    training_focus training_focus NOT NULL DEFAULT 'mixed',
    workout_days_per_week INTEGER CHECK (workout_days_per_week >= 0 AND workout_days_per_week <= 7),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: weight_entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_lbs DECIMAL(5,1) NOT NULL CHECK (weight_lbs > 0 AND weight_lbs < 1000),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_person_date UNIQUE (person_id, date)
);

-- ============================================================================
-- TABLE: workouts
-- ============================================================================

CREATE TABLE IF NOT EXISTS workouts (
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

-- ============================================================================
-- TABLE: meals
-- ============================================================================

CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
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

-- ============================================================================
-- TABLE: pantry_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
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

-- ============================================================================
-- TABLE: recipes
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
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
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: grocery_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    store VARCHAR(100),
    checked BOOLEAN NOT NULL DEFAULT false,
    estimated_price DECIMAL(10,2) CHECK (estimated_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_persons_household_id ON persons(household_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_person_id ON weight_entries(person_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_date ON weight_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_person_id ON workouts(person_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_household_id ON meals(household_id);
CREATE INDEX IF NOT EXISTS idx_meals_person_id ON meals(person_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date DESC);
CREATE INDEX IF NOT EXISTS idx_pantry_items_household_id ON pantry_items(household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_household_id ON grocery_items(household_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

CREATE OR REPLACE FUNCTION update_pantry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pantry_items_updated_at ON pantry_items;
CREATE TRIGGER trigger_pantry_items_updated_at
    BEFORE UPDATE ON pantry_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pantry_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their household" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Users can update their household" ON households;
DROP POLICY IF EXISTS "Users can view persons in their household" ON persons;
DROP POLICY IF EXISTS "Users can create persons in their household" ON persons;
DROP POLICY IF EXISTS "Users can update persons in their household" ON persons;
DROP POLICY IF EXISTS "Users can delete persons in their household" ON persons;
DROP POLICY IF EXISTS "Users can view weight entries for their household persons" ON weight_entries;
DROP POLICY IF EXISTS "Users can create weight entries for their household persons" ON weight_entries;
DROP POLICY IF EXISTS "Users can update weight entries for their household persons" ON weight_entries;
DROP POLICY IF EXISTS "Users can delete weight entries for their household persons" ON weight_entries;
DROP POLICY IF EXISTS "Users can view workouts for their household persons" ON workouts;
DROP POLICY IF EXISTS "Users can create workouts for their household persons" ON workouts;
DROP POLICY IF EXISTS "Users can update workouts for their household persons" ON workouts;
DROP POLICY IF EXISTS "Users can delete workouts for their household persons" ON workouts;
DROP POLICY IF EXISTS "Users can view meals in their household" ON meals;
DROP POLICY IF EXISTS "Users can create meals in their household" ON meals;
DROP POLICY IF EXISTS "Users can update meals in their household" ON meals;
DROP POLICY IF EXISTS "Users can delete meals in their household" ON meals;
DROP POLICY IF EXISTS "Users can view pantry items in their household" ON pantry_items;
DROP POLICY IF EXISTS "Users can create pantry items in their household" ON pantry_items;
DROP POLICY IF EXISTS "Users can update pantry items in their household" ON pantry_items;
DROP POLICY IF EXISTS "Users can delete pantry items in their household" ON pantry_items;
DROP POLICY IF EXISTS "Users can view public recipes or their household recipes" ON recipes;
DROP POLICY IF EXISTS "Users can create recipes in their household" ON recipes;
DROP POLICY IF EXISTS "Users can update recipes in their household" ON recipes;
DROP POLICY IF EXISTS "Users can delete recipes in their household" ON recipes;
DROP POLICY IF EXISTS "Users can view grocery items in their household" ON grocery_items;
DROP POLICY IF EXISTS "Users can create grocery items in their household" ON grocery_items;
DROP POLICY IF EXISTS "Users can update grocery items in their household" ON grocery_items;
DROP POLICY IF EXISTS "Users can delete grocery items in their household" ON grocery_items;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: households
-- ============================================================================

CREATE POLICY "Users can view their household"
    ON households FOR SELECT
    USING (
        id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create households"
    ON households FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their household"
    ON households FOR UPDATE
    USING (
        id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- RLS POLICIES: persons
-- ============================================================================

CREATE POLICY "Users can view persons in their household"
    ON persons FOR SELECT
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create persons in their household"
    ON persons FOR INSERT
    WITH CHECK (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update persons in their household"
    ON persons FOR UPDATE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete persons in their household"
    ON persons FOR DELETE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- RLS POLICIES: weight_entries
-- ============================================================================

CREATE POLICY "Users can view weight entries for their household persons"
    ON weight_entries FOR SELECT
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can create weight entries for their household persons"
    ON weight_entries FOR INSERT
    WITH CHECK (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can update weight entries for their household persons"
    ON weight_entries FOR UPDATE
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete weight entries for their household persons"
    ON weight_entries FOR DELETE
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: workouts
-- ============================================================================

CREATE POLICY "Users can view workouts for their household persons"
    ON workouts FOR SELECT
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can create workouts for their household persons"
    ON workouts FOR INSERT
    WITH CHECK (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can update workouts for their household persons"
    ON workouts FOR UPDATE
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete workouts for their household persons"
    ON workouts FOR DELETE
    USING (
        person_id IN (
            SELECT p.id FROM persons p
            JOIN profiles pr ON p.household_id = pr.household_id
            WHERE pr.id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: meals
-- ============================================================================

CREATE POLICY "Users can view meals in their household"
    ON meals FOR SELECT
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create meals in their household"
    ON meals FOR INSERT
    WITH CHECK (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update meals in their household"
    ON meals FOR UPDATE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete meals in their household"
    ON meals FOR DELETE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- RLS POLICIES: pantry_items
-- ============================================================================

CREATE POLICY "Users can view pantry items in their household"
    ON pantry_items FOR SELECT
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create pantry items in their household"
    ON pantry_items FOR INSERT
    WITH CHECK (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update pantry items in their household"
    ON pantry_items FOR UPDATE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete pantry items in their household"
    ON pantry_items FOR DELETE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- RLS POLICIES: recipes
-- ============================================================================

CREATE POLICY "Users can view public recipes or their household recipes"
    ON recipes FOR SELECT
    USING (
        is_public = true
        OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create recipes in their household"
    ON recipes FOR INSERT
    WITH CHECK (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update recipes in their household"
    ON recipes FOR UPDATE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete recipes in their household"
    ON recipes FOR DELETE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- RLS POLICIES: grocery_items
-- ============================================================================

CREATE POLICY "Users can view grocery items in their household"
    ON grocery_items FOR SELECT
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create grocery items in their household"
    ON grocery_items FOR INSERT
    WITH CHECK (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update grocery items in their household"
    ON grocery_items FOR UPDATE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete grocery items in their household"
    ON grocery_items FOR DELETE
    USING (
        household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- FUNCTION: handle_new_user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_household_id UUID;
BEGIN
    -- Create a new household for the user
    INSERT INTO public.households (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', 'My') || '''s Household')
    RETURNING id INTO new_household_id;

    -- Create the user's profile linked to the household
    INSERT INTO public.profiles (id, household_id, display_name)
    VALUES (
        NEW.id,
        new_household_id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
