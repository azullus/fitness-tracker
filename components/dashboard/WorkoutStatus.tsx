'use client';

import React, { useState, useCallback } from 'react';
import { Dumbbell, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardWidget } from './shared';
import { markWorkoutCompleteAsync } from '@/lib/workout-log';
import type { Workout, Person } from '@/lib/types';

export interface ScheduledWorkout {
  type: string;
  description?: string;
}

export interface WorkoutStatusProps {
  todaysLoggedWorkout?: Workout;
  scheduledWorkout: ScheduledWorkout | null;
  currentPerson: Person | null;
  onWorkoutComplete?: () => void;
}

export function WorkoutStatus({
  todaysLoggedWorkout,
  scheduledWorkout,
  currentPerson,
  onWorkoutComplete,
}: WorkoutStatusProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(false);

  const isCompleted = localCompleted || todaysLoggedWorkout?.completed;

  const handleMarkComplete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to /workouts
    e.stopPropagation();

    if (!todaysLoggedWorkout || isCompleted || isCompleting) return;

    setIsCompleting(true);
    try {
      await markWorkoutCompleteAsync(todaysLoggedWorkout.id);
      setLocalCompleted(true);
      onWorkoutComplete?.();
    } catch {
      // Error handled silently
    } finally {
      setIsCompleting(false);
    }
  }, [todaysLoggedWorkout, isCompleted, isCompleting, onWorkoutComplete]);

  const getWorkoutStatus = () => {
    // Check logged workout first
    if (todaysLoggedWorkout) {
      if (isCompleted) {
        return { label: 'Completed', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' };
      }
      return { label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' };
    }
    // Check scheduled workout from training focus
    if (scheduledWorkout) {
      return { label: 'Scheduled', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' };
    }
    // Rest day
    return { label: 'Rest Day', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
  };

  const workoutStatus = getWorkoutStatus();

  return (
    <DashboardWidget
      title="Today's Workout"
      icon={Dumbbell}
      iconBgColor="bg-purple-100 dark:bg-purple-900/40"
      iconColor="text-purple-600 dark:text-purple-400"
      href="/workouts"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {todaysLoggedWorkout ? (
            <>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {todaysLoggedWorkout.type}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {todaysLoggedWorkout.exercises.length} exercises
                {todaysLoggedWorkout.duration_minutes && ` | ${todaysLoggedWorkout.duration_minutes} min`}
              </p>
            </>
          ) : scheduledWorkout ? (
            <>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {scheduledWorkout.type}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentPerson?.training_focus === 'powerlifting' ? 'Strength training' :
                 currentPerson?.training_focus === 'cardio' ? 'Cardio focus' : 'Mixed training'}
              </p>
            </>
          ) : (
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Rest day - recover well!
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mark Complete button - only show when workout is in progress */}
          {todaysLoggedWorkout && !isCompleted && (
            <button
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                'bg-green-600 text-white hover:bg-green-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Check className="w-4 h-4" />
              {isCompleting ? 'Saving...' : 'Complete'}
            </button>
          )}
          <span className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
            workoutStatus.color
          )}>
            {workoutStatus.label}
          </span>
        </div>
      </div>
    </DashboardWidget>
  );
}

export default WorkoutStatus;
