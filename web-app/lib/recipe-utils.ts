// Recipe scaling and calculation utilities for FITNESS-TRACKER

import type { Recipe, RecipeIngredient, MacrosPerServing, Person } from './types';

/**
 * Scale a recipe to a different number of servings
 */
export function scaleRecipe(recipe: Recipe, newServings: number): Recipe {
  // Guard against division by zero
  if (!recipe.baseServings || recipe.baseServings <= 0) {
    return { ...recipe, servings: newServings };
  }
  const scaleFactor = newServings / recipe.baseServings;

  return {
    ...recipe,
    servings: newServings,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      quantity: roundQuantity(ing.quantity * scaleFactor),
    })),
    nutrition: recipe.nutrition
      ? {
          calories: Math.round((recipe.nutrition.calories ?? 0) * scaleFactor),
          protein_g: Math.round((recipe.nutrition.protein_g ?? 0) * scaleFactor),
          carbs_g: Math.round((recipe.nutrition.carbs_g ?? 0) * scaleFactor),
          fat_g: Math.round((recipe.nutrition.fat_g ?? 0) * scaleFactor),
          fiber_g: Math.round((recipe.nutrition.fiber_g ?? 0) * scaleFactor),
        }
      : undefined,
  };
}

/**
 * Calculate total macros for a household based on recipe and members
 */
export function calculateMacrosForHousehold(
  recipe: Recipe,
  householdMembers: Person[]
): MacrosPerServing {
  const totalServings = householdMembers.length;
  const scaledRecipe = scaleRecipe(recipe, totalServings);

  return {
    calories: scaledRecipe.nutrition?.calories ?? 0,
    protein: scaledRecipe.nutrition?.protein_g ?? 0,
    carbs: scaledRecipe.nutrition?.carbs_g ?? 0,
    fat: scaledRecipe.nutrition?.fat_g ?? 0,
    fiber: scaledRecipe.nutrition?.fiber_g ?? 0,
  };
}

/**
 * Suggest servings based on person's calorie target
 */
export function suggestServingsForPerson(
  recipe: Recipe,
  person: Person,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): number {
  // Calorie distribution by meal type
  const mealCaloriePercentage: Record<string, number> = {
    breakfast: 0.25,
    lunch: 0.30,
    dinner: 0.35,
    snack: 0.10,
  };

  const targetCalories = person.dailyCalorieTarget * mealCaloriePercentage[mealType];
  const caloriesPerServing = recipe.macrosPerServing?.calories ??
    (recipe.nutrition?.calories ?? 400) / recipe.baseServings;

  const suggestedServings = Math.round(targetCalories / caloriesPerServing);
  return Math.max(1, Math.min(suggestedServings, 4)); // Clamp between 1-4
}

/**
 * Calculate BMI from height (cm) and weight (lbs)
 */
export function calculateBMI(heightCm: number, weightLbs: number): number {
  const heightM = heightCm / 100;
  const weightKg = weightLbs * 0.453592;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Calculate daily calorie target using Mifflin-St Jeor equation
 */
export function calculateDailyCalories(
  gender: 'male' | 'female',
  age: number,
  heightCm: number,
  weightLbs: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' = 'moderate'
): number {
  const weightKg = weightLbs * 0.453592;

  // Mifflin-St Jeor equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Round quantity to friendly cooking measurements
 */
function roundQuantity(quantity: number): number {
  // Round to nearest quarter for small quantities
  if (quantity <= 4) {
    return Math.round(quantity * 4) / 4;
  }
  // Round to nearest half for medium quantities
  if (quantity <= 10) {
    return Math.round(quantity * 2) / 2;
  }
  // Round to whole number for large quantities
  return Math.round(quantity);
}

/**
 * Convert between common cooking units
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  const conversions: Record<string, Record<string, number>> = {
    cup: { tbsp: 16, tsp: 48, ml: 237, oz: 8 },
    tbsp: { cup: 0.0625, tsp: 3, ml: 15, oz: 0.5 },
    tsp: { cup: 0.0208, tbsp: 0.333, ml: 5, oz: 0.167 },
    oz: { cup: 0.125, tbsp: 2, g: 28.35, lb: 0.0625 },
    lb: { oz: 16, g: 453.6, kg: 0.454 },
    g: { oz: 0.035, lb: 0.0022, kg: 0.001 },
    kg: { g: 1000, lb: 2.205, oz: 35.27 },
    ml: { cup: 0.0042, tbsp: 0.067, tsp: 0.2, l: 0.001 },
    l: { ml: 1000, cup: 4.227, oz: 33.8 },
  };

  if (fromUnit === toUnit) return quantity;

  const fromConversions = conversions[fromUnit.toLowerCase()];
  if (!fromConversions) return quantity;

  const conversionFactor = fromConversions[toUnit.toLowerCase()];
  if (!conversionFactor) return quantity;

  return roundQuantity(quantity * conversionFactor);
}

/**
 * Format an ingredient with scaled quantity
 */
export function formatIngredient(
  ingredient: RecipeIngredient,
  scaleFactor: number = 1
): string {
  const scaledQuantity = roundQuantity(ingredient.quantity * scaleFactor);
  const quantityStr = formatQuantity(scaledQuantity);
  const notes = ingredient.notes ? ` (${ingredient.notes})` : '';

  return `${quantityStr} ${ingredient.unit} ${ingredient.item}${notes}`;
}

/**
 * Format quantity as fraction or decimal
 */
export function formatQuantity(quantity: number): string {
  const fractions: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  };

  const whole = Math.floor(quantity);
  const decimal = quantity - whole;

  // Check for common fractions
  for (const [dec, frac] of Object.entries(fractions)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.05) {
      if (whole === 0) return frac;
      return `${whole} ${frac}`;
    }
  }

  // Return as decimal if no fraction match
  if (decimal === 0) return String(whole);
  return quantity.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Calculate protein per pound of bodyweight
 */
export function calculateProteinTarget(
  weightLbs: number,
  trainingFocus: 'powerlifting' | 'cardio' | 'mixed'
): number {
  // Protein recommendations in g per lb bodyweight
  const proteinMultiplier: Record<string, number> = {
    powerlifting: 1.0, // Higher for strength athletes
    cardio: 0.7,       // Moderate for cardio focus
    mixed: 0.85,       // Balanced
  };

  return Math.round(weightLbs * proteinMultiplier[trainingFocus]);
}

/**
 * Generate shopping list from recipes scaled for household
 */
export function generateShoppingList(
  recipes: Recipe[],
  householdSize: number
): RecipeIngredient[] {
  const ingredientMap = new Map<string, RecipeIngredient>();

  for (const recipe of recipes) {
    const scaleFactor = householdSize / recipe.baseServings;

    for (const ing of recipe.ingredients) {
      const key = `${ing.item.toLowerCase()}-${ing.unit.toLowerCase()}`;
      const existing = ingredientMap.get(key);

      if (existing) {
        existing.quantity += ing.quantity * scaleFactor;
      } else {
        ingredientMap.set(key, {
          ...ing,
          quantity: ing.quantity * scaleFactor,
        });
      }
    }
  }

  // Round quantities and sort alphabetically
  return Array.from(ingredientMap.values())
    .map((ing) => ({ ...ing, quantity: roundQuantity(ing.quantity) }))
    .sort((a, b) => a.item.localeCompare(b.item));
}
