'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Flame, Trophy, Play, Dumbbell, Library } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

import Header from '@/components/navigation/Header';
import { WorkoutCard } from '@/components/cards';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrentPerson } from '@/components/providers/PersonProvider';
import { getWorkoutsByPerson as getDemoWorkoutsByPerson } from '@/lib/demo-data';
import {
  getWorkoutsForPerson as getStoredWorkouts,
  createWorkoutFromRoutine,
  deleteWorkout,
  updateWorkout,
} from '@/lib/workout-log';
import { ALL_ROUTINES, type WorkoutRoutine } from '@/lib/workouts';
import {
  getScheduledWorkoutForDate as getScheduledWorkout,
  type ScheduledWorkout,
} from '@/lib/workout-schedules';
import type { Workout } from '@/lib/types';

// Days of the week starting from Monday
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutsPage() {
  const currentPerson = useCurrentPerson();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  );
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [mounted, setMounted] = useState(false);
  const [workoutRefreshTrigger, setWorkoutRefreshTrigger] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  const personId = currentPerson?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load workouts from localStorage and combine with demo data
  useEffect(() => {
    if (!personId || !mounted) {
      setWorkouts([]);
      return;
    }

    const demoWorkouts = getDemoWorkoutsByPerson(personId);
    const storedWorkouts = getStoredWorkouts(personId);

    const allWorkouts = [...storedWorkouts, ...demoWorkouts].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setWorkouts(allWorkouts);
  }, [personId, mounted, workoutRefreshTrigger]);

  // Get scheduled workout for a specific date based on training focus
  const getScheduledWorkoutForDate = useCallback(
    (date: Date): ScheduledWorkout => {
      return getScheduledWorkout(date, currentPerson);
    },
    [currentPerson]
  );

  // Get suggested routines for a scheduled workout
  const getRoutinesForSchedule = useCallback((schedule: ScheduledWorkout): WorkoutRoutine[] => {
    if (!schedule) return [];

    return ALL_ROUTINES.filter((r) => {
      // Match by category
      if (r.category === schedule.category) return true;
      // Also match by name containing the type
      if (r.name.toLowerCase().includes(schedule.type.toLowerCase())) return true;
      // Match specific workout types
      if (schedule.type === 'Squat Day' && r.name.toLowerCase().includes('squat')) return true;
      if (schedule.type === 'Bench Day' && r.name.toLowerCase().includes('bench')) return true;
      if (schedule.type === 'Deadlift Day' && r.name.toLowerCase().includes('deadlift')) return true;
      return false;
    }).slice(0, 3);
  }, []);

  // Handle starting a workout from a routine
  const handleStartWorkout = useCallback(
    (routine: WorkoutRoutine, date: Date) => {
      if (!personId) {
        return;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      createWorkoutFromRoutine(personId, routine, dateStr);
      setWorkoutRefreshTrigger((prev) => prev + 1);
    },
    [personId]
  );

  // Handle initiating workout deletion (show confirmation)
  const handleDeleteWorkoutClick = useCallback((workoutId: string) => {
    setWorkoutToDelete(workoutId);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle confirming workout deletion
  const handleConfirmDelete = useCallback(() => {
    if (workoutToDelete) {
      // Distinguish user-created workouts from demo data by ID format:
      // - User workouts: "workout-{timestamp}-{random}" e.g., "workout-1735550000000-abc123def"
      // - Demo workouts: "workout-{4-digit-index}" e.g., "workout-0001"
      // User IDs contain a 13-digit timestamp, demo IDs have a 4-digit padded index
      const isUserCreatedWorkout = /^workout-\d{13,}-/.test(workoutToDelete);

      if (isUserCreatedWorkout) {
        // Delete from localStorage
        deleteWorkout(workoutToDelete);
        setWorkoutRefreshTrigger((prev) => prev + 1);
      } else {
        // For demo data, just remove from local state (not persisted)
        setWorkouts((prev) => prev.filter((w) => w.id !== workoutToDelete));
      }
    }
    setDeleteConfirmOpen(false);
    setWorkoutToDelete(null);
  }, [workoutToDelete]);

  // Handle canceling deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setWorkoutToDelete(null);
  }, []);

  // Get workouts filtered by person (already filtered by useEffect, but keep for safety)
  const personWorkouts = useMemo(() => {
    if (!currentPerson) return [];
    return workouts;
  }, [currentPerson, workouts]);

  // Get week end date
  const currentWeekEnd = useMemo(
    () => endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    [currentWeekStart]
  );

  // Generate array of days for the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Get workout for a specific day
  const getWorkoutForDay = (date: Date): Workout | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return personWorkouts.find((w) => w.date === dateStr);
  };

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const weekWorkouts = personWorkouts.filter((w) => {
      const workoutDate = parseISO(w.date);
      return workoutDate >= currentWeekStart && workoutDate <= currentWeekEnd;
    });

    const completedCount = weekWorkouts.filter((w) => w.completed).length;

    // Count scheduled workouts for the week based on training focus
    const scheduledCount = weekDays.filter((date) => {
      return getScheduledWorkoutForDate(date) !== null;
    }).length;

    // Total planned = max of actual workouts or scheduled workouts
    const totalPlanned = Math.max(weekWorkouts.length, scheduledCount);

    // Calculate streak (consecutive days with completed workouts ending today or yesterday)
    let streak = 0;
    const today = new Date();
    let checkDate = today;

    // Sort all completed workouts by date descending
    const completedWorkouts = personWorkouts
      .filter((w) => w.completed)
      .map((w) => parseISO(w.date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (completedWorkouts.length > 0) {
      // Check if most recent workout is today or yesterday
      const mostRecent = completedWorkouts[0];
      const diffDays = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        // Start counting streak from most recent workout
        checkDate = mostRecent;
        streak = 1;

        // Count backwards
        for (let i = 1; i < completedWorkouts.length; i++) {
          const expectedDate = addDays(checkDate, -1);
          if (isSameDay(completedWorkouts[i], expectedDate)) {
            streak++;
            checkDate = expectedDate;
          } else {
            break;
          }
        }
      }
    }

    return {
      completedCount,
      totalPlanned,
      streak,
    };
  }, [personWorkouts, currentWeekStart, currentWeekEnd, weekDays, getScheduledWorkoutForDate]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Toggle workout completion
  const handleToggleComplete = useCallback((workoutId: string) => {
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;

    const newCompletedState = !workout.completed;

    // Update local state immediately for responsiveness
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId ? { ...w, completed: newCompletedState } : w
      )
    );

    // Persist to localStorage if it's a user-created workout
    // User workouts have timestamp-based IDs: "workout-{13+ digit timestamp}-{random}"
    const isUserCreatedWorkout = /^workout-\d{13,}-/.test(workoutId);
    if (isUserCreatedWorkout) {
      try {
        updateWorkout(workoutId, { completed: newCompletedState });
      } catch {
        // Revert on failure
        setWorkouts((prev) =>
          prev.map((w) =>
            w.id === workoutId ? { ...w, completed: !newCompletedState } : w
          )
        );
      }
    }
  }, [workouts]);

  // Toggle workout expansion
  const handleToggleExpand = (workoutId: string) => {
    setExpandedWorkoutId((prev) => (prev === workoutId ? null : workoutId));
  };

  // Check if viewing current week
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return isSameDay(currentWeekStart, thisWeekStart);
  }, [currentWeekStart]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Workouts" />

      <main className="px-4 py-4 space-y-6">
        {/* Week Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousWeek}
              className={clsx(
                'p-2 rounded-lg transition-colors duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {format(currentWeekStart, 'MMM d')} -{' '}
                {format(currentWeekEnd, 'MMM d, yyyy')}
              </span>
              {!isCurrentWeek && (
                <button
                  onClick={goToCurrentWeek}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-1 flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" />
                  Go to current week
                </button>
              )}
            </div>

            <button
              onClick={goToNextWeek}
              className={clsx(
                'p-2 rounded-lg transition-colors duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day, index) => {
              const date = weekDays[index];
              const hasWorkout = Boolean(getWorkoutForDay(date));
              const workout = getWorkoutForDay(date);
              const isCompleted = workout?.completed ?? false;
              const isTodayDate = isToday(date);
              const scheduledWorkout = getScheduledWorkoutForDate(date);
              const hasScheduledWorkout = Boolean(scheduledWorkout);

              return (
                <div
                  key={day}
                  className={clsx(
                    'flex flex-col items-center py-2 px-1 rounded-lg',
                    isTodayDate && 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-500',
                    !isTodayDate && hasWorkout && isCompleted && 'bg-green-50 dark:bg-green-900/30',
                    !isTodayDate && hasWorkout && !isCompleted && 'bg-yellow-50 dark:bg-yellow-900/30',
                    !isTodayDate && !hasWorkout && hasScheduledWorkout && 'bg-blue-50 dark:bg-blue-900/30'
                  )}
                >
                  <span
                    className={clsx(
                      'text-xs font-medium',
                      isTodayDate ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {day}
                  </span>
                  <span
                    className={clsx(
                      'text-sm font-semibold mt-0.5',
                      isTodayDate ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                  {/* Indicator dots */}
                  <div className="h-2 mt-1">
                    {hasWorkout ? (
                      <div
                        className={clsx(
                          'w-2 h-2 rounded-full',
                          isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                        )}
                      />
                    ) : hasScheduledWorkout ? (
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weeklyStats.completedCount}{' '}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                of {weeklyStats.totalPlanned}
              </span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weeklyStats.streak}{' '}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {weeklyStats.streak === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
        </div>

        {/* Browse Routines Link */}
        <Link
          href="/workouts/routines"
          className={clsx(
            'flex items-center justify-between p-4 rounded-xl',
            'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600',
            'text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]'
          )}
        >
          <div className="flex items-center gap-3">
            <Library className="w-5 h-5" />
            <div>
              <p className="font-medium">Browse Workout Routines</p>
              <p className="text-sm text-purple-100">View all available workout templates</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </Link>

        {/* Daily Workout Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">This Week</h2>

          {weekDays.map((date) => {
            const workout = getWorkoutForDay(date);
            const isTodayDate = isToday(date);
            const dayName = format(date, 'EEEE');
            const dateStr = format(date, 'MMM d');

            if (workout) {
              return (
                <div key={date.toISOString()} className="relative">
                  {isTodayDate && (
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-purple-500 rounded-full" />
                  )}
                  <div className={clsx(isTodayDate && 'pl-2')}>
                    <WorkoutCard
                      workout={workout}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteWorkoutClick}
                      expanded={expandedWorkoutId === workout.id}
                    />
                  </div>
                </div>
              );
            }

            // Check if there's a scheduled workout
            const scheduledWorkout = getScheduledWorkoutForDate(date);
            const suggestedRoutines = getRoutinesForSchedule(scheduledWorkout);

            // Scheduled workout card (no workout started yet)
            if (scheduledWorkout) {
              return (
                <div
                  key={date.toISOString()}
                  className={clsx(
                    'relative rounded-lg border p-4',
                    isTodayDate
                      ? 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/20'
                      : 'border-blue-100 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20'
                  )}
                >
                  {isTodayDate && (
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-purple-500 rounded-full" />
                  )}
                  <div className={clsx(isTodayDate && 'pl-2')}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p
                          className={clsx(
                            'font-semibold',
                            isTodayDate ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-200'
                          )}
                        >
                          {dayName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-blue-500" />
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {scheduledWorkout.type}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Routines */}
                    {suggestedRoutines.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Start a routine:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedRoutines.map((routine) => (
                            <button
                              key={routine.id}
                              onClick={() => handleStartWorkout(routine, date)}
                              className={clsx(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
                                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
                                'hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30',
                                'transition-colors duration-200'
                              )}
                            >
                              <Play className="w-3 h-3 text-blue-500" />
                              <span className="text-gray-700 dark:text-gray-200">{routine.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Rest day card
            return (
              <div
                key={date.toISOString()}
                className={clsx(
                  'relative rounded-lg border p-4',
                  isTodayDate
                    ? 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                )}
              >
                {isTodayDate && (
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-purple-500 rounded-full" />
                )}
                <div className={clsx('flex items-center justify-between', isTodayDate && 'pl-2')}>
                  <div>
                    <p
                      className={clsx(
                        'font-semibold',
                        isTodayDate ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-200'
                      )}
                    >
                      {dayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</p>
                  </div>
                  <span
                    className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      isTodayDate
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    Rest Day
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Remove Workout"
        message="Are you sure you want to remove this workout? This will return the day to its default scheduled workout view."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
