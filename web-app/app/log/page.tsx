'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import {
  getWeightEntriesByPerson as getDemoWeightEntriesByPerson,
  getWorkoutsByPerson,
} from '@/lib/demo-data';
import {
  getWeightEntriesForPerson as getStoredWeightEntries,
} from '@/lib/weight-log';
import {
  getWorkoutsForPerson as getStoredWorkouts,
} from '@/lib/workout-log';
import type { WeightEntry, Workout } from '@/lib/types';
import {
  LogTabs,
  WeightLoggerTab,
  FoodLoggerTab,
  WorkoutLoggerTab,
  type TabType,
} from '@/components/log';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function LogPageContent() {
  const currentPerson = useCurrentPerson();
  const personId = currentPerson?.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab state - read from URL query parameter or default to 'food'
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && ['weight', 'food', 'workout'].includes(tabFromUrl) ? tabFromUrl : 'food'
  );

  // Update active tab when URL changes
  useEffect(() => {
    const newTab = searchParams.get('tab') as TabType | null;
    if (newTab && ['weight', 'food', 'workout'].includes(newTab)) {
      setActiveTab(newTab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Weight entries state - combines demo data with localStorage entries
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightRefreshTrigger, setWeightRefreshTrigger] = useState(0);

  // Load weight entries from localStorage and combine with demo data
  useEffect(() => {
    if (!personId) {
      setWeightEntries([]);
      return;
    }

    const demoEntries = getDemoWeightEntriesByPerson(personId);
    const storedEntries = getStoredWeightEntries(personId);

    const allEntries = [...storedEntries, ...demoEntries].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setWeightEntries(allEntries);
  }, [personId, weightRefreshTrigger]);

  // Workout entries state - combines demo data with localStorage entries
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutRefreshTrigger, setWorkoutRefreshTrigger] = useState(0);

  // Load workouts from localStorage and combine with demo data
  useEffect(() => {
    if (!personId) {
      setWorkouts([]);
      return;
    }

    const demoWorkouts = getWorkoutsByPerson(personId);
    const storedWorkouts = getStoredWorkouts(personId);

    const allWorkouts = [...storedWorkouts, ...demoWorkouts].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setWorkouts(allWorkouts);
  }, [personId, workoutRefreshTrigger]);

  // Refresh handlers
  const handleWeightRefresh = useCallback(() => {
    setWeightRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleWorkoutRefresh = useCallback(() => {
    setWorkoutRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Quick Log" />

      {/* Tab Navigation */}
      <LogTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="p-4 space-y-4">
        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <WeightLoggerTab
            personId={personId}
            currentPerson={currentPerson}
            weightEntries={weightEntries}
            workouts={workouts}
            onWeightRefresh={handleWeightRefresh}
          />
        )}

        {/* Food Tab */}
        {activeTab === 'food' && (
          <FoodLoggerTab
            personId={personId}
            currentPerson={currentPerson}
          />
        )}

        {/* Workout Tab */}
        {activeTab === 'workout' && (
          <WorkoutLoggerTab
            personId={personId}
            currentPerson={currentPerson}
            workouts={workouts}
            onWorkoutRefresh={handleWorkoutRefresh}
          />
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LogPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Quick Log" />
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {['Weight', 'Food', 'Workout'].map((label) => (
            <div
              key={label}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium text-gray-400"
            >
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function LogPage() {
  return (
    <Suspense fallback={<LogPageLoading />}>
      <LogPageContent />
    </Suspense>
  );
}
