// Demo data provider for FITNESS-TRACKER
// Used when Supabase is not configured

import { subDays, format, startOfWeek, addDays } from 'date-fns';
import type {
  Person,
  WeightEntry,
  Workout,
  Exercise,
  Meal,
  PantryItem,
  Recipe,
  RecipeIngredient,
  NutritionInfo,
} from './types';

// Import minimal recipe collection for initial bundle
// Full recipes are lazy-loaded from public/data/recipes/*.json
import { INITIAL_RECIPES } from './recipes-minimal';

// Helper to generate simple IDs
const generateId = (prefix: string, index: number): string =>
  `${prefix}-${String(index).padStart(4, '0')}`;

// Current date reference
const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

// ============================================================================
// DEMO PERSONS - Taylor and Dylan
// ============================================================================
// Calorie calculations using Mifflin-St Jeor equation:
// Taylor: BMR = 10*78.93 + 6.25*155 - 5*30 - 161 = 1447, TDEE (active) = 2496
//         Target for weight loss with cardio: ~1900 cal
// Dylan:  BMR = 10*111.13 + 6.25*178 - 5*32 + 5 = 2069, TDEE (active) = 3569
//         Target for powerlifting maintenance: ~3400 cal
export const DEMO_PERSONS: Person[] = [
  {
    id: 'person-taylor',
    name: 'Taylor',
    gender: 'female',
    age: 30,
    height: 155, // cm (5'1")
    weight: 174, // lbs
    bmi: 32.7, // 174 lbs at 5'1"
    dailyCalorieTarget: 1900, // Moderate deficit for cardio-focused weight loss
    training_focus: 'cardio',
    workoutDaysPerWeek: 5,
    householdId: 'household-demo',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'person-dylan',
    name: 'Dylan',
    gender: 'male',
    age: 32,
    height: 178, // cm (5'10")
    weight: 245, // lbs
    bmi: 34.9, // 245 lbs at 5'10"
    dailyCalorieTarget: 3400, // High intake for powerlifting performance
    training_focus: 'powerlifting',
    workoutDaysPerWeek: 4,
    householdId: 'household-demo',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// DEMO WEIGHT ENTRIES - Last 30 days for both persons
// ============================================================================
// Taylor: Starting at ~177 lbs, gradual weight loss trend (-0.5 lb/week avg) with daily fluctuation
// Dylan: Starting at ~247 lbs, slight weight loss trend (-0.25 lb/week avg) with daily fluctuation
export const DEMO_WEIGHT_ENTRIES: WeightEntry[] = (() => {
  const entries: WeightEntry[] = [];

  // Taylor's weight journey: gradual loss from ~177 to ~174 lbs over 30 days
  // Daily fluctuation of +/- 1-2 lbs is normal due to water, sodium, etc.
  const taylorStartWeight = 177.2;
  const taylorWeeklyLoss = 0.5; // lbs per week

  // Dylan's weight journey: maintaining/slight loss from ~247 to ~245 lbs
  // Heavier individuals have larger daily fluctuations (+/- 2-3 lbs)
  const dylanStartWeight = 247.4;
  const dylanWeeklyLoss = 0.25; // lbs per week

  // Seed for consistent "random" variations
  const taylorVariations = [
    0.8, -0.4, 1.2, -0.8, 0.2, -1.0, 0.6, -0.2, 1.4, -0.6,
    0.4, -1.2, 0.8, 0.0, -0.4, 1.0, -0.8, 0.6, -1.4, 0.2,
    -0.6, 1.2, -0.2, 0.8, -1.0, 0.4, -0.4, 1.0, -0.8, 0.0
  ];

  const dylanVariations = [
    1.2, -1.8, 2.4, -0.6, 1.0, -2.2, 1.6, -0.8, 2.0, -1.4,
    0.8, -2.0, 1.4, 0.4, -1.0, 2.2, -1.6, 1.2, -2.4, 0.6,
    -1.2, 2.0, -0.4, 1.8, -1.8, 0.8, -0.6, 1.6, -2.0, 0.2
  ];

  // Notes for variety
  const taylorNotes = [
    'Morning weigh-in', 'After HIIT class', 'Ate salty dinner last night',
    'Well hydrated', 'Feeling good!', 'Post-cardio', 'Rest day',
    'Early morning', 'Before breakfast', 'After spin class'
  ];

  const dylanNotes = [
    'Post-workout weigh-in', 'Morning before gym', 'Heavy squat day yesterday',
    'Leg day pump', 'Rest day', 'After deadlift session', 'Pre-workout',
    'Feeling strong', 'Good training week', 'Competition prep'
  ];

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayIndex = 29 - i;
    const weeksIn = dayIndex / 7;

    // Calculate trend weight with daily variation
    const taylorTrendWeight = taylorStartWeight - (weeksIn * taylorWeeklyLoss);
    const taylorWeight = Math.round((taylorTrendWeight + taylorVariations[dayIndex]) * 10) / 10;

    const dylanTrendWeight = dylanStartWeight - (weeksIn * dylanWeeklyLoss);
    const dylanWeight = Math.round((dylanTrendWeight + dylanVariations[dayIndex]) * 10) / 10;

    // Add notes occasionally (every 3rd day or so)
    const taylorNote = dayIndex % 3 === 0 ? taylorNotes[Math.floor(dayIndex / 3) % taylorNotes.length] : undefined;
    const dylanNote = dayIndex % 3 === 0 ? dylanNotes[Math.floor(dayIndex / 3) % dylanNotes.length] : undefined;

    // Taylor's entry
    entries.push({
      id: generateId('weight-taylor', dayIndex),
      person_id: 'person-taylor',
      date: dateStr,
      weight_lbs: taylorWeight,
      notes: taylorNote,
      created_at: `${dateStr}T06:30:00Z`,
    });

    // Dylan's entry
    entries.push({
      id: generateId('weight-dylan', dayIndex),
      person_id: 'person-dylan',
      date: dateStr,
      weight_lbs: dylanWeight,
      notes: dylanNote,
      created_at: `${dateStr}T07:00:00Z`,
    });
  }

  return entries;
})();

// ============================================================================
// DEMO WORKOUTS - Last 30 days of workout history
// ============================================================================
// Taylor: Cardio-focused (5 days/week) - HIIT, spin, running, dance, yoga
// Dylan: Powerlifting-focused (4 days/week) - squat, bench, deadlift, accessories
export const DEMO_WORKOUTS: Workout[] = (() => {
  const workouts: Workout[] = [];
  let taylorWorkoutId = 1;
  let dylanWorkoutId = 1;

  // Taylor's weekly workout schedule (cardio focus)
  // Mon: HIIT, Tue: Spin, Wed: Rest, Thu: Running, Fri: Dance Cardio, Sat: Yoga, Sun: Rest
  const taylorSchedule = [
    {
      day: 1, // Monday
      type: 'HIIT + Core',
      exercises: [
        { name: 'Jump Rope', sets: 5, reps: 60, notes: '60 seconds each set' },
        { name: 'Burpees', sets: 4, reps: 12, rpe: 8 },
        { name: 'Mountain Climbers', sets: 4, reps: 30, rpe: 7 },
        { name: 'High Knees', sets: 4, reps: 40, rpe: 7 },
        { name: 'Plank Hold', sets: 3, reps: 60, notes: '60 seconds each' },
        { name: 'Russian Twists', sets: 3, reps: 20, weight_lbs: 12, rpe: 6 },
      ],
      duration: 45,
      intensity: 'high' as const,
    },
    {
      day: 2, // Tuesday
      type: 'Spin Class',
      exercises: [
        { name: 'Stationary Bike Intervals', sets: 1, reps: 45, notes: '45 min class' },
        { name: 'Standing Climb', sets: 6, reps: 3, notes: '3 min intervals' },
        { name: 'Sprints', sets: 8, reps: 30, notes: '30 sec each' },
      ],
      duration: 50,
      intensity: 'high' as const,
    },
    {
      day: 4, // Thursday
      type: 'Treadmill Running',
      exercises: [
        { name: 'Warm-up Walk', sets: 1, reps: 5, notes: '5 min' },
        { name: 'Interval Running', sets: 6, reps: 3, notes: '3 min run / 1 min walk' },
        { name: 'Incline Walk', sets: 1, reps: 10, notes: '10 min at 10% incline' },
        { name: 'Cool Down', sets: 1, reps: 5, notes: '5 min' },
      ],
      duration: 40,
      intensity: 'medium' as const,
    },
    {
      day: 5, // Friday
      type: 'Dance Cardio',
      exercises: [
        { name: 'Zumba Warm-up', sets: 1, reps: 10, notes: '10 min' },
        { name: 'Latin Dance Moves', sets: 1, reps: 25, notes: '25 min high intensity' },
        { name: 'Hip Hop Section', sets: 1, reps: 15, notes: '15 min' },
        { name: 'Cool Down Stretch', sets: 1, reps: 5, notes: '5 min' },
      ],
      duration: 55,
      intensity: 'high' as const,
    },
    {
      day: 6, // Saturday
      type: 'Yoga + Mobility',
      exercises: [
        { name: 'Sun Salutations', sets: 5, reps: 1, notes: 'Flow sequence' },
        { name: 'Warrior Series', sets: 3, reps: 1, notes: 'Hold 30 sec each' },
        { name: 'Hip Openers', sets: 1, reps: 10, notes: '10 min' },
        { name: 'Pigeon Pose', sets: 2, reps: 90, notes: '90 sec each side' },
        { name: 'Savasana', sets: 1, reps: 5, notes: '5 min relaxation' },
      ],
      duration: 60,
      intensity: 'low' as const,
    },
  ];

  // Dylan's weekly workout schedule (powerlifting focus)
  // Mon: Squat, Tue: Bench, Wed: Rest, Thu: Deadlift, Fri: Accessories, Sat-Sun: Rest
  const dylanSchedule = [
    {
      day: 1, // Monday
      type: 'Squat Day',
      exercises: [
        { name: 'Back Squat', sets: 5, reps: 5, weight_lbs: 365, rpe: 8, notes: 'Working sets' },
        { name: 'Pause Squat', sets: 3, reps: 3, weight_lbs: 295, rpe: 7, notes: '2 sec pause' },
        { name: 'Leg Press', sets: 4, reps: 10, weight_lbs: 540, rpe: 7 },
        { name: 'Romanian Deadlift', sets: 3, reps: 10, weight_lbs: 225, rpe: 6 },
        { name: 'Leg Curls', sets: 3, reps: 12, weight_lbs: 100, rpe: 6 },
      ],
      duration: 80,
      intensity: 'high' as const,
    },
    {
      day: 2, // Tuesday
      type: 'Bench Day',
      exercises: [
        { name: 'Bench Press', sets: 5, reps: 5, weight_lbs: 275, rpe: 8, notes: 'Comp grip' },
        { name: 'Close Grip Bench', sets: 3, reps: 8, weight_lbs: 205, rpe: 7 },
        { name: 'Overhead Press', sets: 4, reps: 6, weight_lbs: 155, rpe: 7 },
        { name: 'Incline DB Press', sets: 3, reps: 10, weight_lbs: 75, rpe: 6 },
        { name: 'Tricep Pushdowns', sets: 3, reps: 15, weight_lbs: 70, rpe: 6 },
        { name: 'Face Pulls', sets: 3, reps: 20, weight_lbs: 50, rpe: 5 },
      ],
      duration: 75,
      intensity: 'high' as const,
    },
    {
      day: 4, // Thursday
      type: 'Deadlift Day',
      exercises: [
        { name: 'Conventional Deadlift', sets: 5, reps: 3, weight_lbs: 455, rpe: 8, notes: 'Heavy triples' },
        { name: 'Deficit Deadlift', sets: 3, reps: 5, weight_lbs: 365, rpe: 7, notes: '2 inch deficit' },
        { name: 'Barbell Row', sets: 4, reps: 8, weight_lbs: 205, rpe: 7 },
        { name: 'Weighted Pull-ups', sets: 4, reps: 6, weight_lbs: 45, rpe: 7 },
        { name: 'Barbell Shrugs', sets: 3, reps: 12, weight_lbs: 275, rpe: 6 },
      ],
      duration: 85,
      intensity: 'high' as const,
    },
    {
      day: 5, // Friday
      type: 'Accessories + Volume',
      exercises: [
        { name: 'Front Squat', sets: 4, reps: 6, weight_lbs: 225, rpe: 7 },
        { name: 'Dumbbell Bench', sets: 4, reps: 10, weight_lbs: 85, rpe: 6 },
        { name: 'Lat Pulldown', sets: 4, reps: 12, weight_lbs: 160, rpe: 6 },
        { name: 'Cable Rows', sets: 3, reps: 12, weight_lbs: 150, rpe: 6 },
        { name: 'Hammer Curls', sets: 3, reps: 12, weight_lbs: 40, rpe: 5 },
        { name: 'Ab Wheel', sets: 3, reps: 15, rpe: 6 },
      ],
      duration: 70,
      intensity: 'medium' as const,
    },
  ];

  // Generate 30 days of workouts (going backwards from today)
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = (date.getDay() + 6) % 7 + 1; // 1=Mon, 7=Sun

    // Check if Taylor has a workout scheduled for this day
    const taylorWorkout = taylorSchedule.find(w => w.day === dayOfWeek);
    if (taylorWorkout) {
      // Vary the exercises slightly each week
      const weekNumber = Math.floor((29 - i) / 7);
      const exercises = taylorWorkout.exercises.map(ex => ({
        ...ex,
        // Add slight variation to reps
        reps: ex.reps ? ex.reps + (weekNumber % 2 === 0 ? 0 : 2) : ex.reps,
      }));

      workouts.push({
        id: generateId('workout-taylor', taylorWorkoutId++),
        person_id: 'person-taylor',
        date: dateStr,
        type: taylorWorkout.type,
        exercises,
        duration_minutes: taylorWorkout.duration,
        intensity: taylorWorkout.intensity,
        notes: weekNumber === 3 ? 'Feeling extra energized today!' : undefined,
        completed: i > 0, // Future workouts not completed
        created_at: `${dateStr}T06:00:00Z`,
      });
    }

    // Check if Dylan has a workout scheduled for this day
    const dylanWorkout = dylanSchedule.find(w => w.day === dayOfWeek);
    if (dylanWorkout) {
      // Add progressive overload - increase weight slightly each week
      const weekNumber = Math.floor((29 - i) / 7);
      const exercises = dylanWorkout.exercises.map(ex => ({
        ...ex,
        // Add 5 lbs per week progression for main lifts
        weight_lbs: ex.weight_lbs
          ? ex.weight_lbs + (weekNumber * 5 * (ex.name.includes('Squat') || ex.name.includes('Deadlift') || ex.name.includes('Bench Press') ? 1 : 0))
          : ex.weight_lbs,
      }));

      const notes = [
        weekNumber === 0 ? 'Starting new training block' : undefined,
        weekNumber === 2 ? 'PR on working sets!' : undefined,
        weekNumber === 3 ? 'Deload week' : undefined,
      ].find(n => n);

      workouts.push({
        id: generateId('workout-dylan', dylanWorkoutId++),
        person_id: 'person-dylan',
        date: dateStr,
        type: dylanWorkout.type,
        exercises,
        duration_minutes: dylanWorkout.duration,
        intensity: dylanWorkout.intensity,
        notes,
        completed: i > 0, // Future workouts not completed
        created_at: `${dateStr}T17:00:00Z`,
      });
    }
  }

  return workouts;
})();

// ============================================================================
// DEMO MEALS - Last 30 days of meal history
// ============================================================================
// Meals are shared by household (same meals for both Taylor and Dylan)
// Calorie distribution: Breakfast 25%, Lunch 30%, Dinner 35%, Snacks 10%
export const DEMO_MEALS: Meal[] = (() => {
  const meals: Meal[] = [];
  let mealId = 1;

  // Breakfast options (300-500 cal range, high protein)
  const breakfastOptions = [
    { name: 'Protein Oatmeal Bowl', description: 'Steel cut oats with protein powder, PB Fit, and berries', calories: 450, protein_g: 35, carbs_g: 55, fat_g: 8, fiber_g: 8 },
    { name: 'Egg White Scramble', description: '6 egg whites, whole grain toast, avocado, turkey bacon', calories: 420, protein_g: 38, carbs_g: 30, fat_g: 16, fiber_g: 6 },
    { name: 'Greek Yogurt Parfait', description: 'Plain Greek yogurt, granola, mixed berries, honey drizzle', calories: 380, protein_g: 28, carbs_g: 48, fat_g: 8, fiber_g: 5 },
    { name: 'Protein Pancakes', description: 'Protein powder pancakes with sugar-free syrup and berries', calories: 460, protein_g: 35, carbs_g: 50, fat_g: 10, fiber_g: 4 },
    { name: 'Breakfast Burrito', description: 'Scrambled eggs, turkey sausage, cheese, peppers in whole wheat wrap', calories: 520, protein_g: 32, carbs_g: 40, fat_g: 24, fiber_g: 5 },
    { name: 'Cottage Cheese Bowl', description: 'Cottage cheese with fresh fruit and a drizzle of honey', calories: 320, protein_g: 28, carbs_g: 35, fat_g: 6, fiber_g: 3 },
    { name: 'Avocado Toast + Eggs', description: 'Whole grain toast, smashed avocado, 2 poached eggs', calories: 440, protein_g: 20, carbs_g: 32, fat_g: 26, fiber_g: 8 },
  ];

  // Lunch options (450-650 cal range)
  const lunchOptions = [
    { name: 'Chicken Rice Bowl', description: 'Grilled chicken breast, white rice, steamed broccoli, teriyaki sauce', calories: 620, protein_g: 45, carbs_g: 65, fat_g: 14, fiber_g: 6 },
    { name: 'Turkey Wrap', description: 'Whole wheat wrap, turkey breast, spinach, tomato, mustard', calories: 380, protein_g: 32, carbs_g: 35, fat_g: 10, fiber_g: 5 },
    { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken, feta, veggies, olive oil dressing', calories: 480, protein_g: 40, carbs_g: 20, fat_g: 28, fiber_g: 6 },
    { name: 'Tuna Stuffed Avocado', description: '2 avocado halves filled with seasoned tuna salad', calories: 420, protein_g: 30, carbs_g: 12, fat_g: 28, fiber_g: 10 },
    { name: 'Beef Tacos', description: '3 soft tacos with lean ground beef, lettuce, tomato, cheese', calories: 580, protein_g: 35, carbs_g: 48, fat_g: 26, fiber_g: 4 },
    { name: 'Salmon Poke Bowl', description: 'Fresh salmon, white rice, cucumber, avocado, edamame', calories: 550, protein_g: 35, carbs_g: 55, fat_g: 20, fiber_g: 6 },
    { name: 'Chicken Quesadilla', description: 'Grilled chicken, cheese, peppers in whole wheat tortilla', calories: 520, protein_g: 38, carbs_g: 42, fat_g: 22, fiber_g: 4 },
  ];

  // Dinner options (500-750 cal range)
  const dinnerOptions = [
    { name: 'Salmon with Quinoa', description: 'Baked salmon, quinoa pilaf, roasted asparagus', calories: 580, protein_g: 42, carbs_g: 45, fat_g: 22, fiber_g: 7 },
    { name: 'Beef Stir Fry', description: 'Lean beef strips, mixed vegetables, white rice, soy sauce', calories: 650, protein_g: 40, carbs_g: 70, fat_g: 18, fiber_g: 5 },
    { name: 'Grilled Chicken & Sweet Potato', description: 'Herb grilled chicken breast, baked sweet potato, green beans', calories: 520, protein_g: 45, carbs_g: 50, fat_g: 12, fiber_g: 8 },
    { name: 'Turkey Meatballs & Pasta', description: 'Turkey meatballs, whole wheat pasta, marinara sauce, parmesan', calories: 680, protein_g: 42, carbs_g: 75, fat_g: 22, fiber_g: 8 },
    { name: 'Shrimp Scampi', description: 'Garlic butter shrimp over linguine with lemon and parsley', calories: 580, protein_g: 35, carbs_g: 60, fat_g: 22, fiber_g: 4 },
    { name: 'Chicken Fajitas', description: 'Grilled chicken strips, peppers, onions with rice and beans', calories: 620, protein_g: 40, carbs_g: 65, fat_g: 20, fiber_g: 10 },
    { name: 'Pork Tenderloin', description: 'Herb roasted pork, mashed potatoes, roasted Brussels sprouts', calories: 560, protein_g: 38, carbs_g: 48, fat_g: 22, fiber_g: 6 },
    { name: 'Baked Cod with Vegetables', description: 'Lemon herb cod, roasted potatoes, steamed broccoli', calories: 480, protein_g: 35, carbs_g: 45, fat_g: 14, fiber_g: 6 },
  ];

  // Snack options (150-350 cal range)
  const snackOptions = [
    { name: 'BUILT Marshmallow Bar + Greek Yogurt', description: 'Protein bar with plain Greek yogurt', calories: 320, protein_g: 35, carbs_g: 28, fat_g: 8, fiber_g: 2 },
    { name: 'Pepperoni Sticks + Cheese', description: 'Pepperoni sticks with string cheese', calories: 280, protein_g: 18, carbs_g: 4, fat_g: 22, fiber_g: 0 },
    { name: 'Apple + Almond Butter', description: 'Sliced apple with 2 tbsp almond butter', calories: 250, protein_g: 6, carbs_g: 28, fat_g: 14, fiber_g: 5 },
    { name: 'Protein Shake', description: 'Whey protein with almond milk and PB Fit', calories: 220, protein_g: 30, carbs_g: 12, fat_g: 5, fiber_g: 2 },
    { name: 'Hard Boiled Eggs', description: '3 hard boiled eggs with salt and pepper', calories: 210, protein_g: 18, carbs_g: 2, fat_g: 15, fiber_g: 0 },
    { name: 'Trail Mix', description: 'Mixed nuts, dried fruit, dark chocolate chips', calories: 280, protein_g: 8, carbs_g: 28, fat_g: 16, fiber_g: 3 },
    { name: 'Cottage Cheese + Berries', description: '1 cup cottage cheese with fresh berries', calories: 180, protein_g: 24, carbs_g: 14, fat_g: 2, fiber_g: 2 },
  ];

  // Generate 30 days of meals
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayIndex = 29 - i;

    // Pick meals based on day index for variety
    const breakfast = breakfastOptions[dayIndex % breakfastOptions.length];
    const lunch = lunchOptions[dayIndex % lunchOptions.length];
    const dinner = dinnerOptions[dayIndex % dinnerOptions.length];
    const snack = snackOptions[dayIndex % snackOptions.length];

    // Breakfast
    meals.push({
      id: generateId('meal', mealId++),
      date: dateStr,
      meal_type: 'breakfast',
      ...breakfast,
      created_at: `${dateStr}T07:30:00Z`,
    });

    // Lunch
    meals.push({
      id: generateId('meal', mealId++),
      date: dateStr,
      meal_type: 'lunch',
      ...lunch,
      created_at: `${dateStr}T12:30:00Z`,
    });

    // Snack (afternoon)
    meals.push({
      id: generateId('meal', mealId++),
      date: dateStr,
      meal_type: 'snack',
      ...snack,
      created_at: `${dateStr}T15:30:00Z`,
    });

    // Dinner
    meals.push({
      id: generateId('meal', mealId++),
      date: dateStr,
      meal_type: 'dinner',
      ...dinner,
      created_at: `${dateStr}T18:30:00Z`,
    });
  }

  return meals;
})();

// ============================================================================
// DEMO PANTRY ITEMS - 15-20 items across categories
// ============================================================================
export const DEMO_PANTRY_ITEMS: PantryItem[] = [
  // Proteins
  {
    id: generateId('pantry', 1),
    name: 'Chicken Breast (Frozen)',
    category: 'Proteins',
    quantity: 4,
    unit: 'lbs',
    location: 'Freezer',
    low_stock_threshold: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 2),
    name: 'Ground Beef (Lean)',
    category: 'Proteins',
    quantity: 2,
    unit: 'lbs',
    location: 'Freezer',
    low_stock_threshold: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 3),
    name: 'Salmon Fillets',
    category: 'Proteins',
    quantity: 1,
    unit: 'lbs',
    location: 'Freezer',
    low_stock_threshold: 1,
    notes: 'Low stock - add to grocery list',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 4),
    name: 'Turkey Breast (Deli)',
    category: 'Proteins',
    quantity: 0.5,
    unit: 'lbs',
    location: 'Fridge',
    low_stock_threshold: 0.5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },

  // Dairy
  {
    id: generateId('pantry', 5),
    name: 'Greek Yogurt (Plain)',
    category: 'Dairy',
    quantity: 2,
    unit: 'containers',
    location: 'Fridge',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 6),
    name: 'Eggs',
    category: 'Dairy',
    quantity: 18,
    unit: 'count',
    location: 'Fridge',
    low_stock_threshold: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 7),
    name: 'Cottage Cheese',
    category: 'Dairy',
    quantity: 1,
    unit: 'container',
    location: 'Fridge',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },

  // Grains
  {
    id: generateId('pantry', 8),
    name: 'White Rice',
    category: 'Grains',
    quantity: 5,
    unit: 'lbs',
    location: 'Pantry',
    low_stock_threshold: 2,
    notes: 'Costco bag',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 9),
    name: 'Steel Cut Oats',
    category: 'Grains',
    quantity: 2,
    unit: 'lbs',
    location: 'Pantry',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 10),
    name: 'Whole Grain Bread',
    category: 'Grains',
    quantity: 1,
    unit: 'loaf',
    location: 'Counter',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },

  // Produce
  {
    id: generateId('pantry', 11),
    name: 'Broccoli',
    category: 'Produce',
    quantity: 2,
    unit: 'heads',
    location: 'Fridge',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 12),
    name: 'Spinach',
    category: 'Produce',
    quantity: 1,
    unit: 'bag',
    location: 'Fridge',
    low_stock_threshold: 1,
    expires_at: format(addDays(today, 5), 'yyyy-MM-dd'),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 13),
    name: 'Yellow Kiwi',
    category: 'Produce',
    quantity: 0,
    unit: 'count',
    location: 'Counter',
    low_stock_threshold: 3,
    notes: 'High in potassium, great snack',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },

  // Frozen
  {
    id: generateId('pantry', 14),
    name: 'Mixed Berries',
    category: 'Frozen',
    quantity: 1,
    unit: 'bag',
    location: 'Freezer',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 15),
    name: 'Frozen Vegetables (Stir Fry Mix)',
    category: 'Frozen',
    quantity: 2,
    unit: 'bags',
    location: 'Freezer',
    low_stock_threshold: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },

  // Condiments
  {
    id: generateId('pantry', 16),
    name: 'PB Fit (Powdered Peanut Butter)',
    category: 'Condiments',
    quantity: 0.5,
    unit: 'jar',
    location: 'Pantry',
    low_stock_threshold: 0.5,
    notes: 'Running low',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 17),
    name: 'Soy Sauce (Low Sodium)',
    category: 'Condiments',
    quantity: 1,
    unit: 'bottle',
    location: 'Pantry',
    low_stock_threshold: 0.5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 18),
    name: 'Protein Powder (Whey)',
    category: 'Supplements',
    quantity: 2,
    unit: 'lbs',
    location: 'Pantry',
    low_stock_threshold: 1,
    notes: 'Chocolate flavor',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 19),
    name: 'BUILT Marshmallow Bars',
    category: 'Snacks',
    quantity: 8,
    unit: 'bars',
    location: 'Pantry',
    low_stock_threshold: 4,
    notes: 'Costco box',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
  {
    id: generateId('pantry', 20),
    name: 'Pepperoni Sticks',
    category: 'Snacks',
    quantity: 6,
    unit: 'count',
    location: 'Fridge',
    low_stock_threshold: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: todayStr,
  },
];

// ============================================================================
// DEMO RECIPES - Using minimal recipe collection for initial bundle
// ============================================================================
// Minimal recipes are bundled (12 recipes, ~4KB)
// Full 300+ recipe collection is lazy-loaded from public/data/recipes/*.json
// Use fetchAllRecipes() from lib/recipe-loader for the complete set
export const DEMO_RECIPES: Recipe[] = INITIAL_RECIPES;

// Legacy recipes kept for reference (now using expanded collection above)
const LEGACY_RECIPES: Recipe[] = [
  {
    id: generateId('recipe', 1),
    name: 'High Protein Oatmeal Bowl',
    description: 'Perfect pre-workout breakfast packed with protein and complex carbs',
    category: 'breakfast',
    prep_time_minutes: 5,
    cook_time_minutes: 10,
    servings: 2,
    baseServings: 2,
    difficulty: 'easy',
    ingredients: [
      { item: 'Steel Cut Oats', quantity: 1, unit: 'cup' },
      { item: 'Whey Protein Powder', quantity: 2, unit: 'scoops' },
      { item: 'PB Fit', quantity: 2, unit: 'tbsp' },
      { item: 'Mixed Berries (Frozen)', quantity: 0.5, unit: 'cup' },
      { item: 'Almond Milk', quantity: 2, unit: 'cups' },
      { item: 'Honey', quantity: 1, unit: 'tbsp', notes: 'optional' },
    ],
    instructions: [
      'Bring almond milk to a boil in a medium saucepan.',
      'Add steel cut oats, reduce heat to low, and simmer for 8-10 minutes, stirring occasionally.',
      'Remove from heat and let cool for 2 minutes.',
      'Stir in protein powder and PB Fit until well combined.',
      'Top with frozen berries and drizzle with honey if desired.',
      'Divide between two bowls and serve immediately.',
    ],
    nutrition: {
      calories: 450,
      protein_g: 35,
      carbs_g: 55,
      fat_g: 8,
      fiber_g: 8,
    },
    macrosPerServing: {
      calories: 225,
      protein: 17,
      carbs: 28,
      fat: 4,
      fiber: 4,
    },
    tags: ['high-protein', 'pre-workout', 'quick'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: generateId('recipe', 2),
    name: 'Chicken Teriyaki Rice Bowl',
    description: 'Simple and satisfying post-workout meal',
    category: 'lunch',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 2,
    baseServings: 2,
    difficulty: 'easy',
    ingredients: [
      { item: 'Chicken Breast', quantity: 1, unit: 'lb' },
      { item: 'White Rice', quantity: 1.5, unit: 'cups', notes: 'uncooked' },
      { item: 'Broccoli', quantity: 2, unit: 'cups', notes: 'florets' },
      { item: 'Soy Sauce (Low Sodium)', quantity: 3, unit: 'tbsp' },
      { item: 'Honey', quantity: 2, unit: 'tbsp' },
      { item: 'Garlic', quantity: 2, unit: 'cloves', notes: 'minced' },
      { item: 'Sesame Seeds', quantity: 1, unit: 'tsp', notes: 'for garnish' },
    ],
    instructions: [
      'Cook white rice according to package directions.',
      'Slice chicken breast into thin strips.',
      'Mix soy sauce, honey, and garlic in a small bowl for teriyaki sauce.',
      'Heat a large skillet over medium-high heat. Cook chicken strips until golden, about 5-6 minutes.',
      'Steam broccoli florets until tender-crisp, about 4-5 minutes.',
      'Pour teriyaki sauce over chicken and cook for 2 more minutes until glazed.',
      'Divide rice between bowls, top with chicken and broccoli.',
      'Garnish with sesame seeds and serve.',
    ],
    nutrition: {
      calories: 620,
      protein_g: 45,
      carbs_g: 65,
      fat_g: 14,
      fiber_g: 6,
    },
    macrosPerServing: {
      calories: 310,
      protein: 23,
      carbs: 33,
      fat: 7,
      fiber: 3,
    },
    tags: ['post-workout', 'meal-prep', 'high-protein'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: generateId('recipe', 3),
    name: 'Beef and Vegetable Stir Fry',
    description: 'Quick weeknight dinner packed with protein and vegetables',
    category: 'dinner',
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    servings: 2,
    baseServings: 2,
    difficulty: 'medium',
    ingredients: [
      { item: 'Lean Beef (Sirloin)', quantity: 0.75, unit: 'lb', notes: 'sliced thin' },
      { item: 'Stir Fry Vegetable Mix', quantity: 3, unit: 'cups' },
      { item: 'White Rice', quantity: 1.5, unit: 'cups', notes: 'uncooked' },
      { item: 'Soy Sauce (Low Sodium)', quantity: 3, unit: 'tbsp' },
      { item: 'Sesame Oil', quantity: 1, unit: 'tbsp' },
      { item: 'Ginger', quantity: 1, unit: 'tsp', notes: 'freshly grated' },
      { item: 'Garlic', quantity: 3, unit: 'cloves', notes: 'minced' },
      { item: 'Cornstarch', quantity: 1, unit: 'tbsp' },
    ],
    instructions: [
      'Cook white rice according to package directions.',
      'Mix soy sauce with cornstarch to create a slurry.',
      'Heat sesame oil in a wok or large skillet over high heat.',
      'Add beef strips and stir fry until browned, about 3-4 minutes. Remove and set aside.',
      'Add vegetables, ginger, and garlic. Stir fry for 4-5 minutes until crisp-tender.',
      'Return beef to the wok, pour soy sauce mixture over everything.',
      'Stir fry for 1-2 minutes until sauce thickens.',
      'Serve over white rice.',
    ],
    nutrition: {
      calories: 650,
      protein_g: 40,
      carbs_g: 70,
      fat_g: 18,
      fiber_g: 5,
    },
    macrosPerServing: {
      calories: 325,
      protein: 20,
      carbs: 35,
      fat: 9,
      fiber: 3,
    },
    tags: ['quick', 'high-protein', 'weeknight'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: generateId('recipe', 4),
    name: 'Egg White Breakfast Scramble',
    description: 'Low-fat, high-protein breakfast for cutting phases',
    category: 'breakfast',
    prep_time_minutes: 5,
    cook_time_minutes: 10,
    servings: 1,
    baseServings: 1,
    difficulty: 'easy',
    ingredients: [
      { item: 'Egg Whites', quantity: 6, unit: 'large' },
      { item: 'Whole Grain Bread', quantity: 2, unit: 'slices' },
      { item: 'Turkey Bacon', quantity: 2, unit: 'strips' },
      { item: 'Avocado', quantity: 0.5, unit: 'medium' },
      { item: 'Spinach', quantity: 1, unit: 'cup' },
      { item: 'Salt and Pepper', quantity: 1, unit: 'pinch' },
    ],
    instructions: [
      'Cook turkey bacon in a non-stick skillet until crispy. Set aside.',
      'In the same skillet, add spinach and cook until wilted, about 1 minute.',
      'Pour egg whites over spinach and scramble until cooked through.',
      'Season with salt and pepper.',
      'Toast whole grain bread and top with sliced avocado.',
      'Serve scramble alongside toast and turkey bacon.',
    ],
    nutrition: {
      calories: 420,
      protein_g: 38,
      carbs_g: 30,
      fat_g: 16,
      fiber_g: 6,
    },
    macrosPerServing: {
      calories: 420,
      protein: 38,
      carbs: 30,
      fat: 16,
      fiber: 6,
    },
    tags: ['low-fat', 'high-protein', 'cutting'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: generateId('recipe', 5),
    name: 'Baked Salmon with Quinoa',
    description: 'Omega-3 rich dinner with complete protein quinoa',
    category: 'dinner',
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    servings: 2,
    baseServings: 2,
    difficulty: 'medium',
    ingredients: [
      { item: 'Salmon Fillets', quantity: 2, unit: 'fillets', notes: '6 oz each' },
      { item: 'Quinoa', quantity: 1, unit: 'cup', notes: 'uncooked' },
      { item: 'Asparagus', quantity: 1, unit: 'bunch' },
      { item: 'Lemon', quantity: 1, unit: 'medium' },
      { item: 'Olive Oil', quantity: 2, unit: 'tbsp' },
      { item: 'Garlic', quantity: 2, unit: 'cloves', notes: 'minced' },
      { item: 'Dill', quantity: 1, unit: 'tbsp', notes: 'fresh, chopped' },
    ],
    instructions: [
      'Preheat oven to 400F (200C).',
      'Rinse quinoa and cook according to package directions.',
      'Place salmon fillets on a lined baking sheet. Season with salt, pepper, and minced garlic.',
      'Drizzle with olive oil and squeeze half the lemon over the salmon.',
      'Toss asparagus with remaining olive oil and place around salmon.',
      'Bake for 15-18 minutes until salmon flakes easily.',
      'Fluff quinoa with a fork and divide between plates.',
      'Top with salmon and asparagus. Garnish with fresh dill and remaining lemon.',
    ],
    nutrition: {
      calories: 580,
      protein_g: 42,
      carbs_g: 45,
      fat_g: 22,
      fiber_g: 7,
    },
    macrosPerServing: {
      calories: 290,
      protein: 21,
      carbs: 23,
      fat: 11,
      fiber: 4,
    },
    tags: ['omega-3', 'heart-healthy', 'high-fiber'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: generateId('recipe', 6),
    name: 'Protein Snack Box',
    description: 'High-protein snack combination perfect for between meals',
    category: 'snack',
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    baseServings: 1,
    difficulty: 'easy',
    ingredients: [
      { item: 'BUILT Marshmallow Bar', quantity: 1, unit: 'bar' },
      { item: 'Greek Yogurt (Plain)', quantity: 0.5, unit: 'cup' },
      { item: 'Pepperoni Sticks', quantity: 2, unit: 'sticks' },
      { item: 'String Cheese', quantity: 1, unit: 'stick' },
    ],
    instructions: [
      'Arrange all items on a plate or in a container.',
      'Can be prepared ahead for meal prep.',
      'Store in refrigerator for up to 3 days.',
    ],
    nutrition: {
      calories: 420,
      protein_g: 40,
      carbs_g: 22,
      fat_g: 18,
      fiber_g: 2,
    },
    macrosPerServing: {
      calories: 420,
      protein: 40,
      carbs: 22,
      fat: 18,
      fiber: 2,
    },
    tags: ['snack', 'high-protein', 'meal-prep', 'no-cook'],
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all demo data as a single object
 */
export const getAllDemoData = () => ({
  persons: DEMO_PERSONS,
  weightEntries: DEMO_WEIGHT_ENTRIES,
  workouts: DEMO_WORKOUTS,
  meals: DEMO_MEALS,
  pantryItems: DEMO_PANTRY_ITEMS,
  recipes: DEMO_RECIPES,
});

/**
 * Check if an item is low in stock
 */
export const isLowStock = (item: PantryItem): boolean => {
  if (item.low_stock_threshold === undefined) return false;
  return item.quantity <= item.low_stock_threshold;
};

/**
 * Get low stock pantry items
 */
export const getLowStockItems = (): PantryItem[] => {
  return DEMO_PANTRY_ITEMS.filter(isLowStock);
};

/**
 * Get workouts for a specific person
 */
export const getWorkoutsByPerson = (personId: string): Workout[] => {
  return DEMO_WORKOUTS.filter((w) => w.person_id === personId);
};

/**
 * Get weight entries for a specific person
 */
export const getWeightEntriesByPerson = (personId: string): WeightEntry[] => {
  return DEMO_WEIGHT_ENTRIES.filter((w) => w.person_id === personId);
};

/**
 * Get meals for a specific date
 */
export const getMealsByDate = (date: string): Meal[] => {
  return DEMO_MEALS.filter((m) => m.date === date);
};

/**
 * Get meals for a specific person and date
 * Note: Demo meals are shared (no person_id), so this just filters by date
 */
export const getMealsByPersonAndDate = (personId: string, date: string): Meal[] => {
  // Demo meals are shared between household members
  // In a real app, you'd filter by person_id as well
  return DEMO_MEALS.filter((m) => m.date === date);
};

/**
 * Get pantry items by category
 */
export const getPantryItemsByCategory = (category: string): PantryItem[] => {
  return DEMO_PANTRY_ITEMS.filter((p) => p.category === category);
};

/**
 * Get recipes by category
 */
export const getRecipesByCategory = (category: Recipe['category']): Recipe[] => {
  return DEMO_RECIPES.filter((r) => r.category === category);
};
