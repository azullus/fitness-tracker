/**
 * Workout Schedule Utility
 * Shared schedule logic for determining scheduled workouts based on training focus
 */

import { getDay } from 'date-fns';
import type { Person } from './types';

// Scheduled workout type
export type ScheduledWorkout = { type: string; category: string } | null;

// Training schedules based on person's focus
export const POWERLIFTING_SCHEDULE: Record<number, ScheduledWorkout> = {
  0: null, // Sunday - Rest
  1: { type: 'Squat Day', category: 'strength' }, // Monday
  2: { type: 'Bench Day', category: 'strength' }, // Tuesday
  3: null, // Wednesday - Rest
  4: { type: 'Deadlift Day', category: 'strength' }, // Thursday
  5: { type: 'Full Body', category: 'full_body' }, // Friday - Volume
  6: null, // Saturday - Rest
};

export const CARDIO_SCHEDULE: Record<number, ScheduledWorkout> = {
  0: null, // Sunday - Rest
  1: { type: 'HIIT', category: 'hiit' }, // Monday
  2: { type: 'Lower Body', category: 'strength' }, // Tuesday
  3: { type: 'Cardio', category: 'cardio' }, // Wednesday
  4: { type: 'Upper Body', category: 'strength' }, // Thursday
  5: { type: 'Mobility', category: 'mobility' }, // Friday - Active Recovery
  6: null, // Saturday - Rest
};

// Mixed schedule: alternates strength and cardio throughout the week
export const MIXED_SCHEDULE: Record<number, ScheduledWorkout> = {
  0: null, // Sunday - Rest
  1: { type: 'HIIT', category: 'hiit' }, // Monday - Cardio
  2: { type: 'Squat Day', category: 'strength' }, // Tuesday - Strength
  3: { type: 'Cardio', category: 'cardio' }, // Wednesday - Cardio
  4: { type: 'Upper Body', category: 'strength' }, // Thursday - Strength
  5: { type: 'Mobility', category: 'mobility' }, // Friday - Active Recovery
  6: null, // Saturday - Rest
};

/**
 * Get scheduled workout for a specific date based on person's training focus
 */
export function getScheduledWorkoutForDate(
  date: Date,
  person: Person | null
): ScheduledWorkout {
  if (!person) return null;

  const dayOfWeek = getDay(date); // 0=Sunday, 1=Monday, etc.
  const focus = person.training_focus;

  if (focus === 'powerlifting') {
    return POWERLIFTING_SCHEDULE[dayOfWeek];
  } else if (focus === 'cardio') {
    return CARDIO_SCHEDULE[dayOfWeek];
  } else if (focus === 'mixed') {
    return MIXED_SCHEDULE[dayOfWeek];
  }

  // Default to mixed schedule if focus is undefined or unknown
  return MIXED_SCHEDULE[dayOfWeek];
}

/**
 * Check if today is a rest day for the given person
 */
export function isRestDay(person: Person | null): boolean {
  return getScheduledWorkoutForDate(new Date(), person) === null;
}

/**
 * Get today's scheduled workout type name
 */
export function getTodaysScheduledWorkoutType(person: Person | null): string | null {
  const scheduled = getScheduledWorkoutForDate(new Date(), person);
  return scheduled?.type ?? null;
}
