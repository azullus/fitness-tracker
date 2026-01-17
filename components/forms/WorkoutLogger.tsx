'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Workout, Exercise } from '@/lib/types';

interface WorkoutLoggerProps {
  workout: Workout;
  onComplete: (id: string, exercises: Exercise[]) => Promise<void>;
  onCancel?: () => void;
}

interface ExerciseState extends Exercise {
  completed: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function WorkoutLogger({ workout, onComplete, onCancel }: WorkoutLoggerProps) {
  const [exercises, setExercises] = useState<ExerciseState[]>(
    workout.exercises.map((ex) => ({ ...ex, completed: false }))
  );
  const [notes, setNotes] = useState<string>(workout.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateExercise = useCallback(
    (index: number, field: keyof ExerciseState, value: number | boolean | string) => {
      setExercises((prev) =>
        prev.map((ex, i) =>
          i === index ? { ...ex, [field]: value } : ex
        )
      );
    },
    []
  );

  const toggleExerciseCompleted = useCallback((index: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === index ? { ...ex, completed: !ex.completed } : ex
      )
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Include exercises that are either checked OR have meaningful data entered
    const exercisesWithData = exercises.filter((ex) => {
      // Explicitly completed
      if (ex.completed) return true;
      // Has meaningful data (sets, reps, or weight entered)
      if ((ex.sets && ex.sets > 0) || (ex.reps && ex.reps > 0) || (ex.weight_lbs && ex.weight_lbs > 0)) {
        return true;
      }
      return false;
    });

    if (exercisesWithData.length === 0) {
      setError('Please complete at least one exercise or enter workout data before logging.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Strip the 'completed' state field before submitting
      const exercisesToSubmit: Exercise[] = exercisesWithData.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ completed: _, ...exercise }) => ({
          ...exercise,
          ...(notes.trim() && { notes: notes.trim() }),
        })
      );

      await onComplete(workout.id, exercisesToSubmit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [exercises, notes, workout.id, onComplete]);

  const completedCount = exercises.filter((ex) => ex.completed).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{workout.type}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(workout.date)}</p>
        {workout.intensity && (
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
              workout.intensity === 'high'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                : workout.intensity === 'medium'
                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            }`}
          >
            {workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1)} Intensity
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exercises</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} / {exercises.length} completed
          </span>
        </div>

        {exercises.map((exercise, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 transition-colors ${
              exercise.completed
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`exercise-${index}`}
                checked={exercise.completed}
                onChange={() => toggleExerciseCompleted(index)}
                className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-500"
                disabled={isSubmitting}
              />
              <div className="flex-1 space-y-3">
                <label
                  htmlFor={`exercise-${index}`}
                  className="block text-base font-medium text-gray-900 dark:text-white cursor-pointer"
                >
                  {exercise.name}
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Input
                    type="number"
                    label="Sets"
                    value={exercise.sets ?? ''}
                    onChange={(e) =>
                      updateExercise(index, 'sets', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    disabled={isSubmitting || !exercise.completed}
                  />
                  <Input
                    type="number"
                    label="Reps"
                    value={exercise.reps ?? ''}
                    onChange={(e) =>
                      updateExercise(index, 'reps', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    disabled={isSubmitting || !exercise.completed}
                  />
                  <Input
                    type="number"
                    label="Weight (lbs)"
                    value={exercise.weight_lbs ?? ''}
                    onChange={(e) =>
                      updateExercise(index, 'weight_lbs', parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="2.5"
                    disabled={isSubmitting || !exercise.completed}
                  />
                  <div className="space-y-1">
                    <label htmlFor={`exercise-${index}-rpe`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      RPE (1-10)
                    </label>
                    <select
                      id={`exercise-${index}-rpe`}
                      value={exercise.rpe ?? ''}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          'rpe',
                          e.target.value ? parseInt(e.target.value) : 0
                        )
                      }
                      disabled={isSubmitting || !exercise.completed}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                        <option key={rpe} value={rpe}>
                          {rpe}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="workout-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes (optional)
        </label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did the workout feel? Any PRs or adjustments?"
          rows={3}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={completedCount === 0}
          className="flex-1"
        >
          Complete Workout
        </Button>
      </div>
    </form>
  );
}
