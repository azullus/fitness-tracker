'use client';

import React from 'react';
import { Flame, Target, Wheat, CircleDot, Leaf } from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardWidget, ProgressBar } from './shared';
import type { DailyTotals, NutritionTargets } from '@/lib/food-log';

export interface NutritionProgressProps {
  dailyTotals: DailyTotals;
  nutritionTargets: NutritionTargets;
}

export function NutritionProgress({
  dailyTotals,
  nutritionTargets,
}: NutritionProgressProps) {
  const getProgressPercentage = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const calorieProgress = getProgressPercentage(dailyTotals.calories, nutritionTargets.calories);
  const proteinProgress = getProgressPercentage(dailyTotals.protein, nutritionTargets.protein);
  const carbsProgress = getProgressPercentage(dailyTotals.carbs, nutritionTargets.carbs);
  const fatProgress = getProgressPercentage(dailyTotals.fat, nutritionTargets.fat);
  const fiberProgress = getProgressPercentage(dailyTotals.fiber, nutritionTargets.fiber);

  return (
    <>
      {/* Calorie Summary Widget */}
      <DashboardWidget
        title="Today's Calories"
        icon={Flame}
        iconBgColor="bg-orange-100 dark:bg-orange-900/40"
        iconColor="text-orange-600 dark:text-orange-400"
        href="/log?tab=food"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyTotals.calories.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {nutritionTargets.calories.toLocaleString()} kcal
              </span>
            </div>
            <span className={clsx(
              'text-sm font-medium',
              dailyTotals.calories > nutritionTargets.calories
                ? 'text-red-500'
                : calorieProgress >= 80
                ? 'text-yellow-500'
                : 'text-green-500'
            )}>
              {Math.round(calorieProgress)}%
            </span>
          </div>
          <ProgressBar
            value={dailyTotals.calories}
            max={nutritionTargets.calories}
            colorClass="bg-orange-500"
            showOverflow
            label="Calorie progress"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.max(0, nutritionTargets.calories - dailyTotals.calories).toLocaleString()} kcal remaining
          </p>
        </div>
      </DashboardWidget>

      {/* Protein Progress Widget */}
      <DashboardWidget
        title="Protein Progress"
        icon={Target}
        iconBgColor="bg-indigo-100 dark:bg-indigo-900/40"
        iconColor="text-indigo-600 dark:text-indigo-400"
        href="/log?tab=food"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyTotals.protein}g
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {nutritionTargets.protein}g
              </span>
            </div>
            <span className={clsx(
              'text-sm font-medium',
              proteinProgress >= 100
                ? 'text-green-500'
                : proteinProgress >= 80
                ? 'text-yellow-500'
                : 'text-gray-500'
            )}>
              {Math.round(proteinProgress)}%
            </span>
          </div>
          <ProgressBar
            value={dailyTotals.protein}
            max={nutritionTargets.protein}
            colorClass="bg-indigo-500"
            label="Protein progress"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.max(0, nutritionTargets.protein - dailyTotals.protein)}g more to hit your goal
          </p>
        </div>
      </DashboardWidget>

      {/* Carbs Progress Widget */}
      <DashboardWidget
        title="Carbs"
        icon={Wheat}
        iconBgColor="bg-amber-100 dark:bg-amber-900/40"
        iconColor="text-amber-600 dark:text-amber-400"
        href="/log?tab=food"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyTotals.carbs}g
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {nutritionTargets.carbs}g
              </span>
            </div>
            <span className={clsx(
              'text-sm font-medium',
              dailyTotals.carbs > nutritionTargets.carbs
                ? 'text-red-500'
                : carbsProgress >= 80
                ? 'text-yellow-500'
                : 'text-green-500'
            )}>
              {Math.round(carbsProgress)}%
            </span>
          </div>
          <ProgressBar
            value={dailyTotals.carbs}
            max={nutritionTargets.carbs}
            colorClass="bg-amber-500"
            showOverflow
            label="Carbs progress"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.max(0, nutritionTargets.carbs - dailyTotals.carbs)}g remaining
          </p>
        </div>
      </DashboardWidget>

      {/* Fat Progress Widget */}
      <DashboardWidget
        title="Fat"
        icon={CircleDot}
        iconBgColor="bg-yellow-100 dark:bg-yellow-900/40"
        iconColor="text-yellow-600 dark:text-yellow-400"
        href="/log?tab=food"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyTotals.fat}g
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {nutritionTargets.fat}g
              </span>
            </div>
            <span className={clsx(
              'text-sm font-medium',
              dailyTotals.fat > nutritionTargets.fat
                ? 'text-red-500'
                : fatProgress >= 80
                ? 'text-yellow-500'
                : 'text-green-500'
            )}>
              {Math.round(fatProgress)}%
            </span>
          </div>
          <ProgressBar
            value={dailyTotals.fat}
            max={nutritionTargets.fat}
            colorClass="bg-yellow-500"
            showOverflow
            label="Fat progress"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.max(0, nutritionTargets.fat - dailyTotals.fat)}g remaining
          </p>
        </div>
      </DashboardWidget>

      {/* Fiber Progress Widget */}
      <DashboardWidget
        title="Fiber"
        icon={Leaf}
        iconBgColor="bg-green-100 dark:bg-green-900/40"
        iconColor="text-green-600 dark:text-green-400"
        href="/log?tab=food"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {dailyTotals.fiber}g
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {nutritionTargets.fiber}g
              </span>
            </div>
            <span className={clsx(
              'text-sm font-medium',
              fiberProgress >= 100
                ? 'text-green-500'
                : fiberProgress >= 80
                ? 'text-yellow-500'
                : 'text-gray-500'
            )}>
              {Math.round(fiberProgress)}%
            </span>
          </div>
          <ProgressBar
            value={dailyTotals.fiber}
            max={nutritionTargets.fiber}
            colorClass="bg-green-500"
            label="Fiber progress"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.max(0, nutritionTargets.fiber - dailyTotals.fiber)}g more to hit your goal
          </p>
        </div>
      </DashboardWidget>
    </>
  );
}

export default NutritionProgress;
