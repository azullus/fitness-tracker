'use client';

import React, { useMemo, useEffect, useState, memo } from 'react';
import { clsx } from 'clsx';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { Workout } from '@/lib/types';

// Types for streak data persistence
interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  workoutDates: string[]; // Array of date strings in YYYY-MM-DD format
  updatedAt: string;
}

interface WorkoutStreakProps {
  workouts: Workout[];
  personId: string;
  className?: string;
}

// Storage key generator
const getStorageKey = (personId: string): string => `workout-streak-${personId}`;

// Motivational messages based on streak length
const getMotivationalMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it going!";
  if (streak === 2) return "Two days strong!";
  if (streak === 3) return "Three's a charm!";
  if (streak <= 6) return "Building momentum!";
  if (streak === 7) return "One week strong!";
  if (streak <= 13) return "Crushing it!";
  if (streak === 14) return "Two weeks of dedication!";
  if (streak <= 20) return "Unstoppable!";
  if (streak === 21) return "Three weeks! Habit formed!";
  if (streak <= 29) return "You're on fire!";
  if (streak === 30) return "One month champion!";
  if (streak <= 59) return "Legendary consistency!";
  if (streak >= 60) return "Elite athlete status!";
  return "Keep pushing!";
};

// Calculate streak from workout dates
const calculateStreakFromDates = (workoutDates: string[]): { current: number; best: number } => {
  if (workoutDates.length === 0) {
    return { current: 0, best: 0 };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...workoutDates]
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = subDays(today, 1);

  // Check if streak is still active (worked out today or yesterday)
  const mostRecentWorkout = sortedDates[0];
  const isStreakActive = isSameDay(mostRecentWorkout, today) || isSameDay(mostRecentWorkout, yesterday);

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak
  if (isStreakActive) {
    let checkDate = isSameDay(mostRecentWorkout, today) ? today : yesterday;
    for (const workoutDate of sortedDates) {
      if (isSameDay(workoutDate, checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (workoutDate.getTime() < checkDate.getTime()) {
        break;
      }
    }
  }

  // Calculate best streak by iterating through all dates
  // Sort in ascending order for this calculation
  const ascendingDates = [...sortedDates].sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < ascendingDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = ascendingDates[i - 1];
      const currentDate = ascendingDates[i];
      const dayDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else if (dayDiff > 1) {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
      // If dayDiff === 0, same day workout, don't increment
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { current: currentStreak, best: bestStreak };
};

// Day cell component for the weekly calendar
interface DayCellProps {
  date: Date;
  hasWorkout: boolean;
  isToday: boolean;
}

const DayCell = memo(function DayCell({ date, hasWorkout, isToday }: DayCellProps) {
  const dayName = format(date, 'EEE');
  const dayNum = format(date, 'd');

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{dayName}</span>
      <div
        className={clsx(
          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
          isToday && 'ring-2 ring-offset-2 ring-green-500 dark:ring-green-400 dark:ring-offset-gray-800',
          hasWorkout
            ? 'bg-green-500 dark:bg-green-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        )}
      >
        {hasWorkout ? (
          <Flame className="w-4 h-4" aria-label="Workout completed" />
        ) : (
          dayNum
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

// Stat card component
interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  colorClass: string;
  bgColorClass: string;
}

const StatCard = memo(function StatCard({ icon: Icon, value, label, colorClass, bgColorClass }: StatCardProps) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className={clsx('p-2 rounded-lg mb-2', bgColorClass)}>
        <Icon className={clsx('w-5 h-5', colorClass)} />
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{label}</span>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export const WorkoutStreak = memo(function WorkoutStreak({
  workouts,
  personId,
  className,
}: WorkoutStreakProps) {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastWorkoutDate: null,
    workoutDates: [],
    updatedAt: new Date().toISOString(),
  });

  // Load streak data from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(personId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StreakData;
        setStreakData(parsed);
      }
    } catch {
      // Failed to load streak data from localStorage
    }
  }, [personId]);

  // Update streak data when workouts change
  useEffect(() => {
    // Extract dates from completed workouts
    const completedWorkoutDates = workouts
      .filter((w) => w.completed)
      .map((w) => w.date);

    // Merge with existing stored dates (removing duplicates)
    const allDates = Array.from(new Set([...streakData.workoutDates, ...completedWorkoutDates]));

    // Calculate new streaks
    const { current, best } = calculateStreakFromDates(allDates);

    // Get last workout date
    const sortedDates = allDates.sort((a, b) => b.localeCompare(a));
    const lastWorkoutDate = sortedDates[0] || null;

    const newStreakData: StreakData = {
      currentStreak: current,
      bestStreak: Math.max(best, streakData.bestStreak), // Never decrease best streak
      lastWorkoutDate,
      workoutDates: allDates,
      updatedAt: new Date().toISOString(),
    };

    // Only update if there's a change
    if (
      newStreakData.currentStreak !== streakData.currentStreak ||
      newStreakData.bestStreak !== streakData.bestStreak ||
      newStreakData.lastWorkoutDate !== streakData.lastWorkoutDate ||
      allDates.length !== streakData.workoutDates.length
    ) {
      setStreakData(newStreakData);

      // Persist to localStorage
      const storageKey = getStorageKey(personId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newStreakData));
      } catch {
        // Failed to save streak data to localStorage
      }
    }
  }, [workouts, personId, streakData]);

  // Calculate weekly calendar data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const days: { date: Date; hasWorkout: boolean; isToday: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasWorkout = streakData.workoutDates.includes(dateStr);
      const isToday = isSameDay(date, today);
      days.push({ date, hasWorkout, isToday });
    }

    return days;
  }, [streakData.workoutDates]);

  // Calculate this week and this month counts
  const { thisWeek, thisMonth } = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    let weekCount = 0;
    let monthCount = 0;

    for (const dateStr of streakData.workoutDates) {
      const date = parseISO(dateStr);

      // Check if within current week
      if (date >= weekStart && date <= today) {
        weekCount++;
      }

      // Check if within current month
      if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
        monthCount++;
      }
    }

    return { thisWeek: weekCount, thisMonth: monthCount };
  }, [streakData.workoutDates]);

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(streakData.currentStreak),
    [streakData.currentStreak]
  );

  const isStreakActive = streakData.currentStreak > 0;

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header with flame animation for active streaks */}
      <div className={clsx(
        'p-4 border-b border-gray-200 dark:border-gray-700',
        isStreakActive && 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'p-2 rounded-lg',
              isStreakActive
                ? 'bg-orange-100 dark:bg-orange-900/40'
                : 'bg-gray-100 dark:bg-gray-700'
            )}>
              <Flame
                className={clsx(
                  'w-5 h-5',
                  isStreakActive
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Workout Streak</h3>
          </div>
          {isStreakActive && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">
              <Flame className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="p-4 text-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isStreakActive && (
            <span className="text-3xl" role="img" aria-label="fire">
              <Flame className="w-8 h-8 text-orange-500 dark:text-orange-400" />
            </span>
          )}
          <span className={clsx(
            'text-5xl font-bold',
            isStreakActive
              ? 'text-orange-500 dark:text-orange-400'
              : 'text-gray-400 dark:text-gray-500'
          )}>
            {streakData.currentStreak}
          </span>
          {isStreakActive && (
            <span className="text-3xl" role="img" aria-label="fire">
              <Flame className="w-8 h-8 text-orange-500 dark:text-orange-400" />
            </span>
          )}
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {streakData.currentStreak === 1 ? 'day' : 'days'} streak
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
          {motivationalMessage}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Trophy}
            value={streakData.bestStreak}
            label="Best Streak"
            colorClass="text-yellow-600 dark:text-yellow-400"
            bgColorClass="bg-yellow-100 dark:bg-yellow-900/40"
          />
          <StatCard
            icon={Calendar}
            value={thisWeek}
            label="This Week"
            colorClass="text-blue-600 dark:text-blue-400"
            bgColorClass="bg-blue-100 dark:bg-blue-900/40"
          />
          <StatCard
            icon={TrendingUp}
            value={thisMonth}
            label="This Month"
            colorClass="text-green-600 dark:text-green-400"
            bgColorClass="bg-green-100 dark:bg-green-900/40"
          />
        </div>
      </div>

      {/* Weekly Consistency Calendar */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          This Week
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {weeklyData.map((day) => (
            <DayCell
              key={day.date.toISOString()}
              date={day.date}
              hasWorkout={day.hasWorkout}
              isToday={day.isToday}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
          {thisWeek}/7 workouts this week
        </p>
      </div>
    </div>
  );
});

export default WorkoutStreak;

WorkoutStreak.displayName = 'WorkoutStreak';
