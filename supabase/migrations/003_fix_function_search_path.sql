-- FITNESS-TRACKER Function Security Fix Migration
-- Created: 2025-12-31
-- Description: Fixes function search_path security warnings

-- ============================================================================
-- FIX: update_profile_updated_at function
-- Sets search_path to prevent role mutable search_path vulnerability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX: handle_new_user function
-- Sets search_path to prevent role mutable search_path vulnerability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
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

    -- Create default persons for the household
    INSERT INTO public.persons (name, training_focus, household_id)
    VALUES
        ('Him', 'powerlifting', new_household_id),
        ('Her', 'cardio', new_household_id);

    RETURN NEW;
END;
$$;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON FUNCTION public.update_profile_updated_at() IS 'Trigger function to update profile updated_at timestamp';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create household, profile and default persons for new users';
