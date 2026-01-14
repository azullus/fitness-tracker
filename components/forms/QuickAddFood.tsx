'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, ChevronDown, Check, BookOpen, Clock, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BarcodeScannerModal } from '@/components/scanner';
import { addFoodEntry, addRecentFood, getRecentFoods, type MealType, type FoodEntry, type RecentFood } from '@/lib/food-log';

interface QuickAddFoodProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (entry: FoodEntry) => void;
  defaultMealType?: MealType;
  defaultDate?: string;
  personId: string; // Required: person this food entry belongs to
}

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function QuickAddFood({
  isOpen,
  onClose,
  onSaved,
  defaultMealType = 'snack',
  defaultDate,
  personId,
}: QuickAddFoodProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [fiber, setFiber] = useState<string>('');
  const [servingSize, setServingSize] = useState<string>('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [showMealDropdown, setShowMealDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savedEntry, setSavedEntry] = useState<FoodEntry | null>(null);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const date = defaultDate || formatDateForInput(new Date());

  // Reset form when opened and load recent foods
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('');
      setServingSize('');
      setMealType(defaultMealType);
      setError(null);
      setShowSavePrompt(false);
      setSavedEntry(null);
      // Load recent foods from localStorage for this person
      setRecentFoods(getRecentFoods(personId));
    }
  }, [isOpen, defaultMealType, personId]);

  // Handle selecting a recent food to pre-fill the form
  const handleSelectRecentFood = useCallback((food: RecentFood) => {
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setFiber(food.fiber.toString());
    setServingSize(food.servingSize || '');
  }, []);

  // Handle scanned food from barcode scanner
  const handleScannedFood = useCallback((data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    servingSize: string;
  }) => {
    setName(data.name);
    setCalories(data.calories.toString());
    setProtein(data.protein.toString());
    setCarbs(data.carbs.toString());
    setFat(data.fat.toString());
    setFiber(data.fiber.toString());
    setServingSize(data.servingSize);
    setShowScanner(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validate required fields
      if (!name.trim()) {
        setError('Food name is required');
        return;
      }

      const caloriesNum = parseFloat(calories) || 0;
      const proteinNum = parseFloat(protein) || 0;
      const carbsNum = parseFloat(carbs) || 0;
      const fatNum = parseFloat(fat) || 0;
      const fiberNum = parseFloat(fiber) || 0;

      // Validate no negative values
      if (caloriesNum < 0) {
        setError('Calories cannot be negative');
        return;
      }
      if (proteinNum < 0 || carbsNum < 0 || fatNum < 0 || fiberNum < 0) {
        setError('Macro values cannot be negative');
        return;
      }

      setIsSubmitting(true);

      try {
        const entry = addFoodEntry({
          personId,
          date,
          mealType,
          name: name.trim(),
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fat: fatNum,
          fiber: fiberNum,
          servingSize: servingSize.trim() || undefined,
        });

        // Save to recent foods for quick access later (person-specific)
        addRecentFood({
          name: name.trim(),
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fat: fatNum,
          fiber: fiberNum,
          servingSize: servingSize.trim() || undefined,
        }, personId);

        setSavedEntry(entry);
        setShowSavePrompt(true);
        onSaved?.(entry);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to save food entry'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, calories, protein, carbs, fat, fiber, servingSize, mealType, date, personId, onSaved]
  );

  const handleSaveAsRecipe = useCallback(() => {
    // Store the nutrition data in sessionStorage for the recipe form
    if (savedEntry) {
      sessionStorage.setItem(
        'prefill-recipe',
        JSON.stringify({
          name: savedEntry.name,
          macrosPerServing: {
            calories: savedEntry.calories,
            protein: savedEntry.protein,
            carbs: savedEntry.carbs,
            fat: savedEntry.fat,
            fiber: savedEntry.fiber,
          },
          category: savedEntry.mealType,
        })
      );
      // Navigate to recipe creation
      window.location.href = '/recipes/new';
    }
  }, [savedEntry]);

  const handleDone = useCallback(() => {
    setShowSavePrompt(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Show save as recipe prompt
  if (showSavePrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          onClick={handleDone}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Food Logged!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Would you like to save &quot;{savedEntry?.name}&quot; as a recipe for future use?
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleSaveAsRecipe}
                variant="primary"
                className="w-full"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Save as Recipe
              </Button>
              <Button
                onClick={handleDone}
                variant="secondary"
                className="w-full"
              >
                No Thanks
              </Button>
            </div>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Add Food
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div
              className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Scan Barcode Button */}
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className={clsx(
              'w-full py-3 px-4 rounded-xl border-2 border-dashed',
              'border-gray-300 dark:border-gray-600',
              'hover:border-green-500 dark:hover:border-green-400',
              'hover:bg-green-50 dark:hover:bg-green-900/20',
              'flex items-center justify-center gap-2',
              'text-gray-600 dark:text-gray-400',
              'hover:text-green-600 dark:hover:text-green-400',
              'transition-colors'
            )}
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium">Scan Barcode</span>
          </button>

          {/* Recent Foods Section */}
          {recentFoods.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentFoods.map((food, index) => (
                  <button
                    key={`${food.name}-${index}`}
                    type="button"
                    onClick={() => handleSelectRecentFood(food)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                      'hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300',
                      'border border-gray-200 dark:border-gray-600',
                      'active:scale-95 transform'
                    )}
                    title={`${food.calories} cal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g`}
                  >
                    {food.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Food Name - Full Width */}
          <Input
            type="text"
            label="Food Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            required
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          {/* Meal Type Dropdown */}
          <div className="relative">
            <label id="meal-type-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
              aria-labelledby="meal-type-label"
              aria-haspopup="listbox"
              aria-expanded={showMealDropdown}
            >
              <span>{mealTypes.find((m) => m.value === mealType)?.label}</span>
              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
                  showMealDropdown && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
            {showMealDropdown && (
              <div
                className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
                role="listbox"
                aria-labelledby="meal-type-label"
              >
                {mealTypes.map((meal) => (
                  <button
                    key={meal.value}
                    type="button"
                    role="option"
                    aria-selected={mealType === meal.value}
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

          {/* Calories - Prominent */}
          <div>
            <label htmlFor="food-calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Calories
            </label>
            <input
              id="food-calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              aria-describedby="calories-hint"
              className={clsx(
                'w-full px-4 py-3 rounded-lg border text-2xl font-semibold text-center',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
              )}
            />
            <span id="calories-hint" className="sr-only">Enter the total calories for this food</span>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Macronutrients">
            <div>
              <label htmlFor="food-protein" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Protein (g)
              </label>
              <input
                id="food-protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border text-center',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
                )}
              />
            </div>
            <div>
              <label htmlFor="food-carbs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Carbs (g)
              </label>
              <input
                id="food-carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border text-center',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
                )}
              />
            </div>
            <div>
              <label htmlFor="food-fat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fat (g)
              </label>
              <input
                id="food-fat"
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border text-center',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
                )}
              />
            </div>
            <div>
              <label htmlFor="food-fiber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fiber (g)
              </label>
              <input
                id="food-fiber"
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border text-center',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
                )}
              />
            </div>
          </div>

          {/* Optional Serving Size */}
          <div>
            <label htmlFor="food-serving-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Serving Size{' '}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                (optional)
              </span>
            </label>
            <input
              id="food-serving-size"
              type="text"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              placeholder="e.g., 1 cup, 100g, 1 piece"
              className={clsx(
                'w-full px-3 py-2 rounded-lg border',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none'
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onFoodScanned={handleScannedFood}
      />
    </div>
  );
}

/**
 * Floating Action Button for Quick Add
 */
interface QuickAddFABProps {
  onClick: () => void;
}

export function QuickAddFAB({ onClick }: QuickAddFABProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed bottom-24 right-4 z-40',
        'w-14 h-14 rounded-full shadow-lg',
        'bg-green-600 dark:bg-green-700 text-white',
        'hover:bg-green-700 dark:hover:bg-green-600 transition-colors',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
      )}
      aria-label="Quick add food"
    >
      <Plus className="w-7 h-7" />
    </button>
  );
}

export default QuickAddFood;
