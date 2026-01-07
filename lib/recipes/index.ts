// Recipe data exports - Optimized for lazy loading
// Minimal recipes are bundled for initial render
// Full recipe data is fetched on demand from public/data/recipes/*.json

import type { Recipe } from '../types';

// Import minimal recipes for initial bundle (only ~4KB vs ~531KB)
import {
  INITIAL_RECIPES,
  INITIAL_BREAKFAST_RECIPES,
  INITIAL_LUNCH_RECIPES,
  INITIAL_DINNER_RECIPES,
  INITIAL_SNACK_RECIPES,
  INITIAL_RECIPE_COUNTS,
} from '../recipes-minimal';

// Re-export lazy loading utilities
export {
  fetchRecipesByCategory,
  fetchAllRecipes,
  fetchRecipeById,
  fetchRecipesByTag,
  fetchRecipesByDifficulty,
  fetchQuickRecipes,
  fetchHighProteinRecipes,
  searchRecipes as searchRecipesAsync,
  fetchRecipeIndex,
  clearRecipeCache,
  preloadCategories,
  getRecipeStats as getRecipeStatsAsync,
  type RecipeCategory,
  type RecipeIndexEntry,
} from '../recipe-loader';

// Export minimal recipes for initial render (synchronous access)
export const ALL_RECIPES = INITIAL_RECIPES;
export const BREAKFAST_RECIPES = INITIAL_BREAKFAST_RECIPES;
export const LUNCH_RECIPES = INITIAL_LUNCH_RECIPES;
export const DINNER_RECIPES = INITIAL_DINNER_RECIPES;
export const SNACK_RECIPES = INITIAL_SNACK_RECIPES;

// Synchronous helper functions for initial recipes
// Note: These only search the minimal bundled recipes
// For full search, use the async versions (e.g., searchRecipesAsync)

export const getRecipeById = (id: string): Recipe | undefined => {
  return INITIAL_RECIPES.find((r) => r.id === id);
};

export const getRecipesByCategory = (category: Recipe['category']): Recipe[] => {
  return INITIAL_RECIPES.filter((r) => r.category === category);
};

export const getRecipesByTag = (tag: string): Recipe[] => {
  return INITIAL_RECIPES.filter((r) => r.tags?.includes(tag));
};

export const getRecipesByDifficulty = (difficulty: Recipe['difficulty']): Recipe[] => {
  return INITIAL_RECIPES.filter((r) => r.difficulty === difficulty);
};

export const getQuickRecipes = (maxMinutes: number = 30): Recipe[] => {
  return INITIAL_RECIPES.filter((r) => {
    const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
    return totalTime <= maxMinutes;
  });
};

export const getHighProteinRecipes = (minProteinPerServing: number = 25): Recipe[] => {
  return INITIAL_RECIPES.filter((r) => {
    const proteinPerServing = r.macrosPerServing?.protein || 0;
    return proteinPerServing >= minProteinPerServing;
  });
};

export const searchRecipes = (query: string): Recipe[] => {
  const lowerQuery = query.toLowerCase();
  return INITIAL_RECIPES.filter((r) => {
    return (
      r.name.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery) ||
      r.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      r.ingredients.some((ing) => ing.item.toLowerCase().includes(lowerQuery))
    );
  });
};

// Recipe statistics (for initial display)
// Note: Shows bundled counts; use getRecipeStatsAsync for full counts
export const getRecipeStats = () => INITIAL_RECIPE_COUNTS;

// Total recipe counts (actual totals from JSON files)
// These can be displayed to users even before loading full data
export const FULL_RECIPE_COUNTS = {
  total: 300,
  breakfast: 75,
  lunch: 75,
  dinner: 75,
  snack: 75,
};
