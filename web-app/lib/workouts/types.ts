// Workout routine type definitions
// Used for pre-built workout templates that can be assigned to users

/**
 * Weight suggestion for exercises
 * - bodyweight: No external weight needed
 * - light: 30-50% of max, focus on form and endurance
 * - moderate: 60-75% of max, hypertrophy range
 * - heavy: 80-90% of max, strength focus
 * - max: 90%+ of max, powerlifting/PR attempts
 */
export type WeightSuggestion = 'bodyweight' | 'light' | 'moderate' | 'heavy' | 'max';

/**
 * Workout routine categories
 */
export type RoutineCategory = 'strength' | 'cardio' | 'hiit' | 'mobility' | 'full_body';

/**
 * Difficulty levels for workout routines
 */
export type RoutineDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Individual exercise within a routine
 */
export interface RoutineExercise {
  /** Exercise name */
  name: string;
  /** Number of sets to perform */
  sets: number;
  /** Reps or duration - e.g., "8-12" for reps, "30 sec" for timed exercises */
  reps: string;
  /** Suggested weight/intensity level */
  weight_suggestion?: WeightSuggestion;
  /** Rest period after each set in seconds */
  rest_seconds: number;
  /** Additional notes for form or execution */
  notes?: string;
  /** Alternative exercises if equipment unavailable or for variety */
  alternatives?: string[];
}

/**
 * Complete workout routine definition
 */
export interface WorkoutRoutine {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description of the routine */
  description: string;
  /** Primary category */
  category: RoutineCategory;
  /** Difficulty level */
  difficulty: RoutineDifficulty;
  /** Estimated duration in minutes */
  duration_minutes: number;
  /** Equipment required for this routine */
  equipment_needed: string[];
  /** Primary muscle groups targeted */
  target_muscles: string[];
  /** List of exercises in order */
  exercises: RoutineExercise[];
  /** Default rest between exercises in seconds */
  rest_between_exercises_seconds: number;
  /** Optional warmup instructions */
  warmup?: string[];
  /** Optional cooldown instructions */
  cooldown?: string[];
  /** Additional notes or tips */
  notes?: string;
  /** Searchable tags */
  tags: string[];
}

/**
 * Equipment available in home gym
 * Used for filtering routines
 */
export const HOME_GYM_EQUIPMENT = [
  'Adjustable Dumbbells',
  'Squat Rack',
  'Safety Bars',
  'Incline Bench',
  'Flat Bench',
  'Olympic Barbell',
  'Rowing Machine',
  'Bodyweight',
] as const;

export type HomeGymEquipment = (typeof HOME_GYM_EQUIPMENT)[number];

/**
 * Muscle groups for categorization
 */
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body',
  'Cardiovascular',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
