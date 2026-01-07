-- Migration: Atomic Operations for Race Condition Prevention
-- This migration adds PostgreSQL functions for atomic updates to prevent race conditions
-- in concurrent read-modify-write operations.

-- ============================================================================
-- PANTRY: Atomic quantity delta update
-- ============================================================================
-- This function atomically updates a pantry item's quantity by a delta value.
-- It prevents race conditions that can occur when multiple requests try to
-- update the same item's quantity simultaneously.
--
-- Example race condition without atomic update:
--   Request A reads quantity=10
--   Request B reads quantity=10
--   Request A writes quantity=10-1=9
--   Request B writes quantity=10-1=9  <- Should be 8!
--
-- This function performs the read and write in a single atomic operation.

CREATE OR REPLACE FUNCTION update_pantry_quantity_delta(
    item_id UUID,
    quantity_delta NUMERIC
)
RETURNS pantry_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_item pantry_items;
BEGIN
    UPDATE pantry_items
    SET
        quantity = GREATEST(0, quantity + quantity_delta),
        updated_at = NOW()
    WHERE id = item_id
    RETURNING * INTO updated_item;

    RETURN updated_item;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_pantry_quantity_delta(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION update_pantry_quantity_delta(UUID, NUMERIC) TO anon;

-- ============================================================================
-- WEIGHT: Upsert weight entry (atomic insert or update by person_id + date)
-- ============================================================================
-- This function atomically creates or updates a weight entry for a specific
-- person on a specific date. It prevents race conditions when multiple requests
-- try to log weight for the same person on the same date.

CREATE OR REPLACE FUNCTION upsert_weight_entry(
    p_person_id UUID,
    p_date DATE,
    p_weight_lbs NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS weight_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_entry weight_entries;
BEGIN
    INSERT INTO weight_entries (person_id, date, weight_lbs, notes)
    VALUES (p_person_id, p_date, p_weight_lbs, p_notes)
    ON CONFLICT (person_id, date) DO UPDATE SET
        weight_lbs = EXCLUDED.weight_lbs,
        notes = COALESCE(EXCLUDED.notes, weight_entries.notes)
    RETURNING * INTO result_entry;

    RETURN result_entry;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_weight_entry(UUID, DATE, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weight_entry(UUID, DATE, NUMERIC, TEXT) TO anon;

-- ============================================================================
-- WEIGHT ENTRIES: Add unique constraint for upsert to work
-- ============================================================================
-- This constraint ensures only one weight entry per person per date,
-- which is required for the ON CONFLICT clause to work correctly.

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'weight_entries_person_date_unique'
    ) THEN
        -- Create unique constraint on (person_id, date)
        ALTER TABLE weight_entries
        ADD CONSTRAINT weight_entries_person_date_unique
        UNIQUE (person_id, date);
    END IF;
END $$;

-- ============================================================================
-- WATER INTAKE: Atomic increment for daily water tracking
-- ============================================================================
-- While water intake typically allows multiple entries per day,
-- this function provides an atomic way to add water intake.

CREATE OR REPLACE FUNCTION add_water_intake(
    p_person_id UUID,
    p_date DATE,
    p_amount_ml INTEGER
)
RETURNS water_intake
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_entry water_intake;
BEGIN
    INSERT INTO water_intake (person_id, date, amount_ml)
    VALUES (p_person_id, p_date, p_amount_ml)
    RETURNING * INTO new_entry;

    RETURN new_entry;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_water_intake(UUID, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_water_intake(UUID, DATE, INTEGER) TO anon;

-- ============================================================================
-- Helper: Get total water intake for a day (aggregated)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_water_total(
    p_person_id UUID,
    p_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_ml INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount_ml), 0)
    INTO total_ml
    FROM water_intake
    WHERE person_id = p_person_id AND date = p_date;

    RETURN total_ml;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_daily_water_total(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_water_total(UUID, DATE) TO anon;
