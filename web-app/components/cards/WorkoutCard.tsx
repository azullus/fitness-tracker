'use client';

import { clsx } from 'clsx';
import { Dumbbell, Clock, CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';
import type { Workout } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export interface WorkoutCardProps {
  workout: Workout;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  expanded?: boolean;
}

const intensityStyles = {
  low: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-400',
    label: 'Low',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Medium',
  },
  high: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
    label: 'High',
  },
};

export function WorkoutCard({
  workout,
  onToggleComplete,
  onDelete,
  expanded: initialExpanded = false,
}: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const exerciseCount = workout.exercises?.length ?? 0;
  const intensity = workout.intensity ?? 'medium';
  const intensityStyle = intensityStyles[intensity];

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(workout.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(workout.id);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={clsx(
        'rounded-lg border transition-all duration-200',
        'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/30',
        workout.completed
          ? 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Icon and main info */}
          <div className="flex items-start gap-3">
            <div
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
              )}
            >
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{workout.type}</h3>
                {/* Completion badge */}
                <span
                  className={clsx(
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    workout.completed
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  {workout.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {formatDate(workout.date)}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className={clsx(
                  'p-1.5 rounded-full transition-colors duration-200',
                  'text-gray-400 dark:text-gray-500',
                  'hover:text-red-500 dark:hover:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-900/30',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                )}
                aria-label="Remove workout"
                title="Remove workout"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {/* Toggle complete */}
            {onToggleComplete && (
              <button
                onClick={handleToggleComplete}
                className={clsx(
                  'p-1 rounded-full transition-colors duration-200',
                  'hover:bg-purple-100 dark:hover:bg-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                )}
                aria-label={workout.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {workout.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          {/* Exercise count */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Dumbbell className="w-4 h-4 text-purple-500" />
            <span>{exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}</span>
          </div>

          {/* Duration */}
          {workout.duration_minutes && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>{workout.duration_minutes} min</span>
            </div>
          )}

          {/* Intensity */}
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              intensityStyle.bg,
              intensityStyle.text
            )}
          >
            {intensityStyle.label} Intensity
          </span>
        </div>

        {/* Expand/collapse button for exercises */}
        {exerciseCount > 0 && (
          <button
            onClick={handleToggleExpand}
            className={clsx(
              'flex items-center gap-1 mt-3 text-sm font-medium',
              'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200',
              'focus:outline-none focus:underline'
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide exercises
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show exercises
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded exercises list */}
      {isExpanded && exerciseCount > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3">
          <ul className="space-y-2">
            {workout.exercises.map((exercise, index) => (
              <li
                key={`${exercise.name}-${index}`}
                className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">{exercise.name}</span>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  {exercise.sets && exercise.reps && (
                    <span>
                      {exercise.sets} x {exercise.reps}
                    </span>
                  )}
                  {exercise.weight_lbs && (
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {exercise.weight_lbs} lbs
                    </span>
                  )}
                  {exercise.rpe && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                      RPE {exercise.rpe}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {workout.notes && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}
