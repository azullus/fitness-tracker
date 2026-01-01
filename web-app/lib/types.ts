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
  training_focus: 'powerlifting' | 'cardio' | 'mixed';
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
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location?: string;
  expires_at?: string;
  low_stock_threshold?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  baseServings: number; // Original serving count for scaling
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  macrosPerServing?: MacrosPerServing;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  created_at: string;
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

// UI types
export interface DashboardStats {
  currentWeight: number;
  weeklyWeightChange: number;
  workoutsThisWeek: number;
  workoutStreak: number;
  mealsPlanned: number;
  pantryItemsLow: number;
}
