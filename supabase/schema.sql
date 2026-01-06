-- Fitness Tracker Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================
-- TABLES
-- ============================================

-- Persons table (linked to auth.users)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  training_focus TEXT DEFAULT '',
  allergies TEXT DEFAULT '',
  supplements TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight logs
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_lbs DECIMAL(5,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, date)
);

-- Workout logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type TEXT,
  completed BOOLEAN DEFAULT FALSE,
  main_lifts TEXT,
  top_set_weight DECIMAL(6,1),
  rpe TEXT,
  is_pr BOOLEAN DEFAULT FALSE,
  activities TEXT,
  duration_min INTEGER,
  intensity TEXT,
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout exercises (weekly schedule)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  workout_type TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  weight TEXT,
  rest_seconds INTEGER DEFAULT 60,
  muscle_group TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  prep_time_min INTEGER DEFAULT 0,
  cook_time_min INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 2,
  calories INTEGER DEFAULT 0,
  protein_g INTEGER DEFAULT 0,
  carbs_g INTEGER DEFAULT 0,
  fat_g INTEGER DEFAULT 0,
  fiber_g INTEGER DEFAULT 0,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, meal_type)
);

-- Pantry items
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'each',
  category TEXT DEFAULT 'General',
  location TEXT,
  restock_when_low BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grocery items
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT,
  category TEXT,
  store TEXT,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_weight_logs_person_date ON weight_logs(person_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_person_date ON workout_logs(person_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_person_day ON workout_exercises(person_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- Persons: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON persons
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON persons
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON persons
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Weight logs: Users can only access their own logs
CREATE POLICY "Users can view own weight logs" ON weight_logs
  FOR SELECT USING (auth.uid() = person_id);

CREATE POLICY "Users can insert own weight logs" ON weight_logs
  FOR INSERT WITH CHECK (auth.uid() = person_id);

CREATE POLICY "Users can update own weight logs" ON weight_logs
  FOR UPDATE USING (auth.uid() = person_id);

CREATE POLICY "Users can delete own weight logs" ON weight_logs
  FOR DELETE USING (auth.uid() = person_id);

-- Workout logs: Users can only access their own logs
CREATE POLICY "Users can view own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = person_id);

CREATE POLICY "Users can insert own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = person_id);

CREATE POLICY "Users can update own workout logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = person_id);

CREATE POLICY "Users can delete own workout logs" ON workout_logs
  FOR DELETE USING (auth.uid() = person_id);

-- Workout exercises: Users can only access their own exercises
CREATE POLICY "Users can view own workout exercises" ON workout_exercises
  FOR SELECT USING (auth.uid() = person_id);

CREATE POLICY "Users can insert own workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (auth.uid() = person_id);

CREATE POLICY "Users can update own workout exercises" ON workout_exercises
  FOR UPDATE USING (auth.uid() = person_id);

CREATE POLICY "Users can delete own workout exercises" ON workout_exercises
  FOR DELETE USING (auth.uid() = person_id);

-- Recipes: All authenticated users can view, only creators can modify
CREATE POLICY "Authenticated users can view recipes" ON recipes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Meal plans: All authenticated users can view, only creators can modify
CREATE POLICY "Authenticated users can view meal plans" ON meal_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Pantry items: All authenticated users can view, only creators can modify
CREATE POLICY "Authenticated users can view pantry items" ON pantry_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own pantry items" ON pantry_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own pantry items" ON pantry_items
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Grocery items: All authenticated users can view, only creators can modify
CREATE POLICY "Authenticated users can view grocery items" ON grocery_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own grocery items" ON grocery_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own grocery items" ON grocery_items
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own grocery items" ON grocery_items
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create person record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.persons (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create person on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA (Optional - Sample Recipes)
-- ============================================

-- Uncomment to add sample recipes
/*
INSERT INTO recipes (name, category, prep_time_min, cook_time_min, servings, calories, protein_g, carbs_g, fat_g, fiber_g, ingredients, instructions, tags) VALUES
(
  'Protein Oatmeal',
  'Breakfast',
  5,
  10,
  2,
  450,
  35,
  55,
  10,
  8,
  '[{"amount": "1", "unit": "cup", "item": "oats"}, {"amount": "2", "unit": "scoops", "item": "protein powder"}, {"amount": "1", "unit": "cup", "item": "milk"}, {"amount": "1", "unit": "tbsp", "item": "honey"}]',
  '["Bring milk to a boil", "Add oats and reduce heat", "Cook for 5 minutes stirring occasionally", "Remove from heat and stir in protein powder", "Top with honey and serve"]',
  '["high-protein", "quick", "meal-prep"]'
),
(
  'Chicken Stir Fry',
  'Dinner',
  15,
  20,
  2,
  550,
  45,
  35,
  18,
  6,
  '[{"amount": "1", "unit": "lb", "item": "chicken breast"}, {"amount": "2", "unit": "cups", "item": "mixed vegetables"}, {"amount": "2", "unit": "tbsp", "item": "soy sauce"}, {"amount": "1", "unit": "cup", "item": "rice"}]',
  '["Cook rice according to package", "Cut chicken into cubes", "Stir fry chicken until cooked through", "Add vegetables and soy sauce", "Serve over rice"]',
  '["high-protein", "balanced", "quick"]'
);
*/
