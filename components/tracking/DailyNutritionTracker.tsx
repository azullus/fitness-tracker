'use client';

import React, { useMemo, memo } from 'react';
import { clsx } from 'clsx';
import {
  type DailyTotals,
  type NutritionTargets,
  getProgressPercentage,
  getProgressStatus,
} from '@/lib/food-log';
import { LazyMacroPieChart } from '@/components/charts';

interface DailyNutritionTrackerProps {
  totals: DailyTotals;
  targets: NutritionTargets;
  className?: string;
}

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  label: string;
  unit: string;
}

// Memoized CircularProgress to prevent re-renders when props haven't changed
const CircularProgress = memo(function CircularProgress({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color,
  bgColor,
  label,
  unit,
}: CircularProgressProps) {
  // Memoize SVG geometry calculations - these only depend on size and strokeWidth
  const { radius, circumference, center } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    return {
      radius: r,
      circumference: r * 2 * Math.PI,
      center: size / 2,
    };
  }, [size, strokeWidth]);

  // Memoize progress calculations
  const { offset, roundedValue } = useMemo(() => {
    const pct = getProgressPercentage(value, max);
    return {
      offset: circumference - (pct / 100) * circumference,
      roundedValue: Math.round(value),
    };
  }, [value, max, circumference]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            className={bgColor}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
          {/* Progress circle */}
          <circle
            className={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {roundedValue}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        / {max}{unit}
      </span>
    </div>
  );
});

interface LinearProgressProps {
  value: number;
  max: number;
  label: string;
  color: string;
  showRemaining?: boolean;
}

// Status color map defined outside component to avoid recreation on each render
const LINEAR_STATUS_COLORS = {
  green: 'bg-green-500 dark:bg-green-600',
  yellow: 'bg-yellow-500 dark:bg-yellow-600',
  red: 'bg-red-500 dark:bg-red-600',
} as const;

// Memoized LinearProgress to prevent re-renders when props haven't changed
const LinearProgress = memo(function LinearProgress({
  value,
  max,
  label,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  color,
  showRemaining = true,
}: LinearProgressProps) {
  // Memoize all computed values together
  const { percentage, status, remaining, roundedValue, roundedRemaining } = useMemo(() => {
    const pct = getProgressPercentage(value, max);
    const st = getProgressStatus(value, max);
    const rem = Math.max(0, max - value);
    return {
      percentage: pct,
      status: st,
      remaining: rem,
      roundedValue: Math.round(value),
      roundedRemaining: Math.round(rem),
    };
  }, [value, max]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {roundedValue}g / {max}g
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            LINEAR_STATUS_COLORS[status]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showRemaining && remaining > 0 && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {roundedRemaining}g remaining
        </p>
      )}
    </div>
  );
});

// Status maps defined outside component to avoid recreation on each render
const STATUS_MESSAGES = {
  green: 'On Track',
  yellow: 'Almost There',
  red: 'Over Target',
} as const;

const STATUS_COLORS = {
  green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40',
  yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40',
  red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40',
} as const;

const CALORIES_STATUS_TEXT_COLORS = {
  green: 'text-green-600 dark:text-green-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  red: 'text-red-600 dark:text-red-400',
} as const;

const CALORIES_BAR_COLORS = {
  green: 'bg-green-500 dark:bg-green-600',
  yellow: 'bg-yellow-500 dark:bg-yellow-600',
  red: 'bg-red-500 dark:bg-red-600',
} as const;

export const DailyNutritionTracker = memo(function DailyNutritionTracker({
  totals,
  targets,
  className,
}: DailyNutritionTrackerProps) {
  // Memoize all calories-related calculations together
  const caloriesData = useMemo(() => {
    const status = getProgressStatus(totals.calories, targets.calories);
    const remaining = Math.max(0, targets.calories - totals.calories);
    const percentage = getProgressPercentage(totals.calories, targets.calories);
    const isOver = totals.calories > targets.calories;
    const roundedCurrent = Math.round(totals.calories);
    const roundedRemaining = Math.round(remaining);
    const roundedOver = Math.round(totals.calories - targets.calories);

    return {
      status,
      remaining,
      percentage,
      isOver,
      roundedCurrent,
      roundedRemaining,
      roundedOver,
    };
  }, [totals.calories, targets.calories]);

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
        className
      )}
    >
      {/* Header with Calories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Daily Nutrition
          </h3>
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded-full',
              STATUS_COLORS[caloriesData.status]
            )}
          >
            {STATUS_MESSAGES[caloriesData.status]}
          </span>
        </div>

        {/* Large Calories Display */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={clsx(
                'text-4xl font-bold',
                CALORIES_STATUS_TEXT_COLORS[caloriesData.status]
              )}
            >
              {caloriesData.roundedCurrent}
            </span>
            <span className="text-lg text-gray-500 dark:text-gray-400">
              / {targets.calories}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            calories consumed
          </p>
        </div>

        {/* Calories Progress Bar */}
        <div className="mt-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                CALORIES_BAR_COLORS[caloriesData.status]
              )}
              style={{ width: `${caloriesData.percentage}%` }}
            />
          </div>
          {!caloriesData.isOver ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
              <span className="font-semibold">{caloriesData.roundedRemaining}</span>{' '}
              calories remaining
            </p>
          ) : (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
              <span className="font-semibold">{caloriesData.roundedOver}</span>{' '}
              calories over target
            </p>
          )}
        </div>
      </div>

      {/* Macros Section */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Macronutrients
        </h4>

        {/* Circular Progress Rings */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <CircularProgress
            value={totals.protein}
            max={targets.protein}
            color="text-blue-500 dark:text-blue-400"
            bgColor="text-blue-100 dark:text-blue-900/40"
            label="Protein"
            unit="g"
            size={72}
          />
          <CircularProgress
            value={totals.carbs}
            max={targets.carbs}
            color="text-amber-500 dark:text-amber-400"
            bgColor="text-amber-100 dark:text-amber-900/40"
            label="Carbs"
            unit="g"
            size={72}
          />
          <CircularProgress
            value={totals.fat}
            max={targets.fat}
            color="text-orange-500 dark:text-orange-400"
            bgColor="text-orange-100 dark:text-orange-900/40"
            label="Fat"
            unit="g"
            size={72}
          />
          <CircularProgress
            value={totals.fiber}
            max={targets.fiber}
            color="text-purple-500 dark:text-purple-400"
            bgColor="text-purple-100 dark:text-purple-900/40"
            label="Fiber"
            unit="g"
            size={72}
          />
        </div>

        {/* Macro Distribution Pie Chart */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 text-center">
            Calorie Distribution
          </h5>
          <LazyMacroPieChart
            data={{
              protein: totals.protein,
              carbs: totals.carbs,
              fat: totals.fat,
            }}
            size={140}
            strokeWidth={20}
          />
        </div>

        {/* Linear Progress Bars */}
        <div className="space-y-4">
          <LinearProgress
            value={totals.protein}
            max={targets.protein}
            label="Protein"
            color="bg-blue-500"
          />
          <LinearProgress
            value={totals.carbs}
            max={targets.carbs}
            label="Carbs"
            color="bg-amber-500"
          />
          <LinearProgress
            value={totals.fat}
            max={targets.fat}
            label="Fat"
            color="bg-orange-500"
          />
          <LinearProgress
            value={totals.fiber}
            max={targets.fiber}
            label="Fiber"
            color="bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
});

export default DailyNutritionTracker;

// Display name for debugging
CircularProgress.displayName = 'CircularProgress';
LinearProgress.displayName = 'LinearProgress';
DailyNutritionTracker.displayName = 'DailyNutritionTracker';
