// Mobility and Recovery Routines
// Focused on flexibility, injury prevention, and active recovery

import type { WorkoutRoutine } from './types';

export const MOBILITY_ROUTINES: WorkoutRoutine[] = [
  // ============================================
  // FULL BODY MOBILITY
  // ============================================
  {
    id: 'mobility-full-body-flow',
    name: 'Full Body Mobility Flow',
    description:
      'Comprehensive mobility routine hitting all major joints and muscle groups. Perfect for rest days or morning activation.',
    category: 'mobility',
    difficulty: 'beginner',
    duration_minutes: 25,
    equipment_needed: ['Bodyweight'],
    target_muscles: ['Full Body'],
    rest_between_exercises_seconds: 0,
    warmup: ['Light walking or marching in place - 2 minutes'],
    exercises: [
      {
        name: 'Cat-Cow Stretches',
        sets: 1,
        reps: '10',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Slow and controlled, breathe into each position. Inhale cow, exhale cat.',
      },
      {
        name: 'Thread the Needle',
        sets: 1,
        reps: '8 each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Reach through and rotate, feel the thoracic spine open',
      },
      {
        name: "World's Greatest Stretch",
        sets: 1,
        reps: '5 each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Lunge, elbow to instep, rotate and reach up. Hold each position 2-3 seconds.',
      },
      {
        name: 'Hip Circles',
        sets: 1,
        reps: '10 each direction',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'On hands and knees, make big circles with knee. Opens hip capsule.',
      },
      {
        name: '90/90 Hip Stretch',
        sets: 1,
        reps: '45 sec each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Both legs at 90 degrees. Lean forward over front leg. Switch sides by rotating through center.',
      },
      {
        name: 'Shoulder Pass-Throughs',
        sets: 1,
        reps: '15',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Use a stick, band, or towel. Wide grip, pass over head and behind. Narrow grip over time.',
        alternatives: ['Band Pull-Aparts'],
      },
      {
        name: 'Arm Circles',
        sets: 1,
        reps: '15 each direction',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Small to large circles, forward and backward',
      },
      {
        name: 'Deep Squat Hold',
        sets: 1,
        reps: '2 min total',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Sink into deep squat, use rack or door frame for support if needed. Shift weight side to side.',
      },
      {
        name: 'Standing Forward Fold',
        sets: 1,
        reps: '60 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Let head hang, gentle sway. Bend knees slightly if needed.',
      },
      {
        name: 'Lying Spinal Twist',
        sets: 1,
        reps: '45 sec each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Knees together, drop to one side. Keep shoulders flat on ground.',
      },
    ],
    cooldown: ['Corpse pose with deep breathing - 2 minutes'],
    notes:
      'Move slowly and mindfully. This is not about pushing range of motion but about controlled exploration. Breathe deeply throughout.',
    tags: ['mobility', 'flexibility', 'recovery', 'rest-day', 'beginner', 'full-body'],
  },

  // ============================================
  // LOWER BODY FOCUSED
  // ============================================
  {
    id: 'mobility-lower-body',
    name: 'Lower Body Mobility',
    description:
      'Targeted mobility work for hips, hamstrings, and ankles. Essential for squatters and anyone with desk-job tightness.',
    category: 'mobility',
    difficulty: 'beginner',
    duration_minutes: 20,
    equipment_needed: ['Bodyweight', 'Incline Bench'],
    target_muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    rest_between_exercises_seconds: 0,
    warmup: ['Light walking or marching - 2 minutes', 'Leg swings front to back - 10 each leg'],
    exercises: [
      {
        name: 'Couch Stretch',
        sets: 1,
        reps: '90 sec each leg',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Back knee against wall or bench, front foot flat. Squeeze glute of back leg. Targets hip flexors and quads.',
      },
      {
        name: 'Pigeon Pose',
        sets: 1,
        reps: '90 sec each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Front shin parallel to body (or at angle if tight). Fold forward for deeper stretch. Opens hip external rotators.',
      },
      {
        name: 'Frog Stretch',
        sets: 1,
        reps: '60 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'On hands and knees, knees wide apart. Rock back and forth gently. Opens adductors.',
      },
      {
        name: 'Half Kneeling Hamstring Stretch',
        sets: 1,
        reps: '60 sec each leg',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'One knee down, other leg extended. Hinge at hips toward extended leg. Keep back flat.',
      },
      {
        name: 'Ankle Rocks',
        sets: 1,
        reps: '20 each ankle',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Foot flat, rock knee forward over toes. Use wall for balance. Essential for squat depth.',
      },
      {
        name: 'Calf Stretch',
        sets: 1,
        reps: '45 sec each leg',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Wall stretch with straight leg for gastroc, bent knee for soleus. Do both positions.',
      },
      {
        name: 'Glute Bridge Hold',
        sets: 1,
        reps: '30 sec x 3',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes: 'Squeeze glutes at top. Activates glutes after stretching hip flexors.',
      },
    ],
    cooldown: ["Child's pose - 1 minute", 'Deep breathing - 1 minute'],
    notes:
      'Excellent before or after leg day. Can also do in the evening to counteract sitting all day. Hold stretches at mild tension, not pain.',
    tags: ['mobility', 'lower-body', 'hips', 'flexibility', 'squat-prep', 'beginner'],
  },

  // ============================================
  // UPPER BODY FOCUSED
  // ============================================
  {
    id: 'mobility-upper-body',
    name: 'Upper Body Mobility',
    description:
      'Shoulder, thoracic spine, and upper back mobility work. Essential for pressing movements and posture.',
    category: 'mobility',
    difficulty: 'beginner',
    duration_minutes: 20,
    equipment_needed: ['Bodyweight', 'Squat Rack', 'Adjustable Dumbbells'],
    target_muscles: ['Shoulders', 'Back', 'Chest'],
    rest_between_exercises_seconds: 0,
    warmup: ['Arm circles - 20 each direction', 'Shoulder shrugs - 15 reps'],
    exercises: [
      {
        name: 'Shoulder Pass-Throughs',
        sets: 2,
        reps: '15',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes:
          'Use barbell or band. Wide grip, pass overhead and behind. Progress by narrowing grip.',
      },
      {
        name: 'Wall Slides',
        sets: 2,
        reps: '12',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes:
          'Back against wall, arms in goal post position. Slide arms up overhead keeping contact with wall.',
      },
      {
        name: 'Doorway Chest Stretch',
        sets: 1,
        reps: '45 sec each arm',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Arm at 90 degrees against door frame. Step through to stretch pec. Vary arm height for different pec fibers.',
      },
      {
        name: 'Thread the Needle',
        sets: 1,
        reps: '10 each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'On hands and knees. Reach under and through, rotating thoracic spine. Reach up and open.',
      },
      {
        name: 'Lat Stretch on Rack',
        sets: 1,
        reps: '45 sec each side',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Hold rack at hip height, push hips back and away to stretch lats. Can also do on bench.',
      },
      {
        name: 'Prone Y-T-W Raises',
        sets: 2,
        reps: '8 each position',
        weight_suggestion: 'light',
        rest_seconds: 15,
        notes:
          'Lie face down on bench. Raise arms in Y, T, then W positions. Use very light dumbbells or no weight.',
      },
      {
        name: 'Scapular Push-ups',
        sets: 2,
        reps: '12',
        weight_suggestion: 'bodyweight',
        rest_seconds: 15,
        notes:
          'Plank position, arms locked. Let shoulder blades pinch together, then push apart. Trains scapular mobility.',
      },
      {
        name: 'Wrist Circles and Stretches',
        sets: 1,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Circle wrists both directions. Prayer stretch front and back. Important for pressing movements.',
      },
    ],
    cooldown: [
      'Hang from rack or bar - 30 seconds (decompresses spine)',
      "Child's pose with arms extended - 1 minute",
    ],
    notes:
      'Perfect before pressing days or to counteract computer/phone posture. The wall slide test is also a great shoulder health diagnostic.',
    tags: ['mobility', 'upper-body', 'shoulders', 'thoracic', 'posture', 'beginner'],
  },

  // ============================================
  // ACTIVE RECOVERY
  // ============================================
  {
    id: 'mobility-active-recovery',
    name: 'Active Recovery Session',
    description:
      'Low-intensity movement session to promote blood flow and recovery without taxing the body. Perfect for days after hard training.',
    category: 'mobility',
    difficulty: 'beginner',
    duration_minutes: 30,
    equipment_needed: ['Rowing Machine', 'Bodyweight'],
    target_muscles: ['Full Body', 'Cardiovascular'],
    rest_between_exercises_seconds: 0,
    warmup: ['None needed - start very easy'],
    exercises: [
      {
        name: 'Easy Rowing',
        sets: 1,
        reps: '10 min',
        weight_suggestion: 'light',
        rest_seconds: 0,
        notes:
          'Zone 1-2 heart rate. 18-20 strokes per minute. Should be able to carry on a conversation easily.',
      },
      {
        name: 'Bodyweight Squats',
        sets: 2,
        reps: '15',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Slow and controlled. Focus on full range of motion.',
      },
      {
        name: 'Walking Lunges',
        sets: 2,
        reps: '10 each leg',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'No weight. Focus on balance and controlled movement.',
      },
      {
        name: 'Push-ups (Slow)',
        sets: 2,
        reps: '10',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: '3 seconds down, 3 seconds up. Blood flow without strain.',
      },
      {
        name: 'Band Pull-Aparts or Light Rows',
        sets: 2,
        reps: '15',
        weight_suggestion: 'light',
        rest_seconds: 30,
        notes: 'Very light dumbbell rows if no bands available.',
      },
      {
        name: 'Plank',
        sets: 2,
        reps: '30 sec',
        weight_suggestion: 'bodyweight',
        rest_seconds: 30,
        notes: 'Core activation without fatigue.',
      },
      {
        name: 'Cat-Cow Stretches',
        sets: 1,
        reps: '10',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes: 'Slow spinal movement.',
      },
      {
        name: 'Standing Stretch Series',
        sets: 1,
        reps: '5 min',
        weight_suggestion: 'bodyweight',
        rest_seconds: 0,
        notes:
          'Standing quad stretch, forward fold, side bend, arm across chest - flow through each for 30-60 seconds.',
      },
    ],
    cooldown: [
      'Easy rowing - 3 minutes',
      'Deep breathing - 2 minutes',
      'Optional: self-massage or foam rolling sore areas',
    ],
    notes:
      'The goal is to move blood and feel better without creating additional fatigue. If anything hurts or feels taxing, back off. You should feel better after this than before.',
    tags: ['recovery', 'mobility', 'rest-day', 'low-intensity', 'blood-flow', 'beginner'],
  },
];
