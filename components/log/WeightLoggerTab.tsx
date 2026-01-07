'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Scale, Clock, Plus, Minus, Check } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { LazyWeightProgressChart } from '@/components/charts';
import { WeightHistory } from '@/components/tracking';
import { addWeightEntry } from '@/lib/weight-log';
import { captureException, captureWarning } from '@/lib/error-monitoring';
import type { WeightEntry, Person, Workout } from '@/lib/types';

// Activity types for the recent activity feed
type ActivityType = 'weight' | 'workout' | 'pantry';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  icon: typeof Scale;
}

interface WeightLoggerTabProps {
  personId: string | undefined;
  currentPerson: Person | null;
  weightEntries: WeightEntry[];
  workouts: Workout[];
  onWeightRefresh: () => void;
}

export function WeightLoggerTab({
  personId,
  currentPerson,
  weightEntries,
  workouts,
  onWeightRefresh,
}: WeightLoggerTabProps) {
  // Weight state
  const latestWeight = weightEntries[0]?.weight_lbs ?? 0;
  const [displayWeight, setDisplayWeight] = useState<number>(latestWeight);
  const [weightSaved, setWeightSaved] = useState(false);

  // Update display weight when person changes or weight entries update
  useEffect(() => {
    if (weightEntries.length > 0) {
      setDisplayWeight(latestWeight);
    }
    setWeightSaved(false);
  }, [latestWeight, weightEntries.length]);

  // Recent activities (simulated from demo data)
  const recentActivities = useMemo<Activity[]>(() => {
    const activities: Activity[] = [];

    // Add recent weight entries
    weightEntries.slice(0, 2).forEach((entry) => {
      activities.push({
        id: `weight-${entry.id}`,
        type: 'weight',
        description: `Logged weight: ${entry.weight_lbs.toFixed(1)} lbs`,
        timestamp: new Date(entry.created_at),
        icon: Scale,
      });
    });

    // Add recent completed workouts
    workouts
      .filter((w) => w.completed)
      .slice(0, 2)
      .forEach((workout) => {
        activities.push({
          id: `workout-${workout.id}`,
          type: 'workout',
          description: `Completed: ${workout.type}`,
          timestamp: new Date(workout.created_at),
          icon: Scale, // Will be styled differently based on type
        });
      });

    // Add simulated pantry activity
    activities.push({
      id: 'pantry-1',
      type: 'pantry',
      description: 'Used: Eggs (2)',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      icon: Scale,
    });

    // Sort by timestamp and take top 5
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [weightEntries, workouts]);

  // Handlers
  const handleWeightAdjust = useCallback((delta: number) => {
    setDisplayWeight((prev) => {
      const safePrev = typeof prev === 'number' && !isNaN(prev) ? prev : 0;
      const newValue = safePrev + delta;
      return Math.max(0, Math.round(newValue * 10) / 10);
    });
    setWeightSaved(false);
  }, []);

  const handleLogWeight = useCallback(() => {
    if (!personId) {
      captureWarning('No person selected, cannot log weight', {
        component: 'WeightLoggerTab',
        action: 'logWeight',
      });
      return;
    }

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      addWeightEntry({
        person_id: personId,
        date: todayStr,
        weight_lbs: displayWeight,
      });

      onWeightRefresh();

      setWeightSaved(true);
      setTimeout(() => setWeightSaved(false), 2000);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: 'WeightLoggerTab',
        action: 'logWeight',
        extra: { weight: displayWeight },
      });
    }
  }, [displayWeight, personId, onWeightRefresh]);

  const handleWeightDeleted = useCallback(() => {
    onWeightRefresh();
  }, [onWeightRefresh]);

  return (
    <>
      {/* Quick Weight Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Quick Weight</h2>
        </div>

        <div className="flex flex-col items-center">
          {/* Large weight display with editable input */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => handleWeightAdjust(-1)}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Decrease weight by 1 lb"
            >
              <Minus className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="999"
                  value={displayWeight.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setDisplayWeight(Math.round(val * 10) / 10);
                      setWeightSaved(false);
                    }
                  }}
                  className="w-32 text-center text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  aria-label="Weight in pounds"
                />
                <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">lbs</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                tap to type
              </p>
            </div>

            <button
              onClick={() => handleWeightAdjust(1)}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Increase weight by 1 lb"
            >
              <Plus className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Quick adjustment buttons - two rows */}
          <div className="flex flex-col gap-2 mb-4">
            {/* Large adjustments */}
            <div className="flex gap-2 justify-center">
              {[-10, -5, 5, 10].map((delta) => (
                <button
                  key={delta}
                  onClick={() => handleWeightAdjust(delta)}
                  className="min-w-[56px] min-h-[44px] px-4 py-2.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/50 active:scale-95 transition-all duration-200"
                >
                  {delta > 0 ? '+' : ''}{delta}
                </button>
              ))}
            </div>
            {/* Small adjustments */}
            <div className="flex gap-2 justify-center">
              {[-1, -0.5, 0.5, 1].map((delta) => (
                <button
                  key={delta}
                  onClick={() => handleWeightAdjust(delta)}
                  className="min-w-[56px] min-h-[44px] px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all duration-200"
                >
                  {delta > 0 ? '+' : ''}{delta}
                </button>
              ))}
            </div>
          </div>

          {/* Log button */}
          <Button
            onClick={handleLogWeight}
            className="w-full max-w-xs"
            variant={weightSaved ? 'secondary' : 'primary'}
          >
            {weightSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              'Log Weight'
            )}
          </Button>

          {latestWeight > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last logged: {latestWeight.toFixed(1)} lbs
            </p>
          )}
        </div>
      </section>

      {/* Weight Progress Chart */}
      <LazyWeightProgressChart
        entries={weightEntries}
        goalWeight={currentPerson?.training_focus === 'powerlifting' ? 180 : 140}
        daysToShow={14}
      />

      {/* Weight History with Delete */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <WeightHistory
          entries={weightEntries}
          onEntryDeleted={handleWeightDeleted}
          maxEntries={5}
        />
      </section>

      {/* Recent Activity Feed */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>

        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div
                  className={clsx(
                    'p-1.5 rounded',
                    activity.type === 'weight' && 'bg-blue-100 dark:bg-blue-900/40',
                    activity.type === 'workout' && 'bg-purple-100 dark:bg-purple-900/40',
                    activity.type === 'pantry' && 'bg-green-100 dark:bg-green-900/40'
                  )}
                >
                  <Scale
                    className={clsx(
                      'w-4 h-4',
                      activity.type === 'weight' && 'text-blue-600 dark:text-blue-400',
                      activity.type === 'workout' && 'text-purple-600 dark:text-purple-400',
                      activity.type === 'pantry' && 'text-green-600 dark:text-green-400'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent activity</p>
          )}
        </div>
      </section>
    </>
  );
}
