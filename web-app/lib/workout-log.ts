/**
 * Workout Log Storage Utility
 * Manages workout entries using Supabase with localStorage fallback
 */

import type { Workout, Exercise } from './types';
import type { WorkoutRoutine } from './workouts/types';
import { format } from 'date-fns';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { safeLocalStorageSet, StorageError } from './utils';

const WORKOUT_LOG_KEY = 'fitness-tracker-workout-log';

function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// ASYNC SUPABASE FUNCTIONS (Primary)
// ============================================================================

/**
 * Fetch workouts for a person from Supabase
 */
export async function fetchWorkoutsForPerson(personId: string): Promise<Workout[]> {
  if (!isSupabaseConfigured()) {
    return getWorkoutsForPerson(personId);
  }

  try {
    const { data, error } = await getSupabase()
      .from('workouts')
      .select('*')
      .eq('person_id', personId)
      .order('date', { ascending: false });

    if (error) {
      return getWorkoutsForPerson(personId);
    }

    return data as Workout[];
  } catch {
    return getWorkoutsForPerson(personId);
  }
}

/**
 * Fetch workouts for a person on a specific date
 */
export async function fetchWorkoutsForPersonAndDate(
  personId: string,
  date: string
): Promise<Workout[]> {
  if (!isSupabaseConfigured()) {
    return getWorkoutsForPersonAndDate(personId, date);
  }

  try {
    const { data, error } = await getSupabase()
      .from('workouts')
      .select('*')
      .eq('person_id', personId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      return getWorkoutsForPersonAndDate(personId, date);
    }

    return data as Workout[];
  } catch {
    return getWorkoutsForPersonAndDate(personId, date);
  }
}

/**
 * Fetch today's workout for a person
 */
export async function fetchTodaysWorkout(personId: string): Promise<Workout | null> {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const workouts = await fetchWorkoutsForPersonAndDate(personId, todayStr);
  return workouts.length > 0 ? workouts[0] : null;
}

/**
 * Save a new workout to Supabase
 */
export async function saveWorkout(
  entry: Omit<Workout, 'id' | 'created_at'>
): Promise<Workout> {
  if (!isSupabaseConfigured()) {
    return addWorkout(entry);
  }

  try {
    const { data, error } = await getSupabase()
      .from('workouts')
      .insert([entry])
      .select()
      .single();

    if (error) {
      return addWorkout(entry);
    }

    return data as Workout;
  } catch {
    return addWorkout(entry);
  }
}

/**
 * Update a workout in Supabase
 */
export async function updateWorkoutAsync(
  id: string,
  updates: Partial<Omit<Workout, 'id' | 'created_at'>>
): Promise<Workout | null> {
  if (!isSupabaseConfigured()) {
    return updateWorkout(id, updates);
  }

  try {
    const { data, error } = await getSupabase()
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return updateWorkout(id, updates);
    }

    return data as Workout;
  } catch {
    return updateWorkout(id, updates);
  }
}

/**
 * Mark a workout as complete in Supabase
 */
export async function markWorkoutCompleteAsync(id: string): Promise<Workout | null> {
  return updateWorkoutAsync(id, { completed: true });
}

/**
 * Delete a workout from Supabase
 */
export async function removeWorkout(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteWorkout(id);
  }

  try {
    const { error } = await getSupabase()
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      return deleteWorkout(id);
    }

    return true;
  } catch {
    return deleteWorkout(id);
  }
}

/**
 * Fetch completed workouts count in a date range
 */
export async function fetchCompletedWorkoutsInRange(
  personId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return getCompletedWorkoutsInRange(personId, startDate, endDate);
  }

  try {
    const { count, error } = await getSupabase()
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', personId)
      .eq('completed', true)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      return getCompletedWorkoutsInRange(personId, startDate, endDate);
    }

    return count || 0;
  } catch {
    return getCompletedWorkoutsInRange(personId, startDate, endDate);
  }
}

// ============================================================================
// SYNC LOCALSTORAGE FUNCTIONS (Fallback)
// ============================================================================

export function getAllWorkouts(): Workout[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(WORKOUT_LOG_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as Workout[];
  } catch {
    return [];
  }
}

export function getWorkoutsForPerson(personId: string): Workout[] {
  const allWorkouts = getAllWorkouts();
  return allWorkouts
    .filter((workout) => workout.person_id === personId)
    .sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export function getWorkoutsForPersonAndDate(
  personId: string,
  date: string
): Workout[] {
  const personWorkouts = getWorkoutsForPerson(personId);
  return personWorkouts.filter((workout) => workout.date === date);
}

export function getTodaysWorkout(personId: string): Workout | null {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysWorkouts = getWorkoutsForPersonAndDate(personId, todayStr);
  return todaysWorkouts.length > 0 ? todaysWorkouts[0] : null;
}

export function addWorkout(
  entry: Omit<Workout, 'id' | 'created_at'>
): Workout {
  const workouts = getAllWorkouts();

  const newWorkout: Workout = {
    ...entry,
    id: generateWorkoutId(),
    created_at: new Date().toISOString(),
  };

  workouts.push(newWorkout);

  try {
    safeLocalStorageSet(WORKOUT_LOG_KEY, JSON.stringify(workouts));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old workouts to save new ones.');
    }
    throw new Error('Failed to save workout');
  }

  return newWorkout;
}

export function createWorkoutFromRoutine(
  personId: string,
  routine: WorkoutRoutine,
  date?: string
): Workout {
  const workoutDate = date || format(new Date(), 'yyyy-MM-dd');

  const exercises: Exercise[] = routine.exercises.map((ex) => {
    const repsMatch = ex.reps.match(/^(\d+)/);
    const repsNum = repsMatch ? parseInt(repsMatch[1], 10) : undefined;

    return {
      name: ex.name,
      sets: ex.sets,
      reps: repsNum,
      weight_lbs: undefined,
      rpe: undefined,
      notes: ex.notes ? `${ex.reps} - ${ex.notes}` : (ex.reps || undefined),
    };
  });

  return addWorkout({
    person_id: personId,
    date: workoutDate,
    type: routine.name,
    exercises,
    duration_minutes: routine.duration_minutes,
    intensity: routine.difficulty === 'beginner' ? 'low' : routine.difficulty === 'intermediate' ? 'medium' : 'high',
    notes: `Based on routine: ${routine.name}`,
    completed: false,
  });
}

/**
 * Async version of createWorkoutFromRoutine for Supabase
 */
export async function createWorkoutFromRoutineAsync(
  personId: string,
  routine: WorkoutRoutine,
  date?: string
): Promise<Workout> {
  const workoutDate = date || format(new Date(), 'yyyy-MM-dd');

  const exercises: Exercise[] = routine.exercises.map((ex) => {
    const repsMatch = ex.reps.match(/^(\d+)/);
    const repsNum = repsMatch ? parseInt(repsMatch[1], 10) : undefined;

    return {
      name: ex.name,
      sets: ex.sets,
      reps: repsNum,
      weight_lbs: undefined,
      rpe: undefined,
      notes: ex.notes ? `${ex.reps} - ${ex.notes}` : (ex.reps || undefined),
    };
  });

  return saveWorkout({
    person_id: personId,
    date: workoutDate,
    type: routine.name,
    exercises,
    duration_minutes: routine.duration_minutes,
    intensity: routine.difficulty === 'beginner' ? 'low' : routine.difficulty === 'intermediate' ? 'medium' : 'high',
    notes: `Based on routine: ${routine.name}`,
    completed: false,
  });
}

export function updateWorkout(
  id: string,
  updates: Partial<Omit<Workout, 'id' | 'created_at'>>
): Workout | null {
  const workouts = getAllWorkouts();
  const index = workouts.findIndex((w) => w.id === id);

  if (index === -1) {
    return null;
  }

  const updatedWorkout: Workout = {
    ...workouts[index],
    ...updates,
  };

  workouts[index] = updatedWorkout;

  try {
    safeLocalStorageSet(WORKOUT_LOG_KEY, JSON.stringify(workouts));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old workouts.');
    }
    throw new Error('Failed to update workout');
  }

  return updatedWorkout;
}

export function markWorkoutComplete(id: string): Workout | null {
  return updateWorkout(id, { completed: true });
}

export function deleteWorkout(id: string): boolean {
  const workouts = getAllWorkouts();
  const index = workouts.findIndex((w) => w.id === id);

  if (index === -1) {
    return false;
  }

  workouts.splice(index, 1);

  try {
    safeLocalStorageSet(WORKOUT_LOG_KEY, JSON.stringify(workouts));
  } catch {
    throw new Error('Failed to delete workout');
  }

  return true;
}

export function getWorkoutById(id: string): Workout | null {
  const workouts = getAllWorkouts();
  return workouts.find((w) => w.id === id) || null;
}

export function clearAllWorkouts(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(WORKOUT_LOG_KEY);
  } catch {
    // Silently fail on clear
  }
}

export function getCompletedWorkoutsInRange(
  personId: string,
  startDate: string,
  endDate: string
): number {
  const personWorkouts = getWorkoutsForPerson(personId);
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return personWorkouts.filter((workout) => {
    const workoutDate = new Date(workout.date).getTime();
    return workoutDate >= start && workoutDate <= end && workout.completed;
  }).length;
}
