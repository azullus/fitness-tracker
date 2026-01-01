'use client';

import React from 'react';
import {
  UtensilsCrossed,
  Calendar,
  Zap,
  Flame,
  Target,
  Wheat,
  CircleDot,
  Leaf,
} from 'lucide-react';
import { DashboardWidget } from './shared';
import type { FoodEntry, MealType, DailyTotals } from '@/lib/food-log';

// ============================================================================
// TodaysMeals Component
// ============================================================================

export interface TodaysMealsProps {
  groupedMeals: Record<MealType, FoodEntry[]>;
  mealCounts: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
    total: number;
  };
  dailyTotals: DailyTotals;
}

export function TodaysMeals({
  groupedMeals,
  mealCounts,
  dailyTotals,
}: TodaysMealsProps) {
  return (
    <DashboardWidget
      title="Today's Meals"
      icon={UtensilsCrossed}
      iconBgColor="bg-teal-100 dark:bg-teal-900/40"
      iconColor="text-teal-600 dark:text-teal-400"
      href="/log?tab=food"
    >
      <div className="space-y-3">
        {mealCounts.total === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
            No meals logged yet today
          </p>
        ) : (
          <div className="space-y-2">
            {/* Breakfast */}
            {groupedMeals.breakfast.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Breakfast</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {groupedMeals.breakfast.map(e => e.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {/* Lunch */}
            {groupedMeals.lunch.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Lunch</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {groupedMeals.lunch.map(e => e.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {/* Dinner */}
            {groupedMeals.dinner.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Dinner</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {groupedMeals.dinner.map(e => e.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {/* Snacks */}
            {groupedMeals.snack.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Snacks</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {groupedMeals.snack.map(e => e.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Macro breakdown */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              P: {dailyTotals.protein}g
            </span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              C: {dailyTotals.carbs}g
            </span>
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              F: {dailyTotals.fat}g
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {mealCounts.total} {mealCounts.total === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
    </DashboardWidget>
  );
}

// ============================================================================
// WeeklySummary Component
// ============================================================================

export interface WeeklyNutritionStats {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  daysLogged: number;
}

export interface WeeklySummaryProps {
  completedThisWeek: number;
  plannedThisWeek: number;
  weeklyNutritionStats: WeeklyNutritionStats;
}

export function WeeklySummary({
  completedThisWeek,
  plannedThisWeek,
  weeklyNutritionStats,
}: WeeklySummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'rgba(var(--theme-accent), 0.15)' }}
        >
          <Calendar
            className="w-5 h-5"
            style={{ color: 'rgb(var(--theme-accent))' }}
          />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white">Weekly Summary</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Workouts */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Workouts</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {completedThisWeek}/{plannedThisWeek}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">this week</p>
        </div>

        {/* Avg Calories */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Calories</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {weeklyNutritionStats.avgCalories.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {weeklyNutritionStats.daysLogged} days logged
          </p>
        </div>

        {/* Avg Protein */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Protein</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {weeklyNutritionStats.avgProtein}g
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">daily average</p>
        </div>

        {/* Avg Carbs */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wheat className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Carbs</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {weeklyNutritionStats.avgCarbs}g
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">daily average</p>
        </div>

        {/* Avg Fat */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CircleDot className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Fat</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {weeklyNutritionStats.avgFat}g
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">daily average</p>
        </div>

        {/* Avg Fiber */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Fiber</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {weeklyNutritionStats.avgFiber}g
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">daily average</p>
        </div>
      </div>
    </div>
  );
}

export default TodaysMeals;
