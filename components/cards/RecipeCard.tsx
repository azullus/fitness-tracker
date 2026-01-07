'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { ChefHat, Clock, Users, Flame, Dumbbell, Minus, Plus, Scale, UtensilsCrossed } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { scaleRecipe } from '@/lib/recipe-utils';
import { LogRecipeMeal } from '@/components/forms/LogRecipeMeal';
import { useCurrentPerson } from '@/components/providers/PersonProvider';

export interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  showScaling?: boolean;
  householdSize?: number;
  showLogButton?: boolean;
}

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

const difficultyColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  easy: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
};

export function RecipeCard({ recipe, onClick, showScaling = false, householdSize = 2, showLogButton = false }: RecipeCardProps) {
  const currentPerson = useCurrentPerson();
  const [servings, setServings] = useState(householdSize);
  const [showLogMeal, setShowLogMeal] = useState(false);
  const scaledRecipe = showScaling ? scaleRecipe(recipe, servings) : recipe;

  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const categoryStyle = categoryColors[recipe.category];
  const isScaled = servings !== recipe.baseServings;

  const adjustServings = (delta: number) => {
    const newServings = Math.max(1, Math.min(8, servings + delta));
    setServings(newServings);
  };

  // Calculate per-serving macros (guard against division by zero)
  const servingsDivisor = scaledRecipe.servings > 0 ? scaledRecipe.servings : 1;
  const macros = scaledRecipe.macrosPerServing || (scaledRecipe.nutrition ? {
    calories: Math.round((scaledRecipe.nutrition.calories ?? 0) / servingsDivisor),
    protein: Math.round((scaledRecipe.nutrition.protein_g ?? 0) / servingsDivisor),
    carbs: Math.round((scaledRecipe.nutrition.carbs_g ?? 0) / servingsDivisor),
    fat: Math.round((scaledRecipe.nutrition.fat_g ?? 0) / servingsDivisor),
    fiber: Math.round((scaledRecipe.nutrition.fiber_g ?? 0) / servingsDivisor),
  } : null);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-all',
        'hover:shadow-md dark:hover:shadow-gray-900/30',
        onClick && 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <ChefHat className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{recipe.name}</h3>
          {recipe.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>
      </div>

      {/* Category and difficulty badges */}
      <div className="mt-3 flex gap-2">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            categoryStyle.bg,
            categoryStyle.text,
            categoryStyle.darkBg,
            categoryStyle.darkText
          )}
        >
          {categoryLabels[recipe.category]}
        </span>
        {recipe.difficulty && (
          <span
            className={clsx(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              difficultyColors[recipe.difficulty].bg,
              difficultyColors[recipe.difficulty].text,
              difficultyColors[recipe.difficulty].darkBg,
              difficultyColors[recipe.difficulty].darkText
            )}
          >
            {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
          </span>
        )}
        {isScaled && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
            <Scale className="h-3 w-3" />
            Scaled
          </span>
        )}
      </div>

      {/* Time and servings info */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        {totalTime > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <span>
              {totalTime} min
              {recipe.prep_time_minutes && recipe.cook_time_minutes && (
                <span className="text-gray-400 dark:text-gray-500">
                  {' '}
                  ({recipe.prep_time_minutes} + {recipe.cook_time_minutes})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Servings with optional scaling controls */}
        {showScaling ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <button
              onClick={(e) => { e.stopPropagation(); adjustServings(-1); }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={servings <= 1}
              aria-label="Decrease servings"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[3rem] text-center font-medium text-gray-900 dark:text-white">
              {servings} serving{servings !== 1 ? 's' : ''}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); adjustServings(1); }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={servings >= 8}
              aria-label="Increase servings"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <span>
              {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Ingredient count */}
      <div className="mt-3">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}
        >
          {scaledRecipe.ingredients.length} ingredient
          {scaledRecipe.ingredients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Nutrition summary - per serving */}
      {macros && (macros.calories || macros.protein) && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {macros.calories !== undefined && macros.calories > 0 && (
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{macros.calories} cal</span>
              <span className="text-gray-400 dark:text-gray-500">/serving</span>
            </div>
          )}
          {macros.protein !== undefined && macros.protein > 0 && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{macros.protein}g protein</span>
            </div>
          )}
        </div>
      )}

      {/* Full macro breakdown when scaled */}
      {showScaling && macros && isScaled && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium text-gray-900 dark:text-white">{macros.carbs}g</div>
            <div className="text-gray-500 dark:text-gray-400">Carbs</div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium text-gray-900 dark:text-white">{macros.fat}g</div>
            <div className="text-gray-500 dark:text-gray-400">Fat</div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium text-gray-900 dark:text-white">{macros.fiber}g</div>
            <div className="text-gray-500 dark:text-gray-400">Fiber</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded">
            <div className="font-medium text-orange-700 dark:text-orange-400">{macros.calories * servings}</div>
            <div className="text-orange-600 dark:text-orange-500">Total cal</div>
          </div>
        </div>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Log Meal Button */}
      {showLogButton && currentPerson && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogMeal(true);
            }}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
              'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
              'hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors',
              'text-sm font-medium'
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Log This Meal
          </button>
        </div>
      )}

      {/* Log Meal Modal */}
      {showLogButton && currentPerson && (
        <LogRecipeMeal
          isOpen={showLogMeal}
          onClose={() => setShowLogMeal(false)}
          recipe={scaledRecipe}
          personId={currentPerson.id}
        />
      )}
    </div>
  );
}
