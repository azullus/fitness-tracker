'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, ChefHat, Check, ChevronDown, Calendar, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { addFoodEntry, addRecentFood, type MealType, type FoodEntry } from '@/lib/food-log';
import type { Recipe } from '@/lib/types';

interface LogRecipeMealProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (entry: FoodEntry) => void;
  recipe: Recipe;
  personId: string;
  defaultDate?: string;
}

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

// Map recipe category to meal type
function categoryToMealType(category: Recipe['category']): MealType {
  switch (category) {
    case 'breakfast':
      return 'breakfast';
    case 'lunch':
      return 'lunch';
    case 'dinner':
      return 'dinner';
    case 'snack':
      return 'snack';
    default:
      return 'snack';
  }
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function LogRecipeMeal({
  isOpen,
  onClose,
  onSaved,
  recipe,
  personId,
  defaultDate,
}: LogRecipeMealProps) {
  // Determine meal type from recipe category
  const suggestedMealType = categoryToMealType(recipe.category);

  const [mealType, setMealType] = useState<MealType>(suggestedMealType);
  const [showMealDropdown, setShowMealDropdown] = useState(false);
  const [servings, setServings] = useState(1);
  const [date, setDate] = useState(defaultDate || formatDateForInput(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setMealType(suggestedMealType);
      setServings(1);
      setDate(defaultDate || formatDateForInput(new Date()));
      setError(null);
      setShowSuccess(false);
    }
  }, [isOpen, suggestedMealType, defaultDate]);

  // Calculate macros from recipe (per serving)
  const getMacros = useCallback(() => {
    // Use macrosPerServing if available (already per-serving)
    if (recipe.macrosPerServing) {
      return {
        calories: Math.round(recipe.macrosPerServing.calories * servings),
        protein: Math.round(recipe.macrosPerServing.protein * servings),
        carbs: Math.round(recipe.macrosPerServing.carbs * servings),
        fat: Math.round(recipe.macrosPerServing.fat * servings),
        fiber: Math.round(recipe.macrosPerServing.fiber * servings),
      };
    }

    // Fall back to nutrition field (per entire recipe, need to divide by servings)
    if (recipe.nutrition) {
      const baseServings = recipe.servings || 1;
      return {
        calories: Math.round(((recipe.nutrition.calories || 0) / baseServings) * servings),
        protein: Math.round(((recipe.nutrition.protein_g || 0) / baseServings) * servings),
        carbs: Math.round(((recipe.nutrition.carbs_g || 0) / baseServings) * servings),
        fat: Math.round(((recipe.nutrition.fat_g || 0) / baseServings) * servings),
        fiber: Math.round(((recipe.nutrition.fiber_g || 0) / baseServings) * servings),
      };
    }

    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }, [recipe, servings]);

  const macros = getMacros();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        const entry = addFoodEntry({
          personId,
          date,
          mealType,
          name: recipe.name,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          fiber: macros.fiber,
          servingSize: servings === 1 ? '1 serving' : `${servings} servings`,
        });

        // Save to recent foods for quick access later
        addRecentFood({
          name: recipe.name,
          calories: macros.calories / servings, // Store per-serving values
          protein: macros.protein / servings,
          carbs: macros.carbs / servings,
          fat: macros.fat / servings,
          fiber: macros.fiber / servings,
          servingSize: '1 serving',
        }, personId);

        setShowSuccess(true);
        onSaved?.(entry);

        // Auto-close after showing success
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to log meal'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [recipe.name, macros, mealType, date, servings, personId, onSaved, onClose]
  );

  const adjustServings = (delta: number) => {
    setServings((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  if (!isOpen) return null;

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          onClick={onClose}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Meal Logged!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {recipe.name} has been added to your food log.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Log Meal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div
              className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Recipe Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Date
              </div>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
              )}
            />
          </div>

          {/* Meal Type Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Meal Type
            </label>
            <button
              type="button"
              onClick={() => setShowMealDropdown(!showMealDropdown)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'hover:border-gray-400 dark:hover:border-gray-500 transition-colors'
              )}
            >
              <span>{mealTypes.find((m) => m.value === mealType)?.label}</span>
              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
                  showMealDropdown && 'rotate-180'
                )}
              />
            </button>
            {showMealDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                {mealTypes.map((meal) => (
                  <button
                    key={meal.value}
                    type="button"
                    onClick={() => {
                      setMealType(meal.value);
                      setShowMealDropdown(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors',
                      mealType === meal.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {meal.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Servings Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Number of Servings
              </div>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustServings(-1)}
                disabled={servings <= 1}
                className={clsx(
                  'flex items-center justify-center h-10 w-10 rounded-full',
                  'border border-gray-300 dark:border-gray-600 transition-colors',
                  servings <= 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                aria-label="Decrease servings"
              >
                <span className="text-xl text-gray-600 dark:text-gray-300">-</span>
              </button>
              <span className="text-2xl font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => adjustServings(1)}
                disabled={servings >= 10}
                className={clsx(
                  'flex items-center justify-center h-10 w-10 rounded-full',
                  'border border-gray-300 dark:border-gray-600 transition-colors',
                  servings >= 10
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                aria-label="Increase servings"
              >
                <span className="text-xl text-gray-600 dark:text-gray-300">+</span>
              </button>
            </div>
          </div>

          {/* Nutrition Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Nutrition ({servings} serving{servings !== 1 ? 's' : ''})
            </h4>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {macros.calories}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {macros.protein}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Protein</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {macros.carbs}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {macros.fat}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Fat</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {macros.fiber}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Fiber</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full py-3"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Log Meal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogRecipeMeal;
