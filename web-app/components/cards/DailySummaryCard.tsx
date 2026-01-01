'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Flame,
  Droplets,
  Target,
  Scale,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { usePersonId } from '@/components/providers/PersonProvider';

interface DailySummaryCardProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  water: { current: number; target: number };
  weight?: { current: number; previous?: number };
  workout?: { completed: boolean; name?: string };
}

function getWaterFromStorage(personId: string | undefined): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().split('T')[0];
  const key = `fitness-tracker-water-${personId || 'default'}-${today}`;
  try {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function DailySummaryCard({
  calories,
  protein,
  water,
  weight,
  workout,
}: DailySummaryCardProps) {
  const personId = usePersonId();
  const [mounted, setMounted] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);

  useEffect(() => {
    setMounted(true);
    setWaterGlasses(getWaterFromStorage(personId));
  }, [personId]);

  // Listen for water changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      setWaterGlasses(getWaterFromStorage(personId));
    };

    // Check every 2 seconds for water updates (since it's in same tab)
    const interval = setInterval(handleStorageChange, 2000);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [mounted, personId]);

  const calorieProgress = Math.min((calories.current / calories.target) * 100, 100);
  const proteinProgress = Math.min((protein.current / protein.target) * 100, 100);
  const waterProgress = Math.min((waterGlasses / water.target) * 100, 100);

  const weightChange = useMemo(() => {
    if (!weight?.current || !weight?.previous) return null;
    return weight.current - weight.previous;
  }, [weight]);

  // Calculate overall day score (0-100)
  const dayScore = useMemo(() => {
    let score = 0;
    let factors = 0;

    // Calories (aim for 80-110% of target)
    if (calories.current > 0) {
      const calPct = (calories.current / calories.target) * 100;
      if (calPct >= 80 && calPct <= 110) score += 25;
      else if (calPct >= 60 && calPct <= 130) score += 15;
      else score += 5;
      factors++;
    }

    // Protein (aim for 80%+ of target)
    if (protein.current > 0) {
      if (proteinProgress >= 80) score += 25;
      else if (proteinProgress >= 50) score += 15;
      else score += 5;
      factors++;
    }

    // Water (aim for 75%+ of target)
    if (waterGlasses > 0) {
      if (waterProgress >= 75) score += 25;
      else if (waterProgress >= 50) score += 15;
      else score += 5;
      factors++;
    }

    // Workout completed
    if (workout?.completed) {
      score += 25;
      factors++;
    } else if (workout?.name) {
      factors++; // Count but no points if not completed
    }

    return factors > 0 ? Math.round((score / (factors * 25)) * 100) : 0;
  }, [calories, protein, proteinProgress, waterGlasses, waterProgress, workout]);

  if (!mounted) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-48" />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header with day score */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, rgba(var(--theme-primary-from), 0.1), rgba(var(--theme-primary-to), 0.05))`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `rgba(var(--theme-primary-light), 0.5)` }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: `rgb(var(--theme-primary-text))` }}
            >
              {dayScore}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Daily Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dayScore >= 75 ? 'Great progress!' : dayScore >= 50 ? 'Keep it up!' : 'Let\'s get started!'}
            </p>
          </div>
        </div>
        <Link
          href="/log"
          className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          style={{ color: `rgb(var(--theme-primary-text))` }}
        >
          Details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Calories */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Calories</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {calories.current.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                / {calories.target.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              {calories.current >= calories.target
                ? 'Goal reached!'
                : `${(calories.target - calories.current).toLocaleString()} cal remaining`}
            </p>
          </div>

          {/* Protein */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Protein</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {protein.current}g
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                / {protein.target}g
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${proteinProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              {protein.current >= protein.target
                ? 'Goal reached!'
                : `${protein.target - protein.current}g remaining`}
            </p>
          </div>

          {/* Weight or Workout */}
          {weight?.current ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Weight</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {weight.current}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">lbs</span>
                {weightChange !== null && weightChange !== 0 && (
                  <span className={clsx(
                    'flex items-center text-xs font-medium',
                    weightChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {weightChange < 0 ? (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(weightChange).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                {weightChange === null ? 'Latest reading' : 'vs last week'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Workout</span>
              </div>
              <div className="flex items-center gap-2">
                {workout?.completed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Complete!
                    </span>
                  </>
                ) : workout?.name ? (
                  <>
                    <Circle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {workout.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Rest day
                    </span>
                  </>
                )}
              </div>
              {workout?.name && !workout.completed && (
                <Link
                  href="/workouts"
                  className="mt-2 inline-block text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Start workout →
                </Link>
              )}
            </div>
          )}

          {/* Water - always last */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Water</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {waterGlasses}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                / {water.target} glasses
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  waterProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${waterProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              {waterGlasses >= water.target
                ? 'Goal reached!'
                : `${water.target - waterGlasses} glasses to go`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailySummaryCard;
