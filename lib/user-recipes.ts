import type { Recipe } from './types';

const USER_RECIPES_KEY = 'fitness-tracker-user-recipes';

/**
 * Generate a unique ID for user-created recipes
 */
function generateRecipeId(): string {
  return `user-recipe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all user-created recipes from localStorage
 */
export function getUserRecipes(): Recipe[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(USER_RECIPES_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as Recipe[];
  } catch {
    return [];
  }
}

/**
 * Save a new user recipe to localStorage
 */
export function saveUserRecipe(
  recipe: Omit<Recipe, 'id' | 'created_at'>
): Recipe {
  const recipes = getUserRecipes();

  const newRecipe: Recipe = {
    ...recipe,
    id: generateRecipeId(),
    created_at: new Date().toISOString(),
  };

  recipes.push(newRecipe);

  try {
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(recipes));
  } catch {
    throw new Error('Failed to save recipe');
  }

  return newRecipe;
}

/**
 * Update an existing user recipe in localStorage
 */
export function updateUserRecipe(
  id: string,
  updates: Partial<Omit<Recipe, 'id' | 'created_at'>>
): Recipe | null {
  const recipes = getUserRecipes();
  const index = recipes.findIndex((r) => r.id === id);

  if (index === -1) {
    return null;
  }

  const updatedRecipe: Recipe = {
    ...recipes[index],
    ...updates,
  };

  recipes[index] = updatedRecipe;

  try {
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(recipes));
  } catch {
    throw new Error('Failed to update recipe');
  }

  return updatedRecipe;
}

/**
 * Delete a user recipe from localStorage
 */
export function deleteUserRecipe(id: string): boolean {
  const recipes = getUserRecipes();
  const index = recipes.findIndex((r) => r.id === id);

  if (index === -1) {
    return false;
  }

  recipes.splice(index, 1);

  try {
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(recipes));
  } catch {
    throw new Error('Failed to delete recipe');
  }

  return true;
}

/**
 * Get a single user recipe by ID
 */
export function getUserRecipeById(id: string): Recipe | null {
  const recipes = getUserRecipes();
  return recipes.find((r) => r.id === id) || null;
}

/**
 * Check if a recipe is a user-created recipe
 */
export function isUserRecipe(id: string): boolean {
  return id.startsWith('user-recipe-');
}
