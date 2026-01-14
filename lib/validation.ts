/**
 * Validation utilities for API routes
 * Provides comprehensive input validation for dates, numeric ranges, and foreign keys
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getPersonById } from '@/lib/database';
import { DEMO_PERSONS } from '@/lib/demo-data';

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Validates that a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Verify it's a valid date (e.g., not 2024-02-30)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Ensure the parsed date matches the input (handles invalid dates like 2024-02-31)
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validates that a date is within a reasonable range
 * @param dateString - Date in YYYY-MM-DD format
 * @param options - Configuration for date range validation
 * @returns Validation result with error message if invalid
 */
export function validateDateRange(
  dateString: string,
  options: {
    maxYearsInPast?: number;
    maxYearsInFuture?: number;
  } = {}
): ValidationResult {
  const { maxYearsInPast = 10, maxYearsInFuture = 1 } = options;

  if (!isValidDateFormat(dateString)) {
    return {
      valid: false,
      error: `Invalid date format. Expected YYYY-MM-DD, got: ${dateString}`,
    };
  }

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const minDate = new Date(today);
  minDate.setFullYear(minDate.getFullYear() - maxYearsInPast);

  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsInFuture);

  if (date < minDate) {
    return {
      valid: false,
      error: `Date is too far in the past. Must be within ${maxYearsInPast} years.`,
    };
  }

  if (date > maxDate) {
    return {
      valid: false,
      error: `Date is too far in the future. Must be within ${maxYearsInFuture} year(s).`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Numeric Range Validation
// ============================================================================

export interface NumericRangeConfig {
  min: number;
  max: number;
  fieldName: string;
  allowUndefined?: boolean;
}

/**
 * Validates that a number is within a specified range
 */
export function validateNumericRange(
  value: unknown,
  config: NumericRangeConfig
): ValidationResult {
  const { min, max, fieldName, allowUndefined = false } = config;

  if (value === undefined || value === null) {
    if (allowUndefined) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }

  if (typeof value !== 'number') {
    return {
      valid: false,
      error: `${fieldName} must be a number`,
    };
  }

  if (isNaN(value)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return { valid: true };
}

// Pre-configured validators for common fields
export const NumericValidators = {
  weight: (value: unknown) =>
    validateNumericRange(value, {
      min: 50,
      max: 1000,
      fieldName: 'weight_lbs',
    }),

  weightOptional: (value: unknown) =>
    validateNumericRange(value, {
      min: 50,
      max: 1000,
      fieldName: 'weight_lbs',
      allowUndefined: true,
    }),

  calories: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 10000,
      fieldName: 'calories',
      allowUndefined: true,
    }),

  protein: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1000,
      fieldName: 'protein_g',
      allowUndefined: true,
    }),

  carbs: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1000,
      fieldName: 'carbs_g',
      allowUndefined: true,
    }),

  fat: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1000,
      fieldName: 'fat_g',
      allowUndefined: true,
    }),

  fiber: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1000,
      fieldName: 'fiber_g',
      allowUndefined: true,
    }),

  age: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 150,
      fieldName: 'age',
    }),

  height: (value: unknown) =>
    validateNumericRange(value, {
      min: 50,
      max: 300,
      fieldName: 'height',
    }),

  servings: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 100,
      fieldName: 'servings',
    }),

  duration: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1440, // 24 hours in minutes
      fieldName: 'duration_minutes',
      allowUndefined: true,
    }),

  quantity: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 100000,
      fieldName: 'quantity',
    }),

  quantityOptional: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 100000,
      fieldName: 'quantity',
      allowUndefined: true,
    }),

  prepTime: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1440,
      fieldName: 'prep_time_minutes',
      allowUndefined: true,
    }),

  cookTime: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 1440,
      fieldName: 'cook_time_minutes',
      allowUndefined: true,
    }),

  lowStockThreshold: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 100000,
      fieldName: 'low_stock_threshold',
      allowUndefined: true,
    }),

  dailyCalorieTarget: (value: unknown) =>
    validateNumericRange(value, {
      min: 500,
      max: 10000,
      fieldName: 'dailyCalorieTarget',
      allowUndefined: true,
    }),

  workoutDaysPerWeek: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 7,
      fieldName: 'workoutDaysPerWeek',
      allowUndefined: true,
    }),

  exerciseWeight: (value: unknown) =>
    validateNumericRange(value, {
      min: 0,
      max: 2000,
      fieldName: 'weight_lbs',
      allowUndefined: true,
    }),

  sets: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 100,
      fieldName: 'sets',
      allowUndefined: true,
    }),

  reps: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 1000,
      fieldName: 'reps',
      allowUndefined: true,
    }),

  rpe: (value: unknown) =>
    validateNumericRange(value, {
      min: 1,
      max: 10,
      fieldName: 'rpe',
      allowUndefined: true,
    }),
};

// ============================================================================
// Barcode Validation
// ============================================================================

/**
 * Validates barcode format (UPC-A, UPC-E, EAN-8, EAN-13)
 */
export function validateBarcode(barcode: unknown): ValidationResult {
  if (typeof barcode !== 'string') {
    return {
      valid: false,
      error: 'Barcode must be a string',
    };
  }

  // Remove any whitespace
  const cleaned = barcode.replace(/\s/g, '');

  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Barcode must contain only digits',
    };
  }

  // Valid lengths: 8 (UPC-E/EAN-8), 12 (UPC-A), 13 (EAN-13)
  const validLengths = [8, 12, 13];
  if (!validLengths.includes(cleaned.length)) {
    return {
      valid: false,
      error: 'Invalid barcode length. Must be 8, 12, or 13 digits.',
    };
  }

  return { valid: true };
}

// ============================================================================
// Foreign Key Validation
// ============================================================================

/**
 * Validates that a person_id exists in the database
 * Returns true for demo mode or when the person exists
 */
export async function validatePersonExists(
  personId: string
): Promise<ValidationResult> {
  if (!personId) {
    return {
      valid: false,
      error: 'person_id is required',
    };
  }

  // Check SQLite first
  if (isSQLiteEnabled()) {
    const person = getPersonById(personId);
    if (person) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `Person with id '${personId}' not found`,
    };
  }

  // Check Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from('persons')
        .select('id')
        .eq('id', personId)
        .single();

      if (error || !data) {
        return {
          valid: false,
          error: `Person with id '${personId}' not found`,
        };
      }

      return { valid: true };
    } catch {
      // On error, fall through to demo check
    }
  }

  // Demo mode - check against demo persons
  const demoPerson = DEMO_PERSONS.find((p) => p.id === personId);
  if (demoPerson) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Person with id '${personId}' not found`,
  };
}

// ============================================================================
// Batch Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Runs multiple validations and collects all errors
 */
export function runValidations(
  validations: Array<{ field: string; result: ValidationResult }>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const { field, result } of validations) {
    if (!result.valid && result.error) {
      errors.push({ field, message: result.error });
    }
  }

  return errors;
}

/**
 * Formats validation errors for API response
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message;
  }

  return `Multiple validation errors: ${errors.map((e) => e.message).join('; ')}`;
}

// ============================================================================
// Meal-specific Validation
// ============================================================================

export interface MealValidationData {
  date?: string;
  meal_type?: string;
  name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  person_id?: string;
}

export function validateMealData(
  data: MealValidationData
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field: date
  if (data.date !== undefined) {
    const dateResult = validateDateRange(data.date);
    if (!dateResult.valid) {
      errors.push({ field: 'date', message: dateResult.error! });
    }
  }

  // Validate meal_type
  if (data.meal_type !== undefined) {
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(data.meal_type)) {
      errors.push({
        field: 'meal_type',
        message: `Invalid meal_type. Must be one of: ${validMealTypes.join(', ')}`,
      });
    }
  }

  // Validate macros
  const macroValidations = [
    { field: 'calories', result: NumericValidators.calories(data.calories) },
    { field: 'protein_g', result: NumericValidators.protein(data.protein_g) },
    { field: 'carbs_g', result: NumericValidators.carbs(data.carbs_g) },
    { field: 'fat_g', result: NumericValidators.fat(data.fat_g) },
    { field: 'fiber_g', result: NumericValidators.fiber(data.fiber_g) },
  ];

  errors.push(...runValidations(macroValidations));

  return errors;
}

// ============================================================================
// Weight Entry Validation
// ============================================================================

export interface WeightEntryValidationData {
  person_id?: string;
  date?: string;
  weight_lbs?: number;
}

export function validateWeightEntryData(
  data: WeightEntryValidationData
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate date
  if (data.date !== undefined) {
    const dateResult = validateDateRange(data.date);
    if (!dateResult.valid) {
      errors.push({ field: 'date', message: dateResult.error! });
    }
  }

  // Validate weight
  if (data.weight_lbs !== undefined) {
    const weightResult = NumericValidators.weight(data.weight_lbs);
    if (!weightResult.valid) {
      errors.push({ field: 'weight_lbs', message: weightResult.error! });
    }
  }

  return errors;
}

// ============================================================================
// Person Validation
// ============================================================================

export interface PersonValidationData {
  name?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  dailyCalorieTarget?: number;
  training_focus?: string;
  workoutDaysPerWeek?: number;
}

export function validatePersonData(data: PersonValidationData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate age
  if (data.age !== undefined) {
    const ageResult = NumericValidators.age(data.age);
    if (!ageResult.valid) {
      errors.push({ field: 'age', message: ageResult.error! });
    }
  }

  // Validate height
  if (data.height !== undefined) {
    const heightResult = NumericValidators.height(data.height);
    if (!heightResult.valid) {
      errors.push({ field: 'height', message: heightResult.error! });
    }
  }

  // Validate weight
  if (data.weight !== undefined) {
    const weightResult = NumericValidators.weight(data.weight);
    if (!weightResult.valid) {
      errors.push({ field: 'weight', message: weightResult.error! });
    }
  }

  // Validate dailyCalorieTarget
  if (data.dailyCalorieTarget !== undefined) {
    const calorieResult = NumericValidators.dailyCalorieTarget(data.dailyCalorieTarget);
    if (!calorieResult.valid) {
      errors.push({ field: 'dailyCalorieTarget', message: calorieResult.error! });
    }
  }

  // Validate workoutDaysPerWeek
  if (data.workoutDaysPerWeek !== undefined) {
    const daysResult = NumericValidators.workoutDaysPerWeek(data.workoutDaysPerWeek);
    if (!daysResult.valid) {
      errors.push({ field: 'workoutDaysPerWeek', message: daysResult.error! });
    }
  }

  // Validate gender
  if (data.gender !== undefined) {
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(data.gender)) {
      errors.push({
        field: 'gender',
        message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`,
      });
    }
  }

  // Validate training_focus
  if (data.training_focus !== undefined) {
    const validFocuses = ['powerlifting', 'cardio', 'mixed', 'weight_loss'];
    if (!validFocuses.includes(data.training_focus)) {
      errors.push({
        field: 'training_focus',
        message: `Invalid training_focus. Must be one of: ${validFocuses.join(', ')}`,
      });
    }
  }

  return errors;
}

// ============================================================================
// Workout Validation
// ============================================================================

export interface WorkoutValidationData {
  person_id?: string;
  date?: string;
  type?: string;
  exercises?: Exercise[];
  duration_minutes?: number;
  intensity?: string;
}

interface Exercise {
  name?: string;
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  rpe?: number;
}

export function validateWorkoutData(data: WorkoutValidationData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate date
  if (data.date !== undefined) {
    const dateResult = validateDateRange(data.date, { maxYearsInFuture: 1 });
    if (!dateResult.valid) {
      errors.push({ field: 'date', message: dateResult.error! });
    }
  }

  // Validate duration
  if (data.duration_minutes !== undefined) {
    const durationResult = NumericValidators.duration(data.duration_minutes);
    if (!durationResult.valid) {
      errors.push({ field: 'duration_minutes', message: durationResult.error! });
    }
  }

  // Validate intensity
  if (data.intensity !== undefined) {
    const validIntensities = ['low', 'medium', 'high'];
    if (!validIntensities.includes(data.intensity)) {
      errors.push({
        field: 'intensity',
        message: `Invalid intensity. Must be one of: ${validIntensities.join(', ')}`,
      });
    }
  }

  // Validate exercises
  if (data.exercises && Array.isArray(data.exercises)) {
    for (let i = 0; i < data.exercises.length; i++) {
      const exercise = data.exercises[i];

      if (exercise.sets !== undefined) {
        const setsResult = NumericValidators.sets(exercise.sets);
        if (!setsResult.valid) {
          errors.push({ field: `exercises[${i}].sets`, message: setsResult.error! });
        }
      }

      if (exercise.reps !== undefined) {
        const repsResult = NumericValidators.reps(exercise.reps);
        if (!repsResult.valid) {
          errors.push({ field: `exercises[${i}].reps`, message: repsResult.error! });
        }
      }

      if (exercise.weight_lbs !== undefined) {
        const weightResult = NumericValidators.exerciseWeight(exercise.weight_lbs);
        if (!weightResult.valid) {
          errors.push({ field: `exercises[${i}].weight_lbs`, message: weightResult.error! });
        }
      }

      if (exercise.rpe !== undefined) {
        const rpeResult = NumericValidators.rpe(exercise.rpe);
        if (!rpeResult.valid) {
          errors.push({ field: `exercises[${i}].rpe`, message: rpeResult.error! });
        }
      }
    }
  }

  return errors;
}

// ============================================================================
// Recipe Validation
// ============================================================================

export interface RecipeValidationData {
  name?: string;
  category?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  ingredients?: RecipeIngredient[];
  nutrition?: NutritionInfo;
}

interface RecipeIngredient {
  item?: string;
  quantity?: number;
  unit?: string;
}

interface NutritionInfo {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

export function validateRecipeData(data: RecipeValidationData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate category
  if (data.category !== undefined) {
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validCategories.includes(data.category)) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }
  }

  // Validate prep_time_minutes
  if (data.prep_time_minutes !== undefined) {
    const prepResult = NumericValidators.prepTime(data.prep_time_minutes);
    if (!prepResult.valid) {
      errors.push({ field: 'prep_time_minutes', message: prepResult.error! });
    }
  }

  // Validate cook_time_minutes
  if (data.cook_time_minutes !== undefined) {
    const cookResult = NumericValidators.cookTime(data.cook_time_minutes);
    if (!cookResult.valid) {
      errors.push({ field: 'cook_time_minutes', message: cookResult.error! });
    }
  }

  // Validate servings
  if (data.servings !== undefined) {
    const servingsResult = NumericValidators.servings(data.servings);
    if (!servingsResult.valid) {
      errors.push({ field: 'servings', message: servingsResult.error! });
    }
  }

  // Validate ingredients
  if (data.ingredients && Array.isArray(data.ingredients)) {
    for (let i = 0; i < data.ingredients.length; i++) {
      const ingredient = data.ingredients[i];

      if (ingredient.quantity !== undefined) {
        const qtyResult = NumericValidators.quantityOptional(ingredient.quantity);
        if (!qtyResult.valid) {
          errors.push({ field: `ingredients[${i}].quantity`, message: qtyResult.error! });
        }
      }
    }
  }

  // Validate nutrition
  if (data.nutrition) {
    const nutritionValidations = [
      { field: 'nutrition.calories', result: NumericValidators.calories(data.nutrition.calories) },
      { field: 'nutrition.protein_g', result: NumericValidators.protein(data.nutrition.protein_g) },
      { field: 'nutrition.carbs_g', result: NumericValidators.carbs(data.nutrition.carbs_g) },
      { field: 'nutrition.fat_g', result: NumericValidators.fat(data.nutrition.fat_g) },
      { field: 'nutrition.fiber_g', result: NumericValidators.fiber(data.nutrition.fiber_g) },
    ];

    errors.push(...runValidations(nutritionValidations));
  }

  return errors;
}

// ============================================================================
// Pantry Item Validation
// ============================================================================

export interface PantryItemValidationData {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expires_at?: string;
  low_stock_threshold?: number;
}

export function validatePantryItemData(data: PantryItemValidationData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate quantity
  if (data.quantity !== undefined) {
    const qtyResult = NumericValidators.quantity(data.quantity);
    if (!qtyResult.valid) {
      errors.push({ field: 'quantity', message: qtyResult.error! });
    }
  }

  // Validate low_stock_threshold
  if (data.low_stock_threshold !== undefined) {
    const thresholdResult = NumericValidators.lowStockThreshold(data.low_stock_threshold);
    if (!thresholdResult.valid) {
      errors.push({ field: 'low_stock_threshold', message: thresholdResult.error! });
    }
  }

  // Validate expires_at date if provided
  if (data.expires_at !== undefined && data.expires_at !== null && data.expires_at !== '') {
    const dateResult = validateDateRange(data.expires_at, { maxYearsInPast: 1, maxYearsInFuture: 10 });
    if (!dateResult.valid) {
      errors.push({ field: 'expires_at', message: dateResult.error! });
    }
  }

  return errors;
}
