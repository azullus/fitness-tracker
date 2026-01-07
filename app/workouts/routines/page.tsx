'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Dumbbell,
  Timer,
  Target,
  Zap,
  Heart,
  Flame,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import Header from '@/components/navigation/Header';
import {
  ALL_WORKOUT_ROUTINES,
  searchRoutines,
  getRoutineStats,
} from '@/lib/workouts';
import type { RoutineCategory, RoutineDifficulty, WorkoutRoutine } from '@/lib/workouts/types';

// Category filter options
type CategoryFilter = 'all' | RoutineCategory;

const categories: { value: CategoryFilter; label: string; icon: typeof Dumbbell }[] = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'strength', label: 'Strength', icon: Dumbbell },
  { value: 'cardio', label: 'Cardio', icon: Heart },
  { value: 'hiit', label: 'HIIT', icon: Zap },
  { value: 'mobility', label: 'Mobility', icon: Target },
  { value: 'full_body', label: 'Full Body', icon: Flame },
];

// Difficulty filter options
type DifficultyFilter = 'all' | RoutineDifficulty;

const difficulties: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

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

// Equipment icons mapping
const equipmentIcons: Record<string, string> = {
  'Olympic Barbell': 'Barbell',
  'Squat Rack': 'Rack',
  'Safety Bars': 'Bars',
  'Adjustable Dumbbells': 'DB',
  'Flat Bench': 'Bench',
  'Incline Bench': 'Bench',
  'Rowing Machine': 'Rower',
  Bodyweight: 'BW',
};

export default function WorkoutRoutinesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get routine statistics
  const routineStats = useMemo(() => getRoutineStats(), []);

  // Filter routines based on category, difficulty, and search query
  const filteredRoutines = useMemo(() => {
    let results: WorkoutRoutine[] = ALL_WORKOUT_ROUTINES;

    // Filter by search query first
    if (searchQuery.trim()) {
      results = searchRoutines(searchQuery.trim());
    }

    // Filter by category
    if (activeCategory !== 'all') {
      results = results.filter((r) => r.category === activeCategory);
    }

    // Filter by difficulty
    if (activeDifficulty !== 'all') {
      results = results.filter((r) => r.difficulty === activeDifficulty);
    }

    return results;
  }, [activeCategory, activeDifficulty, searchQuery]);

  const handleRoutineClick = (routineId: string) => {
    router.push(`/workouts/routines/${routineId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Workout Routines" showPersonToggle={true} />

      <main className="px-4 py-4">
        {/* Routine Stats Summary */}
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">
                {routineStats.total}
              </span>{' '}
              total routines
            </span>
            <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{routineStats.strength} strength</span>
              <span>{routineStats.cardio} cardio</span>
              <span>{routineStats.hiit} HIIT</span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by name, muscle group, or exercise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'dark:focus:ring-blue-400 dark:focus:border-blue-400',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    activeCategory === category.value
                      ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty.value}
                onClick={() => setActiveDifficulty(difficulty.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200',
                  activeDifficulty === difficulty.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {difficulty.label}
              </button>
            ))}
          </div>
        </div>

        {/* Routine Count */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
          <span>
            {filteredRoutines.length} routine{filteredRoutines.length !== 1 ? 's' : ''}
            {activeCategory !== 'all' &&
              ` in ${categories.find((c) => c.value === activeCategory)?.label}`}
            {activeDifficulty !== 'all' &&
              ` (${difficulties.find((d) => d.value === activeDifficulty)?.label})`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>

        {/* Routine Grid */}
        {filteredRoutines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRoutines.map((routine) => (
              <WorkoutRoutineCard
                key={routine.id}
                routine={routine}
                onClick={() => handleRoutineClick(routine.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Dumbbell
                className="h-8 w-8 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No routines found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              {searchQuery
                ? `No routines match "${searchQuery}". Try a different search term or filter.`
                : `No routines in this category. Try selecting a different filter.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Workout Routine Card Component
interface WorkoutRoutineCardProps {
  routine: WorkoutRoutine;
  onClick?: () => void;
}

function WorkoutRoutineCard({ routine, onClick }: WorkoutRoutineCardProps) {
  const categoryStyle = categoryColors[routine.category];
  const difficultyStyle = difficultyColors[routine.difficulty];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-all',
        'hover:shadow-md dark:hover:shadow-gray-900/30',
        onClick && 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
          <Dumbbell
            className="h-5 w-5 text-purple-600 dark:text-purple-400"
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {routine.name}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {routine.description}
          </p>
        </div>
      </div>

      {/* Category and difficulty badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
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
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            difficultyStyle.bg,
            difficultyStyle.text,
            difficultyStyle.darkBg,
            difficultyStyle.darkText
          )}
        >
          {routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}
        </span>
      </div>

      {/* Duration and exercise count */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>{routine.duration_minutes} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>{routine.exercises.length} exercises</span>
        </div>
      </div>

      {/* Target muscles */}
      <div className="mt-3">
        <div className="flex flex-wrap gap-1.5">
          {routine.target_muscles.slice(0, 4).map((muscle) => (
            <span
              key={muscle}
              className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              {muscle}
            </span>
          ))}
          {routine.target_muscles.length > 4 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{routine.target_muscles.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Equipment needed */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-1.5">
          {routine.equipment_needed.map((equipment) => (
            <span
              key={equipment}
              className={clsx(
                'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              )}
            >
              {equipmentIcons[equipment] || equipment}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
