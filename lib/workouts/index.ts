// Workout routine data exports
// Combines all workout categories into a single exportable collection

import type {
  WorkoutRoutine,
  RoutineExercise,
  RoutineCategory,
  RoutineDifficulty,
  WeightSuggestion,
  MuscleGroup,
} from './types';
import { STRENGTH_ROUTINES } from './strength-routines';
import { CARDIO_ROUTINES } from './cardio-routines';
import { HIIT_ROUTINES } from './hiit-routines';
import { MOBILITY_ROUTINES } from './mobility-routines';

// Re-export types
export type {
  WorkoutRoutine,
  RoutineExercise,
  RoutineCategory,
  RoutineDifficulty,
  WeightSuggestion,
  MuscleGroup,
};

// Re-export constants
export { HOME_GYM_EQUIPMENT, MUSCLE_GROUPS } from './types';

// Combined routine collection
export const ALL_ROUTINES: WorkoutRoutine[] = [
  ...STRENGTH_ROUTINES,
  ...CARDIO_ROUTINES,
  ...HIIT_ROUTINES,
  ...MOBILITY_ROUTINES,
];

// Legacy export name for backward compatibility
export const ALL_WORKOUT_ROUTINES = ALL_ROUTINES;

// Re-export individual categories
export { STRENGTH_ROUTINES } from './strength-routines';
export { CARDIO_ROUTINES } from './cardio-routines';
export { HIIT_ROUTINES } from './hiit-routines';
export { MOBILITY_ROUTINES } from './mobility-routines';

// Full body routines (filter from strength routines)
export const FULL_BODY_ROUTINES = ALL_ROUTINES.filter((r) => r.category === 'full_body');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a routine by its unique ID
 */
export const getRoutineById = (id: string): WorkoutRoutine | undefined => {
  return ALL_ROUTINES.find((r) => r.id === id);
};

/**
 * Get all routines in a specific category
 */
export const getRoutinesByCategory = (category: RoutineCategory): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.category === category);
};

/**
 * Get all routines at a specific difficulty level
 */
export const getRoutinesByDifficulty = (difficulty: RoutineDifficulty): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.difficulty === difficulty);
};

/**
 * Get routines that match a specific tag
 */
export const getRoutinesByTag = (tag: string): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.tags.includes(tag.toLowerCase()));
};

/**
 * Get routines that target specific muscle groups
 */
export const getRoutinesByMuscle = (muscle: string): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) =>
    r.target_muscles.some((m) => m.toLowerCase().includes(muscle.toLowerCase()))
  );
};

/**
 * Get routines that can be completed within a time limit
 */
export const getRoutinesByMaxDuration = (maxMinutes: number): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.duration_minutes <= maxMinutes);
};

/**
 * Get routines that require only specific equipment
 */
export const getRoutinesByEquipment = (availableEquipment: string[]): WorkoutRoutine[] => {
  const normalizedAvailable = availableEquipment.map((e) => e.toLowerCase());
  return ALL_ROUTINES.filter((r) =>
    r.equipment_needed.every(
      (needed) =>
        normalizedAvailable.some((available) => available.includes(needed.toLowerCase())) ||
        needed.toLowerCase() === 'bodyweight'
    )
  );
};

/**
 * Get routines suitable for a specific training focus
 * Maps to Person.training_focus from main types
 */
export const getRoutinesByTrainingFocus = (
  focus: 'powerlifting' | 'cardio' | 'mixed'
): WorkoutRoutine[] => {
  switch (focus) {
    case 'powerlifting':
      return ALL_ROUTINES.filter(
        (r) =>
          r.category === 'strength' ||
          r.tags.includes('powerlifting') ||
          r.tags.includes('strength')
      );
    case 'cardio':
      return ALL_ROUTINES.filter(
        (r) =>
          r.category === 'cardio' ||
          r.category === 'hiit' ||
          r.category === 'mobility' ||
          r.tags.includes('cardio') ||
          r.tags.includes('endurance')
      );
    case 'mixed':
      return ALL_ROUTINES; // All routines are suitable for mixed training
    default:
      return ALL_ROUTINES;
  }
};

/**
 * Search routines by name, description, or tags
 */
export const searchRoutines = (query: string): WorkoutRoutine[] => {
  const lowerQuery = query.toLowerCase();
  return ALL_ROUTINES.filter(
    (r) =>
      r.name.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      r.target_muscles.some((muscle) => muscle.toLowerCase().includes(lowerQuery)) ||
      r.exercises.some((e) => e.name.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get routines for weight loss goals (higher volume, shorter rest)
 */
export const getWeightLossRoutines = (): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter(
    (r) =>
      r.tags.includes('weight-loss') ||
      r.tags.includes('fat-burning') ||
      r.tags.includes('metabolic') ||
      r.category === 'hiit' ||
      r.category === 'cardio'
  );
};

/**
 * Get routines for muscle building goals
 */
export const getMuscleBuildingRoutines = (): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter(
    (r) =>
      r.tags.includes('muscle-building') ||
      r.tags.includes('powerlifting') ||
      r.tags.includes('strength') ||
      (r.category === 'strength' && r.difficulty !== 'beginner')
  );
};

/**
 * Get routines suitable for beginners
 */
export const getBeginnerRoutines = (): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.difficulty === 'beginner');
};

/**
 * Get quick workout options (under specified minutes, default 30)
 */
export const getQuickRoutines = (maxMinutes: number = 30): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter((r) => r.duration_minutes <= maxMinutes);
};

/**
 * Get bodyweight-only routines (no equipment needed)
 */
export const getBodyweightRoutines = (): WorkoutRoutine[] => {
  return ALL_ROUTINES.filter(
    (r) =>
      r.equipment_needed.length === 1 && r.equipment_needed[0] === 'Bodyweight'
  );
};

/**
 * Get a random routine from a category (useful for variety)
 */
export const getRandomRoutine = (category?: RoutineCategory): WorkoutRoutine | undefined => {
  const routines = category ? getRoutinesByCategory(category) : ALL_ROUTINES;
  if (routines.length === 0) return undefined;
  return routines[Math.floor(Math.random() * routines.length)];
};

/**
 * Calculate total workout volume (sets x exercises)
 */
export const calculateRoutineVolume = (routine: WorkoutRoutine): number => {
  return routine.exercises.reduce((total, exercise) => total + exercise.sets, 0);
};

/**
 * Get estimated total rest time for a routine in seconds
 */
export const getEstimatedRestTime = (routine: WorkoutRoutine): number => {
  const exerciseRest = routine.exercises.reduce(
    (total, exercise) => total + exercise.rest_seconds * exercise.sets,
    0
  );
  const betweenExerciseRest =
    routine.rest_between_exercises_seconds * (routine.exercises.length - 1);
  return exerciseRest + betweenExerciseRest;
};

/**
 * Get routine statistics
 */
export const getRoutineStats = () => ({
  total: ALL_ROUTINES.length,
  strength: STRENGTH_ROUTINES.length,
  cardio: CARDIO_ROUTINES.length,
  hiit: HIIT_ROUTINES.length,
  mobility: MOBILITY_ROUTINES.length,
  full_body: FULL_BODY_ROUTINES.length,
  byDifficulty: {
    beginner: ALL_ROUTINES.filter((r) => r.difficulty === 'beginner').length,
    intermediate: ALL_ROUTINES.filter((r) => r.difficulty === 'intermediate').length,
    advanced: ALL_ROUTINES.filter((r) => r.difficulty === 'advanced').length,
  },
  averageDuration: Math.round(
    ALL_ROUTINES.reduce((sum, r) => sum + r.duration_minutes, 0) / ALL_ROUTINES.length
  ),
});

/**
 * Filter routines with multiple criteria
 */
export const filterRoutines = (filters: {
  category?: RoutineCategory;
  difficulty?: RoutineDifficulty;
  maxDuration?: number;
  muscle?: string;
  tag?: string;
  equipment?: string[];
}): WorkoutRoutine[] => {
  let results = [...ALL_ROUTINES];

  if (filters.category) {
    results = results.filter((r) => r.category === filters.category);
  }

  if (filters.difficulty) {
    results = results.filter((r) => r.difficulty === filters.difficulty);
  }

  if (filters.maxDuration) {
    results = results.filter((r) => r.duration_minutes <= filters.maxDuration!);
  }

  if (filters.muscle) {
    results = results.filter((r) =>
      r.target_muscles.some((m) => m.toLowerCase().includes(filters.muscle!.toLowerCase()))
    );
  }

  if (filters.tag) {
    results = results.filter((r) => r.tags.includes(filters.tag!.toLowerCase()));
  }

  if (filters.equipment && filters.equipment.length > 0) {
    const normalizedEquipment = filters.equipment.map((e) => e.toLowerCase());
    results = results.filter((r) =>
      r.equipment_needed.every(
        (needed) =>
          normalizedEquipment.some((available) => available.includes(needed.toLowerCase())) ||
          needed.toLowerCase() === 'bodyweight'
      )
    );
  }

  return results;
};
