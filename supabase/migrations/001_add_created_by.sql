-- Migration: Add created_by column to shared tables for ownership tracking
-- Run this in Supabase SQL Editor if you have existing data

-- Add created_by column to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column to meal_plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column to pantry_items
ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column to grocery_items
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can update recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can delete recipes" ON recipes;

DROP POLICY IF EXISTS "Authenticated users can insert meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Authenticated users can update meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Authenticated users can delete meal plans" ON meal_plans;

DROP POLICY IF EXISTS "Authenticated users can insert pantry items" ON pantry_items;
DROP POLICY IF EXISTS "Authenticated users can update pantry items" ON pantry_items;
DROP POLICY IF EXISTS "Authenticated users can delete pantry items" ON pantry_items;

DROP POLICY IF EXISTS "Authenticated users can insert grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Authenticated users can update grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Authenticated users can delete grocery items" ON grocery_items;

-- Create new ownership-based policies for recipes
CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create new ownership-based policies for meal_plans
CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create new ownership-based policies for pantry_items
CREATE POLICY "Users can insert own pantry items" ON pantry_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own pantry items" ON pantry_items
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create new ownership-based policies for grocery_items
CREATE POLICY "Users can insert own grocery items" ON grocery_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own grocery items" ON grocery_items
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own grocery items" ON grocery_items
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create indexes for created_by columns (for performance)
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_by ON meal_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_pantry_items_created_by ON pantry_items(created_by);
CREATE INDEX IF NOT EXISTS idx_grocery_items_created_by ON grocery_items(created_by);
