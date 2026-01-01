'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Droplets, Plus, Minus, RotateCcw, GlassWater } from 'lucide-react';
import { usePersonId } from '@/components/providers/PersonProvider';

interface WaterIntakeTrackerProps {
  /** Compact mode for dashboard widget */
  compact?: boolean;
  /** Simple mode - just glasses icons, no extras */
  simple?: boolean;
  /** Daily goal in glasses (default 8) */
  dailyGoal?: number;
  /** Size of one glass in ml (default 250ml / 8oz) */
  glassSize?: number;
}

const STORAGE_KEY_PREFIX = 'fitness-tracker-water-';

function getStorageKey(personId: string | undefined, date: string): string {
  return `${STORAGE_KEY_PREFIX}${personId || 'default'}-${date}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function WaterIntakeTracker({
  compact = false,
  simple = false,
  dailyGoal = 8,
  glassSize = 250,
}: WaterIntakeTrackerProps) {
  const personId = usePersonId();
  const [glasses, setGlasses] = useState(0);
  const [mounted, setMounted] = useState(false);
  const today = getTodayDateString();

  // Load water intake from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(getStorageKey(personId, today));
      if (stored) {
        setGlasses(parseInt(stored, 10) || 0);
      } else {
        setGlasses(0);
      }
    } catch {
      // Failed to load from localStorage
    }
  }, [personId, today]);

  // Save water intake to localStorage
  const saveGlasses = useCallback(
    (newGlasses: number) => {
      try {
        localStorage.setItem(getStorageKey(personId, today), String(newGlasses));
      } catch {
        // Failed to save to localStorage
      }
    },
    [personId, today]
  );

  const addGlass = useCallback(() => {
    setGlasses((prev) => {
      const newValue = prev + 1;
      saveGlasses(newValue);
      return newValue;
    });
  }, [saveGlasses]);

  const removeGlass = useCallback(() => {
    setGlasses((prev) => {
      const newValue = Math.max(0, prev - 1);
      saveGlasses(newValue);
      return newValue;
    });
  }, [saveGlasses]);

  const resetGlasses = useCallback(() => {
    setGlasses(0);
    saveGlasses(0);
  }, [saveGlasses]);

  const progress = Math.min((glasses / dailyGoal) * 100, 100);
  const totalMl = glasses * glassSize;
  const goalMl = dailyGoal * glassSize;
  const isGoalMet = glasses >= dailyGoal;

  if (!mounted) {
    return (
      <div className={clsx(
        'animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl',
        simple ? 'h-16' : compact ? 'h-24' : 'h-40'
      )} />
    );
  }

  // Simple version - just glasses with minimal UI
  if (simple) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Water
            </span>
          </div>
          <span className={clsx(
            'text-xs font-semibold',
            isGoalMet ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          )}>
            {glasses}/{dailyGoal} glasses
          </span>
        </div>

        {/* Glass visualization - tap to toggle */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: dailyGoal }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const newGlasses = i < glasses ? i : i + 1;
                setGlasses(newGlasses);
                saveGlasses(newGlasses);
              }}
              className={clsx(
                'p-1.5 rounded-lg transition-all duration-200',
                'hover:scale-110 active:scale-95',
                i < glasses
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              )}
              aria-label={`${i < glasses ? 'Remove' : 'Add'} glass ${i + 1}`}
            >
              <GlassWater className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Compact version for dashboard
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `rgba(var(--theme-primary-light), 0.5)` }}
            >
              <Droplets
                className="w-4 h-4"
                style={{ color: `rgb(var(--theme-primary-text))` }}
              />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Water
            </span>
          </div>
          <span className={clsx(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            isGoalMet
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          )}>
            {glasses}/{dailyGoal}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-300',
              isGoalMet ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Quick add buttons */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {totalMl}ml / {goalMl}ml
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={removeGlass}
              disabled={glasses === 0}
              className={clsx(
                'p-1.5 rounded-lg transition-all duration-150',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'active:scale-95'
              )}
              aria-label="Remove glass"
            >
              <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={addGlass}
              className={clsx(
                'p-2 rounded-lg transition-all duration-150',
                'bg-blue-500 hover:bg-blue-600 text-white',
                'active:scale-95 shadow-sm'
              )}
              aria-label="Add glass of water"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full version for log page
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `rgba(var(--theme-primary-light), 0.5)` }}
          >
            <Droplets
              className="w-5 h-5"
              style={{ color: `rgb(var(--theme-primary-text))` }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Water Intake
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track your daily hydration
            </p>
          </div>
        </div>
        <button
          onClick={resetGlasses}
          className={clsx(
            'p-2 rounded-lg transition-all duration-150',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'text-gray-500 dark:text-gray-400'
          )}
          aria-label="Reset water intake"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Glass visualization */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {Array.from({ length: dailyGoal }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const newGlasses = i + 1;
              setGlasses(newGlasses);
              saveGlasses(newGlasses);
            }}
            className={clsx(
              'p-2 rounded-lg transition-all duration-200',
              'hover:scale-110 active:scale-95',
              i < glasses
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            )}
            aria-label={`Set water intake to ${i + 1} glasses`}
          >
            <GlassWater className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className={clsx(
            'text-sm font-bold',
            isGoalMet ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
          )}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500 ease-out',
              isGoalMet
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {glasses}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            glasses today
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalMl}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ml consumed
          </p>
        </div>
      </div>

      {/* Quick add/remove buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={removeGlass}
          disabled={glasses === 0}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
            'font-medium transition-all duration-150',
            'border-2 border-gray-200 dark:border-gray-600',
            'hover:border-gray-300 dark:hover:border-gray-500',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'active:scale-[0.98]',
            'text-gray-700 dark:text-gray-300'
          )}
        >
          <Minus className="w-4 h-4" />
          Remove
        </button>
        <button
          onClick={addGlass}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
            'font-medium transition-all duration-150',
            'bg-blue-500 hover:bg-blue-600 text-white',
            'active:scale-[0.98]',
            'shadow-md shadow-blue-500/25'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Glass
        </button>
      </div>

      {/* Goal status */}
      {isGoalMet && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
          <p className="text-green-700 dark:text-green-400 font-medium text-sm">
            Great job! You've reached your daily water goal!
          </p>
        </div>
      )}
    </div>
  );
}

export default WaterIntakeTracker;
