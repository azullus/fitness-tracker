'use client';

import { useMemo, useEffect, useState } from 'react';
import Header from '@/components/navigation/Header';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  getWorkoutsByPerson as getDemoWorkoutsByPerson,
  getWeightEntriesByPerson as getDemoWeightEntriesByPerson
} from '@/lib/demo-data';
import {
  getWorkoutsForPerson as getStoredWorkouts,
} from '@/lib/workout-log';
import {
  getWeightEntriesForPerson as getStoredWeightEntries,
} from '@/lib/weight-log';
import {
  getScheduledWorkoutForDate,
} from '@/lib/workout-schedules';
import type { Workout, WeightEntry } from '@/lib/types';
import {
  calculateDailyTotals,
  getNutritionTargets,
  getProgressPercentage,
  getFoodEntriesGroupedByMeal,
  type MealType,
  type FoodEntry,
} from '@/lib/food-log';
import { WaterIntakeTracker } from '@/components/tracking/WaterIntakeTracker';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, subDays, differenceInDays } from 'date-fns';

// Import dashboard components
import {
  HeroSection,
  NutritionProgress,
  WeightSummary,
  WorkoutStatus,
  QuickActions,
  TodaysMeals,
  WeeklySummary,
  ShoppingList,
} from '@/components/dashboard';

// Calculate workout streak (consecutive days with completed workouts)
function calculateWorkoutStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  const completedWorkouts = workouts
    .filter(w => w.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (completedWorkouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a workout today or yesterday (to maintain streak)
  const mostRecentDate = new Date(completedWorkouts[0].date);
  mostRecentDate.setHours(0, 0, 0, 0);

  const daysDiff = differenceInDays(today, mostRecentDate);
  if (daysDiff > 1) return 0; // Streak broken

  // Count consecutive workout days
  let currentDate = mostRecentDate;
  for (const workout of completedWorkouts) {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);

    const diff = differenceInDays(currentDate, workoutDate);
    if (diff === 0) {
      // Same day, continue
      continue;
    } else if (diff === 1) {
      // Consecutive day
      streak++;
      currentDate = workoutDate;
    } else {
      // Streak broken
      break;
    }
  }

  return streak + 1; // Include the first day
}

export default function DashboardPage() {
  const currentPerson = useCurrentPerson();
  const { isAuthenticated, isLoading: authLoading, isAuthEnabled } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const personId = currentPerson?.id;

  // Must declare all hooks before any conditional returns
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if auth is enabled but user is not authenticated
  // Demo mode is only allowed after explicitly clicking "Skip for now" on login page
  useEffect(() => {
    if (mounted && isAuthEnabled && !authLoading && !isAuthenticated) {
      const demoModeActive = localStorage.getItem('fitness-tracker-demo-mode') === 'true';
      if (!demoModeActive) {
        window.location.href = '/auth/login';
      }
    }
  }, [mounted, isAuthEnabled, authLoading, isAuthenticated]);

  // Refresh data when page becomes visible (user navigates back)
  // Debounced to prevent rapid re-triggers from pull-to-refresh gestures
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce to prevent stuck loading from rapid visibility changes
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          setRefreshTrigger((prev) => prev + 1);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);

  // Load workouts and weight entries in parallel
  useEffect(() => {
    if (!personId || !mounted) {
      setWorkouts([]);
      setWeightEntries([]);
      return;
    }

    // Load both datasets in parallel
    const loadData = () => {
      // Only load demo data if not authenticated
      const demoWorkouts = isAuthenticated ? [] : getDemoWorkoutsByPerson(personId);
      const storedWorkouts = getStoredWorkouts(personId);
      const demoEntries = isAuthenticated ? [] : getDemoWeightEntriesByPerson(personId);
      const storedEntries = getStoredWeightEntries(personId);

      // Process workouts
      const allWorkouts = [...storedWorkouts, ...demoWorkouts].sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Process weight entries
      const allEntries = [...storedEntries, ...demoEntries].sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Update state in a single batch
      setWorkouts(allWorkouts);
      setWeightEntries(allEntries);
    };

    loadData();
  }, [personId, mounted, refreshTrigger, isAuthenticated]);

  // Get today's date string - must be before useMemos that use it
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Calculate nutrition stats
  const nutritionTargets = useMemo(() => {
    const targets = getNutritionTargets();
    if (currentPerson?.dailyCalorieTarget) {
      targets.calories = currentPerson.dailyCalorieTarget;
    }
    return targets;
  }, [currentPerson]);

  const dailyTotals = useMemo(() => {
    if (!mounted) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    return calculateDailyTotals(todayStr, personId);
  }, [todayStr, personId, mounted, refreshTrigger]);

  // Get grouped meal entries for today
  const groupedMeals = useMemo(() => {
    if (!mounted) return { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<MealType, FoodEntry[]>;
    return getFoodEntriesGroupedByMeal(todayStr, personId);
  }, [todayStr, personId, mounted, refreshTrigger]);

  // Calculate meal counts for today
  const mealCounts = useMemo(() => {
    return {
      breakfast: groupedMeals.breakfast.length,
      lunch: groupedMeals.lunch.length,
      dinner: groupedMeals.dinner.length,
      snack: groupedMeals.snack.length,
      total: groupedMeals.breakfast.length + groupedMeals.lunch.length + groupedMeals.dinner.length + groupedMeals.snack.length,
    };
  }, [groupedMeals]);

  // Calculate stats - safely handle insufficient data
  const latestWeight = weightEntries.length > 0 ? weightEntries[0].weight_lbs : undefined;
  // Find weight from ~7 days ago (or oldest available if fewer entries)
  const previousWeight = weightEntries.length >= 2
    ? (weightEntries[Math.min(7, weightEntries.length - 1)]?.weight_lbs)
    : undefined;
  const weightChange = latestWeight !== undefined && previousWeight !== undefined
    ? (latestWeight - previousWeight).toFixed(1)
    : null;

  // Count workouts this week - memoize to avoid recalculating on every render
  const { completedThisWeek, plannedThisWeek } = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const filtered = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });
    return {
      completedThisWeek: filtered.filter(w => w.completed).length,
      plannedThisWeek: filtered.length,
    };
  }, [workouts]);

  // Today's workout - memoize to avoid searching array on every render
  const todaysLoggedWorkout = useMemo(() => {
    return workouts.find(w => isToday(new Date(w.date)));
  }, [workouts]);

  // Memoize scheduled workout to ensure it recalculates when person changes
  const scheduledWorkout = useMemo(() => {
    if (!mounted || !currentPerson) return null;
    return getScheduledWorkoutForDate(new Date(), currentPerson);
  }, [mounted, currentPerson]);

  // Memoize workout streak to avoid recalculating on every render
  const workoutStreak = useMemo(() => calculateWorkoutStreak(workouts), [workouts]);

  // Weekly nutrition average (last 7 days) - filtered by person
  const weeklyNutritionStats = useMemo(() => {
    if (!mounted) return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, avgFiber: 0, daysLogged: 0 };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let daysLogged = 0;

    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const totals = calculateDailyTotals(dateStr, personId);
      if (totals.calories > 0) {
        totalCalories += totals.calories;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
        totalFiber += totals.fiber;
        daysLogged++;
      }
    }

    return {
      avgCalories: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
      avgProtein: daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0,
      avgCarbs: daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0,
      avgFat: daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0,
      avgFiber: daysLogged > 0 ? Math.round(totalFiber / daysLogged) : 0,
      daysLogged,
    };
  }, [mounted, personId, refreshTrigger]);

  // Calculate progress percentages for hero section
  const calorieProgress = getProgressPercentage(dailyTotals.calories, nutritionTargets.calories);
  const proteinProgress = getProgressPercentage(dailyTotals.protein, nutritionTargets.protein);

  // Show loading while checking auth (must be after all hooks)
  if (!mounted || (isAuthEnabled && authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check demo mode for render decision
  const demoModeActive = typeof window !== 'undefined' && localStorage.getItem('fitness-tracker-demo-mode') === 'true';

  // Redirect to login if not authenticated (unless demo mode)
  if (isAuthEnabled && !isAuthenticated && !demoModeActive) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Dashboard" />

      <div className="p-4 space-y-4">
        {/* Hero Section */}
        {currentPerson && (
          <HeroSection
            currentPerson={currentPerson}
            workoutStreak={workoutStreak}
            calorieProgress={calorieProgress}
            proteinProgress={proteinProgress}
            completedThisWeek={completedThisWeek}
            plannedThisWeek={plannedThisWeek}
            todaysLoggedWorkout={todaysLoggedWorkout}
            scheduledWorkout={scheduledWorkout}
          />
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Nutrition Progress Widgets */}
        <NutritionProgress
          dailyTotals={dailyTotals}
          nutritionTargets={nutritionTargets}
        />

        {/* Water Intake - Simple glasses view */}
        <WaterIntakeTracker simple />

        {/* Today's Meals Widget */}
        <TodaysMeals
          groupedMeals={groupedMeals}
          mealCounts={mealCounts}
          dailyTotals={dailyTotals}
        />

        {/* Shopping List Widget */}
        <ShoppingList />

        {/* Weight Widget */}
        <WeightSummary
          latestWeight={latestWeight}
          weightChange={weightChange}
        />

        {/* Today's Workout Widget */}
        <WorkoutStatus
          todaysLoggedWorkout={todaysLoggedWorkout}
          scheduledWorkout={scheduledWorkout}
          currentPerson={currentPerson}
        />

        {/* Weekly Summary Widget */}
        <WeeklySummary
          completedThisWeek={completedThisWeek}
          plannedThisWeek={plannedThisWeek}
          weeklyNutritionStats={weeklyNutritionStats}
        />

        {/* Demo Mode Notice - only show when not authenticated */}
        {!isAuthenticated && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Demo Mode:</strong> Using sample data. Configure Supabase in{' '}
              <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                .env.local
              </code>{' '}
              for real data sync.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
