// Demo data provider for FITNESS-TRACKER
// Used when Supabase is not configured

import { subDays, format, addDays } from 'date-fns';
import type {
  Person,
  WeightEntry,
  Workout,
  // Exercise,
  Meal,
  PantryItem,
  Recipe,
  // RecipeIngredient,
  // NutritionInfo,
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
// const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
// const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

// ============================================================================
// DEMO PERSON - Single demo user for testing
// ============================================================================
// Calorie calculations using Mifflin-St Jeor equation:
// Demo User: BMR = 10*81.65 + 6.25*170 - 5*28 - 161 = 1587, TDEE (active) = 2737
//            Target for general fitness: ~2200 cal
export const DEMO_PERSONS: Person[] = [
  {
    id: 'person-demo',
    name: 'Demo User',
    gender: 'female',
    age: 28,
    height: 170, // cm (5'7")
    weight: 180, // lbs
    bmi: 29.4, // 180 lbs at 5'7"
    dailyCalorieTarget: 2200, // Balanced for general fitness
    training_focus: 'mixed',
    workoutDaysPerWeek: 4,
    householdId: 'household-demo',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// DEMO WEIGHT ENTRIES - Last 30 days for both persons
// ============================================================================
// Demo User: Starting at ~180 lbs with realistic daily fluctuation
export const DEMO_WEIGHT_ENTRIES: WeightEntry[] = (() => {
  const entries: WeightEntry[] = [];

  // Demo user weight journey: gradual loss with realistic daily fluctuation
  // Daily fluctuation of +/- 1-2 lbs is normal due to water, sodium, etc.
  const startWeight = 180.0;
  const weeklyLoss = 0.5; // lbs per week

  // Seed for consistent "random" variations
  const variations = [
    0.8, -0.4, 1.2, -0.8, 0.2, -1.0, 0.6, -0.2, 1.4, -0.6,
    0.4, -1.2, 0.8, 0.0, -0.4, 1.0, -0.8, 0.6, -1.4, 0.2,
    -0.6, 1.2, -0.2, 0.8, -1.0, 0.4, -0.4, 1.0, -0.8, 0.0
  ];

  // Notes for variety
  const notes = [
    'Morning weigh-in', 'After workout', 'Ate salty dinner last night',
    'Well hydrated', 'Feeling good!', 'Post-cardio', 'Rest day',
    'Early morning', 'Before breakfast', 'After gym session'
  ];

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayIndex = 29 - i;
    const weeksIn = dayIndex / 7;

    // Calculate trend weight with daily variation
    const trendWeight = startWeight - (weeksIn * weeklyLoss);
    const weight = Math.round((trendWeight + variations[dayIndex]) * 10) / 10;

    // Add notes occasionally (every 3rd day or so)
    const note = dayIndex % 3 === 0 ? notes[Math.floor(dayIndex / 3) % notes.length] : undefined;

    // Demo user entry
    entries.push({
      id: generateId('weight-demo', dayIndex),
      person_id: 'person-demo',
      date: dateStr,
      weight_lbs: weight,
      notes: note,
      created_at: `${dateStr}T07:00:00Z`,
    });
  }

  return entries;
})();

// ============================================================================
// DEMO WORKOUTS - Last 30 days of workout history
// ============================================================================
// Demo User: Mixed training (cardio-focused) - HIIT, spin, running, dance, yoga
export const DEMO_WORKOUTS: Workout[] = (() => {
  const workouts: Workout[] = [];
  let workoutId = 1;

  // Demo user's weekly workout schedule (cardio focus)
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

  // Generate 30 days of workouts (going backwards from today)
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = (date.getDay() + 6) % 7 + 1; // 1=Mon, 7=Sun

    // Check if demo user has a workout scheduled for this day
    const demoWorkout = taylorSchedule.find(w => w.day === dayOfWeek);
    if (demoWorkout) {
      // Vary the exercises slightly each week
      const weekNumber = Math.floor((29 - i) / 7);
      const exercises = demoWorkout.exercises.map(ex => ({
        ...ex,
        // Add slight variation to reps
        reps: ex.reps ? ex.reps + (weekNumber % 2 === 0 ? 0 : 2) : ex.reps,
      }));

      workouts.push({
        id: generateId('workout-demo', workoutId++),
        person_id: 'person-demo',
        date: dateStr,
        type: demoWorkout.type,
        exercises,
        duration_minutes: demoWorkout.duration,
        intensity: demoWorkout.intensity,
        notes: weekNumber === 3 ? 'Feeling extra energized today!' : undefined,
        completed: i > 0, // Future workouts not completed
        created_at: `${dateStr}T07:00:00Z`,
      });
    }
  }

  return workouts;
})();

// ============================================================================
// DEMO MEALS - Last 30 days of meal history
// ============================================================================
// Meals are household-shared (no person_id) - typical for families/couples
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
