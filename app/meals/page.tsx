'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, UtensilsCrossed, BookOpen, CheckCircle2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import Header from '@/components/navigation/Header';
import { MealCard } from '@/components/cards';
import { getMealsByDate, getMealsByPersonAndDate } from '@/lib/demo-data';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import { getNutritionTargets, addFoodEntry, addRecentFood } from '@/lib/food-log';
import type { Meal } from '@/lib/types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export default function MealsPage() {
  const currentPerson = useCurrentPerson();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoggingAll, setIsLoggingAll] = useState(false);
  const [allLogged, setAllLogged] = useState(false);

  const dateString = format(currentDate, 'yyyy-MM-dd');
  const displayDate = format(currentDate, 'EEEE, MMMM d, yyyy');

  // Get meals for the current date filtered by person
  const meals = useMemo(() => {
    if (currentPerson) {
      return getMealsByPersonAndDate(currentPerson.id, dateString);
    }
    return getMealsByDate(dateString);
  }, [dateString, currentPerson]);

  // Group meals by type
  const mealsByType = useMemo(() => {
    const grouped: Record<MealType, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    meals.forEach((meal) => {
      grouped[meal.meal_type].push(meal);
    });

    return grouped;
  }, [meals]);

  // Calculate nutrition totals
  const nutritionTotals = useMemo((): NutritionTotals => {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + (meal.calories || 0),
        protein: totals.protein + (meal.protein_g || 0),
        carbs: totals.carbs + (meal.carbs_g || 0),
        fat: totals.fat + (meal.fat_g || 0),
        fiber: totals.fiber + (meal.fiber_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [meals]);

  // Navigation handlers
  const goToPreviousDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
    setAllLogged(false);
  };
  const goToNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
    setAllLogged(false);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setAllLogged(false);
  };

  // Log all meals for the day
  const handleLogAllMeals = async () => {
    if (!currentPerson || isLoggingAll || meals.length === 0) return;

    setIsLoggingAll(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      for (const meal of meals) {
        // Create food entry from each meal
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

        // Add to recent foods
        addRecentFood({
          name: meal.name,
          calories: meal.calories || 0,
          protein: meal.protein_g || 0,
          carbs: meal.carbs_g || 0,
          fat: meal.fat_g || 0,
          fiber: meal.fiber_g || 0,
          servingSize: '1 serving',
        }, currentPerson.id);
      }

      setAllLogged(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setAllLogged(false);
      }, 3000);
    } catch {
      // Error already handled by individual meal logging
    } finally {
      setIsLoggingAll(false);
    }
  };

  // Check if we have any meals
  const hasMeals = meals.length > 0;

  // Get targets from person's settings or use defaults
  const targets = useMemo(() => {
    const baseTargets = getNutritionTargets();
    // Override with person's calorie target if available
    if (currentPerson?.dailyCalorieTarget) {
      baseTargets.calories = currentPerson.dailyCalorieTarget;
    }
    return baseTargets;
  }, [currentPerson]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Meals" showPersonToggle={true} />

      {/* Date Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Previous Day Button */}
          <button
            onClick={goToPreviousDay}
            className={clsx(
              'p-2 rounded-lg',
              'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            )}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Current Date Display */}
          <div className="flex flex-col items-center">
            <span className="font-semibold text-gray-900 dark:text-white">{displayDate}</span>
            {!isToday(currentDate) && (
              <button
                onClick={goToToday}
                className={clsx(
                  'mt-1 px-3 py-1 text-xs font-medium rounded-full',
                  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
                  'hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors'
                )}
              >
                Today
              </button>
            )}
          </div>

          {/* Next Day Button */}
          <button
            onClick={goToNextDay}
            className={clsx(
              'p-2 rounded-lg',
              'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            )}
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Log All Meals Button */}
      {hasMeals && isToday(currentDate) && currentPerson && (
        <div className="px-4 pt-4">
          <button
            onClick={handleLogAllMeals}
            disabled={isLoggingAll || allLogged}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
              'font-semibold text-sm transition-all duration-200',
              allLogged
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-700'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25',
              (isLoggingAll || allLogged) && 'cursor-not-allowed'
            )}
          >
            {allLogged ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                All {meals.length} Meals Logged to Today!
              </>
            ) : isLoggingAll ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging {meals.length} meals...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Log All {meals.length} Meals to Today
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-4 space-y-6">
        {hasMeals ? (
          <>
            {/* Meals Grouped by Type */}
            {mealTypeOrder.map((mealType) => {
              const mealsOfType = mealsByType[mealType];
              if (mealsOfType.length === 0) return null;

              return (
                <section key={mealType}>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {mealTypeLabels[mealType]}
                  </h2>
                  <div className="space-y-3">
                    {mealsOfType.map((meal) => (
                      <MealCard key={meal.id} meal={meal} showLogButton={true} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Daily Nutrition Summary */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Daily Nutrition Summary
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                {/* Calories Header */}
                <div className="text-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {nutritionTotals.calories}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    of {targets.calories} calories
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-300',
                        nutritionTotals.calories > targets.calories
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      )}
                      style={{
                        width: `${Math.min((nutritionTotals.calories / targets.calories) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Protein */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Protein</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {nutritionTotals.protein}g / {targets.protein}g
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((nutritionTotals.protein / targets.protein) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carbs</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {nutritionTotals.carbs}g / {targets.carbs}g
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((nutritionTotals.carbs / targets.carbs) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fat</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {nutritionTotals.fat}g / {targets.fat}g
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((nutritionTotals.fat / targets.fat) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Fiber */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fiber</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {nutritionTotals.fiber}g / {targets.fiber}g
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((nutritionTotals.fiber / targets.fiber) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No meals planned
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
              No meals have been logged for this day. Browse recipes to get meal ideas!
            </p>
            <Link
              href="/recipes"
              className={clsx(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl',
                'bg-emerald-600 dark:bg-emerald-600 text-white font-medium',
                'hover:bg-emerald-700 dark:hover:bg-emerald-500',
                'shadow-md hover:shadow-lg transition-all duration-200'
              )}
            >
              <BookOpen className="w-4 h-4" />
              Browse Recipes
            </Link>
          </div>
        )}

        {/* Browse Recipes Button (shown when there are meals) */}
        {hasMeals && (
          <div className="mt-6">
            <Link
              href="/recipes"
              className={clsx(
                'flex items-center justify-center gap-2 w-full py-3 rounded-lg',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
                'text-gray-700 dark:text-gray-200 font-medium',
                'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
              )}
            >
              <BookOpen className="w-5 h-5" />
              Browse Recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
