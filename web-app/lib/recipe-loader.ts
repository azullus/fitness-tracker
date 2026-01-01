// Lazy-loading utility for recipes
// Fetches recipe data on demand from JSON files to reduce initial bundle size

import type { Recipe } from './types';

// Recipe category types
export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Recipe index entry for quick lookups without loading full data
export interface RecipeIndexEntry {
  id: string;
  name: string;
  category: RecipeCategory;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  totalTime: number;
  proteinPerServing: number;
}

// Cache for loaded recipes
const recipeCache: Map<RecipeCategory, Recipe[]> = new Map();
let recipeIndex: RecipeIndexEntry[] | null = null;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the base URL for fetching recipe data
 */
function getBaseUrl(): string {
  if (!isBrowser) {
    // Server-side: we can't fetch from the public folder directly
    // Return empty string to signal that we should use fallback data
    return '';
  }
  return '';
}

/**
 * Fetch the recipe index (lightweight metadata for all recipes)
 */
export async function fetchRecipeIndex(): Promise<RecipeIndexEntry[]> {
  if (recipeIndex) {
    return recipeIndex;
  }

  if (!isBrowser) {
    return [];
  }

  try {
    const response = await fetch(`${getBaseUrl()}/data/recipes/index.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipe index: ${response.status}`);
    }
    recipeIndex = await response.json();
    return recipeIndex!;
  } catch {
    return [];
  }
}

/**
 * Fetch recipes for a specific category
 */
export async function fetchRecipesByCategory(category: RecipeCategory): Promise<Recipe[]> {
  // Check cache first
  const cached = recipeCache.get(category);
  if (cached) {
    return cached;
  }

  if (!isBrowser) {
    return [];
  }

  try {
    const response = await fetch(`${getBaseUrl()}/data/recipes/${category}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${category} recipes: ${response.status}`);
    }
    const recipes: Recipe[] = await response.json();
    recipeCache.set(category, recipes);
    return recipes;
  } catch {
    return [];
  }
}

/**
 * Fetch all recipes (loads all categories)
 */
export async function fetchAllRecipes(): Promise<Recipe[]> {
  const categories: RecipeCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const results = await Promise.all(categories.map(fetchRecipesByCategory));
  return results.flat();
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipeById(id: string): Promise<Recipe | undefined> {
  // First, try to determine the category from the ID
  const categoryMatch = id.match(/^(breakfast|lunch|dinner|snack)-/);
  if (categoryMatch) {
    const category = categoryMatch[1] as RecipeCategory;
    const recipes = await fetchRecipesByCategory(category);
    return recipes.find((r) => r.id === id);
  }

  // Otherwise, search all categories
  const allRecipes = await fetchAllRecipes();
  return allRecipes.find((r) => r.id === id);
}

/**
 * Fetch recipes matching a tag
 */
export async function fetchRecipesByTag(tag: string): Promise<Recipe[]> {
  const allRecipes = await fetchAllRecipes();
  return allRecipes.filter((r) => r.tags?.includes(tag));
}

/**
 * Fetch recipes by difficulty
 */
export async function fetchRecipesByDifficulty(
  difficulty: Recipe['difficulty']
): Promise<Recipe[]> {
  const allRecipes = await fetchAllRecipes();
  return allRecipes.filter((r) => r.difficulty === difficulty);
}

/**
 * Fetch quick recipes (under specified minutes)
 */
export async function fetchQuickRecipes(maxMinutes: number = 30): Promise<Recipe[]> {
  const allRecipes = await fetchAllRecipes();
  return allRecipes.filter((r) => {
    const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
    return totalTime <= maxMinutes;
  });
}

/**
 * Fetch high-protein recipes
 */
export async function fetchHighProteinRecipes(
  minProteinPerServing: number = 25
): Promise<Recipe[]> {
  const allRecipes = await fetchAllRecipes();
  return allRecipes.filter((r) => {
    const proteinPerServing = r.macrosPerServing?.protein || 0;
    return proteinPerServing >= minProteinPerServing;
  });
}

/**
 * Search recipes by query (name, description, tags, ingredients)
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const allRecipes = await fetchAllRecipes();
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter((r) => {
    return (
      r.name.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery) ||
      r.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      r.ingredients.some((ing) => ing.item.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Clear the recipe cache (useful for testing or forcing refresh)
 */
export function clearRecipeCache(): void {
  recipeCache.clear();
  recipeIndex = null;
}

/**
 * Preload specific categories into cache
 */
export async function preloadCategories(categories: RecipeCategory[]): Promise<void> {
  await Promise.all(categories.map(fetchRecipesByCategory));
}

/**
 * Get recipe statistics from the index (lightweight)
 */
export async function getRecipeStats(): Promise<{
  total: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
}> {
  const index = await fetchRecipeIndex();
  return {
    total: index.length,
    breakfast: index.filter((r) => r.category === 'breakfast').length,
    lunch: index.filter((r) => r.category === 'lunch').length,
    dinner: index.filter((r) => r.category === 'dinner').length,
    snack: index.filter((r) => r.category === 'snack').length,
  };
}
