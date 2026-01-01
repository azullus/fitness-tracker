// Cardio Routines
// Focused on cardiovascular endurance using rowing machine and bodyweight exercises

import type { WorkoutRoutine } from './types';

export const CARDIO_ROUTINES: WorkoutRoutine[] = [
  // ============================================
  // ROWING MACHINE FOCUSED
  // ============================================
  {
    id: 'cardio-rowing-steady-state',
    name: 'Steady State Rowing',
    description:
      'Low-intensity steady state (LISS) cardio on the rowing machine. Great for building aerobic base and active recovery.',
    category: 'cardio',
    difficulty: 'beginner',
    duration_minutes: 30,
    equipment_needed: ['Rowing Machine'],
    target_muscles: ['Cardiovascular', 'Back', 'Core'],
    rest_between_exercises_seconds: 0,
    warmup: ['Light rowing - 3 minutes at easy pace', 'Arm circles and leg swings - 1 minute'],
    exercises: [
      {
        name: 'Steady State Row',
        sets: 1,
        reps: '25 min',
        weight_suggestion: 'light',
        rest_seconds: 0,
        notes:
          'Maintain 18-22 strokes per minute. Heart rate at 60-70% max. Focus on technique: legs-back-arms, arms-back-legs.',
        alternatives: ['Walking', 'Cycling'],
      },
    ],
    cooldown: [
      'Easy rowing - 2 minutes decreasing pace',
      'Quad stretch - 30 seconds each',
      'Hamstring stretch - 30 seconds each',
      'Lat stretch - 30 seconds each side',
    ],
    notes:
      'Target heart rate zone 2. You should be able to hold a conversation. Great for fat burning and recovery between intense sessions.',
    tags: ['cardio', 'rowing', 'liss', 'endurance', 'recovery', 'beginner'],
  },

  {
    id: 'cardio-rowing-intervals',
    name: 'Rowing Intervals',
    description:
      'Structured interval training on the rowing machine. Builds cardiovascular capacity and rowing power.',
    category: 'cardio',
    difficulty: 'intermediate',
    duration_minutes: 25,
    equipment_needed: ['Rowing Machine'],
    target_muscles: ['Cardiovascular', 'Back', 'Core', 'Quadriceps'],
    rest_between_exercises_seconds: 0,
    warmup: [
      'Easy rowing - 3 minutes',
      '3 x 30-second pickups with 30 seconds easy between',
      'Dynamic stretches - 2 minutes',
    ],
    exercises: [
      {
        name: 'Rowing Interval Set 1',
        sets: 4,
        reps: '500m',
        weight_suggestion: 'moderate',
        rest_seconds: 90,
        notes:
          'Row 500m at 80% effort, rest 90 seconds. Target pace: your 2K time + 10-15 seconds per 500m.',
        alternatives: ['2-minute hard row'],
      },
      {
        name: 'Rowing Interval Set 2',
        sets: 4,
        reps: '250m',
        weight_suggestion: 'heavy',
        rest_seconds: 60,
        notes: 'Row 250m at 90% effort, rest 60 seconds. Push the power on each stroke.',
        alternatives: ['1-minute hard row'],
      },
    ],
    cooldown: [
      'Easy rowing - 3 minutes',
      'Full body stretch - 3 minutes',
      'Focus on hips, lats, and hamstrings',
    ],
    notes: 'Track your splits and try to keep them consistent across intervals. Great for improving 2K times.',
    tags: ['cardio', 'rowing', 'intervals', 'endurance', 'intermediate'],
  },

  {
    id: 'cardio-rowing-pyramid',
    name: 'Rowing Pyramid',
    description:
      'Progressive rowing workout that builds up then down in distance. Tests mental and physical endurance.',
    category: 'cardio',
    difficulty: 'advanced',
    duration_minutes: 40,
    equipment_needed: ['Rowing Machine'],
    target_muscles: ['Cardiovascular', 'Back', 'Core', 'Quadriceps', 'Glutes'],
    rest_between_exercises_seconds: 60,
    warmup: [
      'Easy rowing - 5 minutes',
      '3 x 20 strokes at increasing intensity',
      'Dynamic stretches focusing on hips and shoulders',
    ],
    exercises: [
      {
        name: 'Row 250m',
        sets: 1,
        reps: '250m',
        weight_suggestion: 'moderate',
        rest_seconds: 30,
        notes: 'Moderate pace, focus on form',
      },
      {
        name: 'Row 500m',
        sets: 1,
        reps: '500m',
        weight_suggestion: 'moderate',
        rest_seconds: 60,
        notes: 'Build into stronger pace',
      },
      {
        name: 'Row 750m',
        sets: 1,
        reps: '750m',
        weight_suggestion: 'moderate',
        rest_seconds: 90,
        notes: 'Maintain consistent splits',
      },
      {
        name: 'Row 1000m',
        sets: 1,
        reps: '1000m',
        weight_suggestion: 'heavy',
        rest_seconds: 120,
        notes: 'Peak effort piece, push hard',
      },
      {
        name: 'Row 750m',
        sets: 1,
        reps: '750m',
        weight_suggestion: 'moderate',
        rest_seconds: 90,
        notes: 'Coming down, maintain form',
      },
      {
        name: 'Row 500m',
        sets: 1,
        reps: '500m',
        weight_suggestion: 'moderate',
        rest_seconds: 60,
        notes: 'Stay strong',
      },
      {
        name: 'Row 250m',
        sets: 1,
        reps: '250m',
        weight_suggestion: 'heavy',
        rest_seconds: 0,
        notes: 'Sprint finish, leave it all on the erg',
      },
    ],
    cooldown: [
      'Very easy rowing - 5 minutes',
      'Walk around and shake out legs',
      'Full body stretch routine - 5 minutes',
    ],
    notes: 'Total rowing distance: 4,000m. Track your total time and try to beat it next session.',
    tags: ['cardio', 'rowing', 'pyramid', 'endurance', 'advanced', 'challenge'],
  },

  // ============================================
  // CIRCUIT CARDIO (NO ROWING MACHINE)
  // ============================================
  {
    id: 'cardio-bodyweight-circuit',
    name: 'Bodyweight Cardio Circuit',
    description:
      'Equipment-free cardio circuit using just bodyweight. Great when the rowing machine is unavailable or for variety.',
    category: 'cardio',
    difficulty: 'beginner',
    duration_minutes: 25,
    equipment_needed: ['Bodyweight'],
    target_muscles: ['Cardiovascular', 'Full Body'],
    rest_between_exercises_seconds: 15,
    warmup: [
      'March in place - 1 minute',
      'Arm circles - 30 seconds',
      'Leg swings - 10 each leg',
      'Bodyweight squats - 10 reps',
    ],
    exercises: [
      {
        name: 'Jumping Jacks',
        sets: 3,
        reps: '45 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Full range of motion, arms overhead',
        alternatives: ['Step Jacks', 'Seal Jacks'],
      },
      {
        name: 'High Knees',
        sets: 3,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Drive knees up, pump arms',
        alternatives: ['Marching in Place'],
      },
      {
        name: 'Butt Kicks',
        sets: 3,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Quick feet, heels touch glutes',
        alternatives: ['Jogging in Place'],
      },
      {
        name: 'Squat Jumps',
        sets: 3,
        reps: '15',
        weight_suggestion: 'bodyweight',
        rest_seconds: 20,
        notes: 'Land soft, explode up',
        alternatives: ['Bodyweight Squats'],
      },
      {
        name: 'Mountain Climbers',
        sets: 3,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Keep hips level, drive knees to chest',
        alternatives: ['Plank Jacks'],
      },
      {
        name: 'Skaters',
        sets: 3,
        reps: '20 total',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Lateral bound, touch back foot behind',
        alternatives: ['Side Steps'],
      },
    ],
    cooldown: ['Walk in place - 2 minutes', 'Deep breathing - 1 minute', 'Full body stretch - 3 minutes'],
    notes:
      'Complete all exercises in circuit fashion (one after another). Rest 90 seconds between rounds. 3 total rounds.',
    tags: ['cardio', 'bodyweight', 'circuit', 'no-equipment', 'beginner'],
  },

  {
    id: 'cardio-mixed-endurance',
    name: 'Mixed Endurance Session',
    description:
      'Combines rowing with bodyweight exercises for a varied endurance workout. Prevents boredom and works multiple energy systems.',
    category: 'cardio',
    difficulty: 'intermediate',
    duration_minutes: 35,
    equipment_needed: ['Rowing Machine', 'Bodyweight'],
    target_muscles: ['Cardiovascular', 'Full Body'],
    rest_between_exercises_seconds: 30,
    warmup: [
      'Easy rowing - 3 minutes',
      'Bodyweight squats - 15 reps',
      'Push-ups - 10 reps',
      'Arm circles - 20 each direction',
    ],
    exercises: [
      {
        name: 'Rowing Block 1',
        sets: 1,
        reps: '5 min',
        weight_suggestion: 'moderate',
        rest_seconds: 30,
        notes: 'Moderate pace, 22-24 strokes per minute',
      },
      {
        name: 'Push-ups',
        sets: 1,
        reps: '15',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Immediate transition from rower',
      },
      {
        name: 'Bodyweight Squats',
        sets: 1,
        reps: '20',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Keep moving',
      },
      {
        name: 'Rowing Block 2',
        sets: 1,
        reps: '5 min',
        weight_suggestion: 'moderate',
        rest_seconds: 30,
        notes: 'Slightly higher intensity than block 1',
      },
      {
        name: 'Burpees',
        sets: 1,
        reps: '10',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Full burpee with jump',
        alternatives: ['Squat Thrusts'],
      },
      {
        name: 'Plank',
        sets: 1,
        reps: '45 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Catch your breath while holding',
      },
      {
        name: 'Rowing Block 3',
        sets: 1,
        reps: '5 min',
        weight_suggestion: 'moderate',
        rest_seconds: 30,
        notes: 'Final push, increase pace for last minute',
      },
      {
        name: 'Mountain Climbers',
        sets: 1,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Fast pace finish',
      },
    ],
    cooldown: [
      'Easy rowing - 3 minutes at very low intensity',
      'Walk around - 1 minute',
      'Full body stretch focusing on worked areas - 5 minutes',
    ],
    notes: 'Total workout includes 15 minutes of rowing plus bodyweight intervals. Great for overall conditioning.',
    tags: ['cardio', 'rowing', 'mixed', 'endurance', 'intermediate', 'variety'],
  },

  {
    id: 'cardio-rowing-2k-test',
    name: '2K Rowing Test',
    description:
      'The classic 2000m rowing test. A benchmark workout to measure cardiovascular fitness and rowing power. Use sparingly (monthly at most).',
    category: 'cardio',
    difficulty: 'advanced',
    duration_minutes: 30,
    equipment_needed: ['Rowing Machine'],
    target_muscles: ['Cardiovascular', 'Full Body'],
    rest_between_exercises_seconds: 0,
    warmup: [
      'Easy rowing - 5 minutes',
      '3 x 10 strokes at race pace with 1 minute easy between',
      'Dynamic stretches - 2 minutes',
      'Mental preparation - visualize your race plan',
    ],
    exercises: [
      {
        name: '2000m Row',
        sets: 1,
        reps: '2000m',
        weight_suggestion: 'max',
        rest_seconds: 0,
        notes:
          'Pacing strategy: Start 2-3 seconds faster than target, settle into pace for 1000m, negative split the last 750m, sprint final 250m. Target: sub-7:00 excellent, sub-8:00 good.',
        alternatives: ['2K Time Trial'],
      },
    ],
    cooldown: [
      'Very easy rowing - 5 minutes minimum',
      'Walk around and recover - 3 minutes',
      'Hydrate',
      'Full stretch routine - 5 minutes',
      'Log your time for tracking',
    ],
    notes:
      'This is a maximal effort test. Do not attempt more than once per month. Ensure full recovery before and after. Record your time to track fitness improvements.',
    tags: ['cardio', 'rowing', 'test', 'benchmark', 'advanced', '2k'],
  },
];
