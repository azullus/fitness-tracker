'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Timer,
  Target,
  Dumbbell,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
  Repeat,
  Pause,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { getRoutineById } from '@/lib/workouts';
import type {
  WorkoutRoutine,
  RoutineCategory,
  RoutineDifficulty,
  WeightSuggestion,
} from '@/lib/workouts/types';

// Difficulty badge colors
const difficultyColors: Record<
  RoutineDifficulty,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  beginner: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-400',
  },
  intermediate: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-400',
  },
  advanced: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-400',
  },
};

// Category badge colors
const categoryColors: Record<
  RoutineCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  strength: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-400',
  },
  cardio: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    darkBg: 'dark:bg-pink-900/30',
    darkText: 'dark:text-pink-400',
  },
  hiit: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-400',
  },
  mobility: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    darkBg: 'dark:bg-teal-900/30',
    darkText: 'dark:text-teal-400',
  },
  full_body: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-400',
  },
};

// Category labels
const categoryLabels: Record<RoutineCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  hiit: 'HIIT',
  mobility: 'Mobility',
  full_body: 'Full Body',
};

// Weight suggestion colors and labels
const weightSuggestionConfig: Record<
  WeightSuggestion,
  { label: string; color: string; darkColor: string }
> = {
  bodyweight: {
    label: 'Bodyweight',
    color: 'text-gray-600',
    darkColor: 'dark:text-gray-400',
  },
  light: {
    label: 'Light (30-50%)',
    color: 'text-green-600',
    darkColor: 'dark:text-green-400',
  },
  moderate: {
    label: 'Moderate (60-75%)',
    color: 'text-yellow-600',
    darkColor: 'dark:text-yellow-400',
  },
  heavy: {
    label: 'Heavy (80-90%)',
    color: 'text-orange-600',
    darkColor: 'dark:text-orange-400',
  },
  max: {
    label: 'Max Effort (90%+)',
    color: 'text-red-600',
    darkColor: 'dark:text-red-400',
  },
};

export default function WorkoutRoutineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routineId = params.id as string;

  // Find the routine by ID
  const routine = useMemo(() => {
    return getRoutineById(routineId);
  }, [routineId]);

  if (!routine) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Dumbbell
            className="h-8 w-8 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Routine not found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          The workout routine you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button onClick={() => router.push('/workouts/routines')}>
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Routines
        </Button>
      </div>
    );
  }

  const categoryStyle = categoryColors[routine.category];
  const difficultyStyle = difficultyColors[routine.difficulty];

  // Calculate total exercise time (rough estimate)
  const totalExerciseTime = routine.exercises.reduce((acc, ex) => {
    // Estimate ~45 seconds per set average for the exercise itself
    return acc + ex.sets * 45 + ex.sets * ex.rest_seconds;
  }, 0);

  const handleStartWorkout = () => {
    // Placeholder - would start an active workout session
    alert(
      `Starting "${routine.name}" workout\n\nThis feature will be implemented in a future update.`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/workouts/routines')}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to routines"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
            {routine.name}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Routine Header */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {routine.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{routine.description}</p>

          {/* Category and Difficulty Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.darkBg,
                categoryStyle.darkText
              )}
            >
              {categoryLabels[routine.category]}
            </span>
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                difficultyStyle.bg,
                difficultyStyle.text,
                difficultyStyle.darkBg,
                difficultyStyle.darkText
              )}
            >
              {routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span>{routine.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span>{routine.exercises.length} exercises</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Pause className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span>{routine.rest_between_exercises_seconds}s rest between</span>
            </div>
          </div>
        </section>

        {/* Target Muscles */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            Target Muscles
          </h3>
          <div className="flex flex-wrap gap-2">
            {routine.target_muscles.map((muscle) => (
              <span
                key={muscle}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              >
                {muscle}
              </span>
            ))}
          </div>
        </section>

        {/* Equipment Needed */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Equipment Needed
          </h3>
          <div className="flex flex-wrap gap-2">
            {routine.equipment_needed.map((equipment) => (
              <span
                key={equipment}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
              >
                {equipment}
              </span>
            ))}
          </div>
        </section>

        {/* Warmup Section */}
        {routine.warmup && routine.warmup.length > 0 && (
          <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Warmup
            </h3>
            <ol className="space-y-2">
              {routine.warmup.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-300 text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Exercise List */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Repeat className="h-5 w-5 text-green-500 dark:text-green-400" />
            Exercises
          </h3>
          <div className="space-y-4">
            {routine.exercises.map((exercise, index) => (
              <div
                key={index}
                className={clsx(
                  'p-4 rounded-lg border',
                  'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                )}
              >
                {/* Exercise Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {exercise.name}
                    </h4>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exercise Details */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Repeat className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{exercise.sets}</span> sets x{' '}
                      <span className="font-medium">{exercise.reps}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {exercise.rest_seconds}s rest
                    </span>
                  </div>
                  {exercise.weight_suggestion && (
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span
                        className={clsx(
                          'font-medium',
                          weightSuggestionConfig[exercise.weight_suggestion].color,
                          weightSuggestionConfig[exercise.weight_suggestion].darkColor
                        )}
                      >
                        {weightSuggestionConfig[exercise.weight_suggestion].label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alternatives */}
                {exercise.alternatives && exercise.alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Alternatives: {exercise.alternatives.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Cooldown Section */}
        {routine.cooldown && routine.cooldown.length > 0 && (
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Cooldown
            </h3>
            <ol className="space-y-2">
              {routine.cooldown.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-300 text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Notes Section */}
        {routine.notes && (
          <section className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{routine.notes}</p>
          </section>
        )}

        {/* Tags */}
        {routine.tags && routine.tags.length > 0 && (
          <section>
            <div className="flex flex-wrap gap-2">
              {routine.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Start Workout Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStartWorkout}
          >
            <Play className="h-5 w-5 mr-2" aria-hidden="true" />
            Start Workout
          </Button>
        </div>
      </main>
    </div>
  );
}
