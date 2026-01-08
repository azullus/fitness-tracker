// Database types
export interface WeightEntry {
  id: string;
  person_id: string;
  date: string;
  weight_lbs: number;
  notes?: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number; // in cm
  weight: number; // current weight in lbs
  bmi: number;
  dailyCalorieTarget: number;
  training_focus: 'powerlifting' | 'cardio' | 'mixed' | 'weight_loss';
  workoutDaysPerWeek: number; // 3-7 days per week
  householdId: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  memberIds: string[];
  created_at: string;
}

export interface Workout {
  id: string;
  person_id: string;
  date: string;
  type: string;
  exercises: Exercise[];
  duration_minutes?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
  completed: boolean;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface Meal {
  id: string;
  person_id?: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  created_at: string;
}

export interface PantryItem {
  id: string;
  category: string;
  // SQLite uses 'item', Supabase/demo uses 'name'
  item?: string;
  name?: string;
  quantity: number;
  unit: string;
  location?: string;
  // SQLite uses 'restock_when_low' (boolean), Supabase/demo uses 'low_stock_threshold' (number)
  restock_when_low?: boolean;
  low_stock_threshold?: number;
  expires_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  // SQLite uses prep_time_min/cook_time_min, other sources use prep_time_minutes/cook_time_minutes
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  prep_time_min?: number;
  cook_time_min?: number;
  servings: number;
  baseServings?: number; // Original serving count for scaling
  ingredients: RecipeIngredient[];
  instructions: string[];
  // SQLite stores nutrition at top level, other sources may use nested nutrition object
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  nutrition?: NutritionInfo;
  macrosPerServing?: MacrosPerServing;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export interface MacrosPerServing {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeIngredient {
  item: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface NutritionInfo {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

// Meal Plan types
export interface MealPlanRecipe {
  id: string;
  name: string;
  category: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  notes?: string | null;
}

export interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  recipe_id?: string;
  notes?: string;
  recipe?: MealPlanRecipe;
}

// Grocery types
export interface GroceryItem {
  id: string;
  week_start: string;
  store: string;
  category?: string;
  item: string;
  quantity?: string;
  unit_price?: string;
  needed: boolean;
  purchased: boolean;
  notes?: string;
  created_at: string;
}

// Workout Exercise types (weekly plan)
export interface WorkoutExercise {
  id: string;
  person_id: string;
  week_number: number;
  day_of_week: string;
  workout_type: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight_intensity?: string;
  rest_period?: string;
  target_muscles?: string;
  notes?: string;
  sort_order: number;
}

// UI types
export interface DashboardStats {
  currentWeight: number;
  weeklyWeightChange: number;
  workoutsThisWeek: number;
  workoutStreak: number;
  mealsPlanned: number;
  pantryItemsLow: number;
}

// Type aliases for API compatibility
export type WeightLog = WeightEntry;

// WorkoutLog matches the SQLite workout_logs table schema
export interface WorkoutLog {
  id: string;
  person_id: string;
  date: string;
  workout_type: string;
  completed: boolean;
  main_lifts?: string;
  top_set_weight?: number;
  rpe?: string;
  is_pr?: boolean;
  activities?: string;
  duration_min?: number;
  intensity?: string;
  energy?: number;
  notes?: string;
  created_at?: string;
}
