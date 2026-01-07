'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { UtensilsCrossed, Plus, Check } from 'lucide-react';
import type { Meal } from '@/lib/types';
import { formatMacros } from '@/lib/utils';
import { addFoodEntry, addRecentFood } from '@/lib/food-log';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import { format } from 'date-fns';

export interface MealCardProps {
  meal: Meal;
  compact?: boolean;
  showLogButton?: boolean;
  onLogged?: () => void;
}

const mealTypeStyles = {
  breakfast: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Breakfast',
  },
  lunch: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Lunch',
  },
  dinner: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    label: 'Dinner',
  },
  snack: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-400',
    label: 'Snack',
  },
};

export function MealCard({ meal, compact = false, showLogButton = true, onLogged }: MealCardProps) {
  const currentPerson = useCurrentPerson();
  const [isLogging, setIsLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const mealStyle = mealTypeStyles[meal.meal_type];

  const handleLogMeal = async () => {
    if (!currentPerson || isLogging) return;

    setIsLogging(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Create food entry from meal
      addFoodEntry({
        personId: currentPerson.id,
        date: today,
        mealType: meal.meal_type,
        name: meal.name,
        calories: meal.calories || 0,
        protein: meal.protein_g || 0,
        carbs: meal.carbs_g || 0,
        fat: meal.fat_g || 0,
        fiber: meal.fiber_g || 0,
        servingSize: '1 serving',
      });

      // Add to recent foods for quick access later
      addRecentFood({
        name: meal.name,
        calories: meal.calories || 0,
        protein: meal.protein_g || 0,
        carbs: meal.carbs_g || 0,
        fat: meal.fat_g || 0,
        fiber: meal.fiber_g || 0,
        servingSize: '1 serving',
      }, currentPerson.id);

      setJustLogged(true);
      onLogged?.();

      // Reset after 2 seconds
      setTimeout(() => {
        setJustLogged(false);
      }, 2000);
    } catch {
      // Meal logging failed
    } finally {
      setIsLogging(false);
    }
  };

  const hasNutrition =
    meal.calories !== undefined ||
    meal.protein_g !== undefined ||
    meal.carbs_g !== undefined ||
    meal.fat_g !== undefined;

  const macrosDisplay =
    meal.protein_g !== undefined &&
    meal.carbs_g !== undefined &&
    meal.fat_g !== undefined
      ? formatMacros(meal.protein_g, meal.carbs_g, meal.fat_g)
      : null;

  // Compact mode - minimal display
  if (compact) {
    return (
      <div
        className={clsx(
          'flex items-center justify-between p-3 rounded-lg',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
          'hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow duration-200'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{meal.name}</span>
        </div>
        {meal.calories !== undefined && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {meal.calories} cal
          </span>
        )}
      </div>
    );
  }

  // Full mode - detailed display
  return (
    <div
      className={clsx(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm',
        'hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow duration-200'
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={clsx(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
            )}
          >
            <UtensilsCrossed className="w-5 h-5" />
          </div>

          {/* Title and type */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{meal.name}</h3>
              <span
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  mealStyle.bg,
                  mealStyle.text
                )}
              >
                {mealStyle.label}
              </span>
            </div>
            {meal.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{meal.description}</p>
            )}
          </div>
        </div>

        {/* Nutrition summary */}
        {hasNutrition && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="grid grid-cols-4 gap-2">
              {/* Calories */}
              {meal.calories !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{meal.calories}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Calories</p>
                </div>
              )}

              {/* Protein */}
              {meal.protein_g !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{meal.protein_g}g</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Protein</p>
                </div>
              )}

              {/* Carbs */}
              {meal.carbs_g !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{meal.carbs_g}g</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Carbs</p>
                </div>
              )}

              {/* Fat */}
              {meal.fat_g !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{meal.fat_g}g</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Fat</p>
                </div>
              )}
            </div>

            {/* Fiber if available */}
            {meal.fiber_g !== undefined && (
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-center">
                <span className="text-sm text-green-600 dark:text-green-400">
                  Fiber: <span className="font-medium">{meal.fiber_g}g</span>
                </span>
              </div>
            )}

            {/* Macros formatted string */}
            {macrosDisplay && (
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-center">
                <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                  {macrosDisplay}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Log This Meal Button */}
        {showLogButton && currentPerson && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogMeal}
              disabled={isLogging || justLogged}
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'font-medium text-sm transition-all duration-200',
                justLogged
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white',
                (isLogging || justLogged) && 'cursor-not-allowed'
              )}
            >
              {justLogged ? (
                <>
                  <Check className="w-4 h-4" />
                  Logged!
                </>
              ) : isLogging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Log This Meal
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
