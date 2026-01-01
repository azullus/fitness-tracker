-- FITNESS-TRACKER Authentication Schema Migration (SAFE VERSION)
-- Created: 2025-12-31
-- Description: Adds authentication support with households and RLS policies
-- Note: Uses IF NOT EXISTS to handle partial migrations

-- ============================================================================
-- TABLE: households
-- ============================================================================

CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'My Household',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE households IS 'Groups of users sharing fitness data';

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';

-- Trigger for profiles updated_at
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

-- ============================================================================
-- ALTER TABLES: Add household_id columns (safe - checks if exists)
-- ============================================================================

DO $$
BEGIN
    -- persons.household_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'persons' AND column_name = 'household_id') THEN
        ALTER TABLE persons ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- meals.household_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'meals' AND column_name = 'household_id') THEN
        ALTER TABLE meals ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- meals.person_id (already exists based on error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'meals' AND column_name = 'person_id') THEN
        ALTER TABLE meals ADD COLUMN person_id UUID REFERENCES persons(id) ON DELETE SET NULL;
    END IF;

    -- pantry_items.household_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'pantry_items' AND column_name = 'household_id') THEN
        ALTER TABLE pantry_items ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- recipes.household_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'household_id') THEN
        ALTER TABLE recipes ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- recipes.is_public
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'is_public') THEN
        ALTER TABLE recipes ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- grocery_items.household_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'grocery_items' AND column_name = 'household_id') THEN
        ALTER TABLE grocery_items ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- INDEXES (safe - uses IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_persons_household_id ON persons(household_id);
CREATE INDEX IF NOT EXISTS idx_meals_household_id ON meals(household_id);
CREATE INDEX IF NOT EXISTS idx_meals_person_id ON meals(person_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_household_id ON pantry_items(household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_household_id ON grocery_items(household_id);

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
-- DROP EXISTING POLICIES (clean slate)
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
RETURNS TRIGGER AS $$
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

    -- Create default persons for the household
    INSERT INTO public.persons (name, training_focus, household_id)
    VALUES
        ('Him', 'powerlifting', new_household_id),
        ('Her', 'cardio', new_household_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
