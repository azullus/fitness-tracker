'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { addDays, subDays, format } from 'date-fns';
import { DateNavigation } from './DateNavigation';
import { DailyNutritionTracker, FoodLog } from '@/components/tracking';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WaterIntakeTracker } from '@/components/tracking/WaterIntakeTracker';
import { QuickAddFood, QuickAddFAB } from '@/components/forms';
import {
  fetchDailyTotals,
  getNutritionTargets,
  type FoodEntry,
  type DailyTotals,
} from '@/lib/food-log';
import type { Person } from '@/lib/types';

interface FoodLoggerTabProps {
  personId: string | undefined;
  currentPerson: Person | null;
}

export function FoodLoggerTab({ personId, currentPerson }: FoodLoggerTabProps) {
  // Food tracking state
  const [foodDate, setFoodDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [foodRefreshTrigger, setFoodRefreshTrigger] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  // Track when component is mounted to handle hydration for localStorage data
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const foodDateString = format(foodDate, 'yyyy-MM-dd');

  // Fetch nutrition data from Supabase (with localStorage fallback)
  useEffect(() => {
    if (!isMounted) return;

    let cancelled = false;

    fetchDailyTotals(foodDateString, personId)
      .then((totals) => {
        if (!cancelled) {
          setDailyTotals(totals);
        }
      })
      .catch(() => {
        // Keep default totals on error
      });

    return () => {
      cancelled = true;
    };
  }, [foodDateString, personId, foodRefreshTrigger, isMounted]);

  const nutritionTargets = useMemo(() => {
    const targets = getNutritionTargets();
    if (currentPerson?.dailyCalorieTarget) {
      targets.calories = currentPerson.dailyCalorieTarget;
    }
    return targets;
  }, [currentPerson]);

  // Food date navigation
  const goToPreviousDay = useCallback(() => {
    setFoodDate((prev) => subDays(prev, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setFoodDate((prev) => addDays(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setFoodDate(new Date());
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFoodSaved = useCallback((_: FoodEntry) => {
    setFoodRefreshTrigger((c) => c + 1);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFoodDeleted = useCallback((_: FoodEntry) => {
    setFoodRefreshTrigger((c) => c + 1);
  }, []);

  return (
    <>
      {/* Date Navigation */}
      <DateNavigation
        date={foodDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      {/* Daily Nutrition Tracker */}
      <DailyNutritionTracker
        totals={dailyTotals}
        targets={nutritionTargets}
      />

      {/* Water Intake */}
      <WaterIntakeTracker />

      {/* Food Log */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Food Log</h2>
        <ErrorBoundary componentName="FoodLog">
          <FoodLog
            date={foodDateString}
            personId={personId}
            onEntryDeleted={handleFoodDeleted}
            refreshTrigger={foodRefreshTrigger}
          />
        </ErrorBoundary>
      </section>

      {/* Quick Add FAB */}
      {personId && <QuickAddFAB onClick={() => setShowQuickAdd(true)} />}

      {/* Quick Add Modal */}
      {personId && (
        <QuickAddFood
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSaved={handleFoodSaved}
          defaultDate={foodDateString}
          personId={personId}
        />
      )}
    </>
  );
}
