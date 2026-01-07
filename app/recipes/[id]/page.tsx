'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Users, ChefHat, Flame, Minus, Plus, Check, UtensilsCrossed, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { LogRecipeMeal } from '@/components/forms';
import { getRecipeById, fetchRecipeById } from '@/lib/recipes';
import { getUserRecipeById, isUserRecipe } from '@/lib/user-recipes';
import { formatQuantity } from '@/lib/recipe-utils';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import type { Recipe, RecipeIngredient } from '@/lib/types';

const categoryColors: Record<Recipe['category'], { bg: string; text: string; darkBg: string; darkText: string }> = {
  breakfast: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  lunch: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  dinner: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
  snack: { bg: 'bg-pink-100', text: 'text-pink-700', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400' },
};

const categoryLabels: Record<Recipe['category'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const currentPerson = useCurrentPerson();

  // State for user recipe (loaded from localStorage)
  const [userRecipe, setUserRecipe] = useState<Recipe | null>(null);
  // State for lazy-loaded recipe (from JSON)
  const [lazyLoadedRecipe, setLazyLoadedRecipe] = useState<Recipe | null>(null);
  // Track loading states
  const [isLoadingUserRecipe, setIsLoadingUserRecipe] = useState(isUserRecipe(recipeId));
  const [isLoadingLazyRecipe, setIsLoadingLazyRecipe] = useState(false);

  // State for log meal modal
  const [showLogMeal, setShowLogMeal] = useState(false);

  // Servings state for scaling - initialized with a default, updated when recipe loads
  const [currentServings, setCurrentServings] = useState(1);
  const [servingsInitialized, setServingsInitialized] = useState(false);

  // Checked ingredients state
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );

  // Load user recipe from localStorage on mount (only for user-created recipes)
  useEffect(() => {
    if (isUserRecipe(recipeId)) {
      const recipe = getUserRecipeById(recipeId);
      setUserRecipe(recipe);
      setIsLoadingUserRecipe(false);
    }
  }, [recipeId]);

  // Find the recipe by ID - check bundled recipes first, then lazy load if not found
  const bundledRecipe = useMemo(() => {
    if (isUserRecipe(recipeId)) {
      return userRecipe;
    }
    return getRecipeById(recipeId);
  }, [recipeId, userRecipe]);

  // Lazy load recipe if not found in bundle
  useEffect(() => {
    const loadRecipe = async () => {
      // Don't load if it's a user recipe or if we found it in the bundle
      if (isUserRecipe(recipeId) || bundledRecipe || lazyLoadedRecipe) {
        return;
      }

      setIsLoadingLazyRecipe(true);
      try {
        const recipe = await fetchRecipeById(recipeId);
        setLazyLoadedRecipe(recipe || null);
      } catch {
        // Failed to lazy load recipe
      } finally {
        setIsLoadingLazyRecipe(false);
      }
    };

    loadRecipe();
  }, [recipeId, bundledRecipe, lazyLoadedRecipe]);

  // Final recipe (bundled or lazy loaded)
  const recipe = bundledRecipe || lazyLoadedRecipe;

  // Update servings when recipe loads (only once)
  useEffect(() => {
    if (recipe && !servingsInitialized) {
      setCurrentServings(recipe.servings);
      setServingsInitialized(true);
    }
  }, [recipe, servingsInitialized]);

  // Show loading state for user recipes or lazy-loaded recipes
  if (isLoadingUserRecipe || isLoadingLazyRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-500 dark:text-gray-400">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <ChefHat className="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Recipe not found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          The recipe you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button onClick={() => router.push('/recipes')}>
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Recipes
        </Button>
      </div>
    );
  }

  // Guard against division by zero
  const originalServings = recipe.servings > 0 ? recipe.servings : 1;
  const scaleFactor = currentServings / originalServings;
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const categoryStyle = categoryColors[recipe.category];

  const handleServingsChange = (delta: number) => {
    const newServings = currentServings + delta;
    if (newServings >= 1 && newServings <= 20) {
      setCurrentServings(newServings);
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const scaleIngredient = (ingredient: RecipeIngredient): string => {
    const scaledQuantity = ingredient.quantity * scaleFactor;
    return `${formatQuantity(scaledQuantity)} ${ingredient.unit}`;
  };

  const scaleNutrition = (value: number | undefined): number => {
    if (value === undefined) return 0;
    // Nutrition is per recipe, so divide by original servings (already guarded above)
    return Math.round(value / originalServings);
  };

  const handleLogMeal = () => {
    if (!currentPerson) {
      alert('Please select a person to log meals for.');
      return;
    }
    setShowLogMeal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/recipes')}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to recipes"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
            {recipe.name}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Recipe Header */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {recipe.name}
          </h2>
          {recipe.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{recipe.description}</p>
          )}

          {/* Category and Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.darkBg,
                categoryStyle.darkText
              )}
            >
              {categoryLabels[recipe.category]}
            </span>
            {recipe.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Time Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {recipe.prep_time_minutes !== undefined &&
              recipe.prep_time_minutes > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  <span>Prep: {recipe.prep_time_minutes} min</span>
                </div>
              )}
            {recipe.cook_time_minutes !== undefined &&
              recipe.cook_time_minutes > 0 && (
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  <span>Cook: {recipe.cook_time_minutes} min</span>
                </div>
              )}
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                <span>Total: {totalTime} min</span>
              </div>
            )}
          </div>
        </section>

        {/* Servings Control */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span className="font-medium text-gray-900 dark:text-white">Servings</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleServingsChange(-1)}
                disabled={currentServings <= 1}
                className={clsx(
                  'flex items-center justify-center h-8 w-8 rounded-full',
                  'border border-gray-300 dark:border-gray-600 transition-colors',
                  currentServings <= 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                aria-label="Decrease servings"
              >
                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
                {currentServings}
              </span>
              <button
                onClick={() => handleServingsChange(1)}
                disabled={currentServings >= 20}
                className={clsx(
                  'flex items-center justify-center h-8 w-8 rounded-full',
                  'border border-gray-300 dark:border-gray-600 transition-colors',
                  currentServings >= 20
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                aria-label="Increase servings"
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          {currentServings !== originalServings && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Original recipe: {originalServings} serving
              {originalServings !== 1 ? 's' : ''}
            </p>
          )}
        </section>

        {/* Nutrition Facts - support both nutrition and macrosPerServing fields */}
        {(recipe.nutrition || recipe.macrosPerServing) && (
          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Nutrition Facts{' '}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (per serving)
              </span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              <NutritionItem
                label="Calories"
                value={recipe.macrosPerServing?.calories ?? scaleNutrition(recipe.nutrition?.calories)}
                unit=""
                highlight
              />
              <NutritionItem
                label="Protein"
                value={recipe.macrosPerServing?.protein ?? scaleNutrition(recipe.nutrition?.protein_g)}
                unit="g"
              />
              <NutritionItem
                label="Carbs"
                value={recipe.macrosPerServing?.carbs ?? scaleNutrition(recipe.nutrition?.carbs_g)}
                unit="g"
              />
              <NutritionItem
                label="Fat"
                value={recipe.macrosPerServing?.fat ?? scaleNutrition(recipe.nutrition?.fat_g)}
                unit="g"
              />
              <NutritionItem
                label="Fiber"
                value={recipe.macrosPerServing?.fiber ?? scaleNutrition(recipe.nutrition?.fiber_g)}
                unit="g"
              />
            </div>
          </section>
        )}

        {/* Ingredients */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Ingredients
            {currentServings !== originalServings && (
              <span className="text-sm font-normal text-blue-600 dark:text-blue-400 ml-2">
                (scaled for {currentServings})
              </span>
            )}
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>
                <button
                  onClick={() => toggleIngredient(index)}
                  className={clsx(
                    'flex items-start gap-3 w-full text-left p-2 -m-2 rounded-lg',
                    'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                  )}
                >
                  <div
                    className={clsx(
                      'flex items-center justify-center h-5 w-5 rounded border mt-0.5 flex-shrink-0',
                      checkedIngredients.has(index)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {checkedIngredients.has(index) && (
                      <Check className="h-3 w-3 text-white" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-gray-700 dark:text-gray-300',
                      checkedIngredients.has(index) && 'line-through text-gray-400 dark:text-gray-500'
                    )}
                  >
                    <span className="font-medium">
                      {scaleIngredient(ingredient)}
                    </span>{' '}
                    {ingredient.item}
                    {ingredient.notes && (
                      <span className="text-gray-400 dark:text-gray-500"> ({ingredient.notes})</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-300 pt-0.5">{instruction}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Notes (if present - not in current demo data but supporting it) */}
        {/* The Recipe type doesn't have a notes field, but we can add support if needed */}

        {/* Log This Meal Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleLogMeal}
          >
            <UtensilsCrossed className="h-5 w-5 mr-2" aria-hidden="true" />
            Log This Meal
          </Button>
        </div>
      </main>

      {/* Log Meal Modal */}
      {currentPerson && recipe && (
        <LogRecipeMeal
          isOpen={showLogMeal}
          onClose={() => setShowLogMeal(false)}
          recipe={recipe}
          personId={currentPerson.id}
        />
      )}
    </div>
  );
}

// Helper component for nutrition display
interface NutritionItemProps {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}

function NutritionItem({ label, value, unit, highlight }: NutritionItemProps) {
  return (
    <div className="text-center">
      <div
        className={clsx(
          'text-lg font-semibold',
          highlight ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
        )}
      >
        {value}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
