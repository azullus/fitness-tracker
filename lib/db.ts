import Database from 'better-sqlite3';
import { join } from 'path';
import type {
  Person,
  WeightLog,
  WorkoutLog,
  PantryItem,
  Recipe,
  MealPlan,
  GroceryItem,
  WorkoutExercise
} from './types';

// Database file location (in project root)
const DB_PATH = join(process.cwd(), 'fitness-tracker.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db!;

  // Create tables
  database.exec(`
    -- Household members
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      training_focus TEXT NOT NULL,
      allergies TEXT DEFAULT '[]',
      supplements TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Weight tracking
    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      person_id TEXT REFERENCES persons(id),
      date TEXT NOT NULL,
      weight_lbs REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    );

    -- Workout logs
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      person_id TEXT REFERENCES persons(id),
      date TEXT NOT NULL,
      workout_type TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      main_lifts TEXT,
      top_set_weight REAL,
      rpe TEXT,
      is_pr INTEGER DEFAULT 0,
      activities TEXT,
      duration_min INTEGER,
      intensity TEXT,
      energy INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    );

    -- Pantry inventory
    CREATE TABLE IF NOT EXISTS pantry_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      item TEXT NOT NULL UNIQUE,
      quantity REAL DEFAULT 0,
      unit TEXT NOT NULL,
      location TEXT DEFAULT 'Pantry',
      restock_when_low INTEGER DEFAULT 1,
      notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Recipes
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      servings INTEGER DEFAULT 2,
      prep_time_min INTEGER DEFAULT 0,
      cook_time_min INTEGER DEFAULT 0,
      calories INTEGER NOT NULL,
      protein_g INTEGER NOT NULL,
      carbs_g INTEGER NOT NULL,
      fat_g INTEGER NOT NULL,
      fiber_g INTEGER DEFAULT 0,
      ingredients TEXT DEFAULT '[]',
      instructions TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Weekly meal plans
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT REFERENCES recipes(id),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, meal_type)
    );

    -- Grocery lists
    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      store TEXT NOT NULL,
      category TEXT,
      item TEXT NOT NULL,
      quantity TEXT,
      unit_price TEXT,
      needed INTEGER DEFAULT 1,
      purchased INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Workout exercises
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      person_id TEXT REFERENCES persons(id),
      week_number INTEGER DEFAULT 1,
      day_of_week TEXT NOT NULL,
      workout_type TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps TEXT NOT NULL,
      weight_intensity TEXT,
      rest_period TEXT,
      target_muscles TEXT,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(date);
    CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_pantry_category ON pantry_items(category);
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
    CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date);
  `);

  // Seed persons if not exist
  const existing = database.prepare('SELECT COUNT(*) as count FROM persons').get() as { count: number };
  if (existing.count === 0) {
    database.prepare(`
      INSERT INTO persons (id, name, training_focus, allergies, supplements)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), 'Him', 'powerlifting', '["bananas (raw only)"]', '["One-A-Day Men\'s"]');

    database.prepare(`
      INSERT INTO persons (id, name, training_focus, allergies, supplements)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), 'Her', 'cardio_mobility', '[]', '["One-A-Day Women\'s", "Metamucil"]');
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ============ PERSONS ============

export function getPersons(): Person[] {
  const rows = getDb().prepare('SELECT * FROM persons').all() as any[];
  return rows.map(row => ({
    ...row,
    allergies: JSON.parse(row.allergies || '[]'),
    supplements: JSON.parse(row.supplements || '[]'),
  }));
}

export function getPersonByName(name: string): Person | null {
  const row = getDb().prepare('SELECT * FROM persons WHERE name = ?').get(name) as any;
  if (!row) return null;
  return {
    ...row,
    allergies: JSON.parse(row.allergies || '[]'),
    supplements: JSON.parse(row.supplements || '[]'),
  };
}

// ============ WEIGHT LOGS ============

export function getWeightLogs(personId?: string, limit = 30): WeightLog[] {
  let query = 'SELECT * FROM weight_logs';
  const params: any[] = [];

  if (personId) {
    query += ' WHERE person_id = ?';
    params.push(personId);
  }

  query += ' ORDER BY date DESC LIMIT ?';
  params.push(limit);

  return getDb().prepare(query).all(...params) as WeightLog[];
}

export function logWeight(log: Omit<WeightLog, 'id'>): WeightLog {
  const id = generateId();
  getDb().prepare(`
    INSERT OR REPLACE INTO weight_logs (id, person_id, date, weight_lbs, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, log.person_id, log.date, log.weight_lbs, log.notes);

  return { id, ...log };
}

// ============ WORKOUT LOGS ============

export function getWorkoutLogs(personId?: string, date?: string): WorkoutLog[] {
  let query = 'SELECT * FROM workout_logs WHERE 1=1';
  const params: any[] = [];

  if (personId) {
    query += ' AND person_id = ?';
    params.push(personId);
  }
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  query += ' ORDER BY date DESC';

  const rows = getDb().prepare(query).all(...params) as any[];
  return rows.map(row => ({
    ...row,
    completed: Boolean(row.completed),
    is_pr: Boolean(row.is_pr),
  }));
}

export function logWorkout(log: Omit<WorkoutLog, 'id'>): WorkoutLog {
  const id = generateId();
  getDb().prepare(`
    INSERT OR REPLACE INTO workout_logs
    (id, person_id, date, workout_type, completed, main_lifts, top_set_weight, rpe, is_pr, activities, duration_min, intensity, energy, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, log.person_id, log.date, log.workout_type, log.completed ? 1 : 0,
    log.main_lifts, log.top_set_weight, log.rpe, log.is_pr ? 1 : 0,
    log.activities, log.duration_min, log.intensity, log.energy, log.notes
  );

  return { id, ...log };
}

// ============ PANTRY ============

export function getPantryItems(): PantryItem[] {
  const rows = getDb().prepare('SELECT * FROM pantry_items ORDER BY category, item').all() as any[];
  return rows.map(row => ({
    ...row,
    restock_when_low: Boolean(row.restock_when_low),
  }));
}

export function updatePantryItem(id: string, updates: Partial<PantryItem>): PantryItem {
  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.quantity !== undefined) {
    setClauses.push('quantity = ?');
    params.push(updates.quantity);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    params.push(updates.notes);
  }
  if (updates.restock_when_low !== undefined) {
    setClauses.push('restock_when_low = ?');
    params.push(updates.restock_when_low ? 1 : 0);
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  getDb().prepare(`UPDATE pantry_items SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  return getDb().prepare('SELECT * FROM pantry_items WHERE id = ?').get(id) as PantryItem;
}

export function addPantryItem(item: Omit<PantryItem, 'id'>): PantryItem {
  const id = generateId();
  getDb().prepare(`
    INSERT INTO pantry_items (id, category, item, quantity, unit, location, restock_when_low, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, item.category, item.item, item.quantity, item.unit, item.location, item.restock_when_low ? 1 : 0, item.notes);

  return { id, ...item };
}

// ============ RECIPES ============

export function getRecipeById(id: string): Recipe | null {
  const row = getDb().prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    ingredients: JSON.parse(row.ingredients || '[]'),
    instructions: JSON.parse(row.instructions || '[]'),
    tags: JSON.parse(row.tags || '[]'),
  };
}

export function getRecipes(category?: string): Recipe[] {
  let query = 'SELECT * FROM recipes';
  const params: any[] = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY name';

  const rows = getDb().prepare(query).all(...params) as any[];
  return rows.map(row => ({
    ...row,
    ingredients: JSON.parse(row.ingredients || '[]'),
    instructions: JSON.parse(row.instructions || '[]'),
    tags: JSON.parse(row.tags || '[]'),
  }));
}

export function addRecipe(recipe: Omit<Recipe, 'id'>): Recipe {
  const id = generateId();
  getDb().prepare(`
    INSERT INTO recipes (id, name, category, servings, prep_time_min, cook_time_min, calories, protein_g, carbs_g, fat_g, fiber_g, ingredients, instructions, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, recipe.name, recipe.category, recipe.servings, recipe.prep_time_min, recipe.cook_time_min,
    recipe.calories, recipe.protein_g, recipe.carbs_g, recipe.fat_g, recipe.fiber_g,
    JSON.stringify(recipe.ingredients), JSON.stringify(recipe.instructions), JSON.stringify(recipe.tags), recipe.notes
  );

  return { id, ...recipe };
}

// ============ MEAL PLANS ============

export function getMealPlans(startDate: string, endDate: string): MealPlan[] {
  const rows = getDb().prepare(`
    SELECT mp.*, r.name as recipe_name, r.calories, r.protein_g, r.carbs_g, r.fat_g, r.fiber_g, r.prep_time_min, r.cook_time_min, r.category as recipe_category, r.ingredients, r.instructions, r.tags
    FROM meal_plans mp
    LEFT JOIN recipes r ON mp.recipe_id = r.id
    WHERE mp.date >= ? AND mp.date <= ?
    ORDER BY mp.date, mp.meal_type
  `).all(startDate, endDate) as any[];

  return rows.map(row => ({
    id: row.id,
    date: row.date,
    meal_type: row.meal_type,
    recipe_id: row.recipe_id,
    notes: row.notes,
    recipe: row.recipe_id ? {
      id: row.recipe_id,
      name: row.recipe_name,
      category: row.recipe_category,
      servings: 2,
      prep_time_min: row.prep_time_min,
      cook_time_min: row.cook_time_min,
      calories: row.calories,
      protein_g: row.protein_g,
      carbs_g: row.carbs_g,
      fat_g: row.fat_g,
      fiber_g: row.fiber_g,
      ingredients: JSON.parse(row.ingredients || '[]'),
      instructions: JSON.parse(row.instructions || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      notes: null,
    } : undefined,
  }));
}

// ============ GROCERY ============

export function getGroceryItems(weekStart?: string): GroceryItem[] {
  let query = 'SELECT * FROM grocery_items';
  const params: any[] = [];

  if (weekStart) {
    query += ' WHERE week_start = ?';
    params.push(weekStart);
  }

  query += ' ORDER BY store, category, item';

  const rows = getDb().prepare(query).all(...params) as any[];
  return rows.map(row => ({
    ...row,
    needed: Boolean(row.needed),
    purchased: Boolean(row.purchased),
  }));
}

export function toggleGroceryPurchased(id: string, purchased: boolean): GroceryItem {
  getDb().prepare('UPDATE grocery_items SET purchased = ? WHERE id = ?').run(purchased ? 1 : 0, id);
  return getDb().prepare('SELECT * FROM grocery_items WHERE id = ?').get(id) as GroceryItem;
}

// ============ WORKOUT EXERCISES ============

export function getWorkoutExercises(personId: string, dayOfWeek?: string): WorkoutExercise[] {
  let query = 'SELECT * FROM workout_exercises WHERE person_id = ?';
  const params: any[] = [personId];

  if (dayOfWeek) {
    query += ' AND day_of_week = ?';
    params.push(dayOfWeek);
  }

  query += ' ORDER BY sort_order';

  return getDb().prepare(query).all(...params) as WorkoutExercise[];
}
