/**
 * SQLite Database Module for FITNESS-TRACKER
 * Provides local database support when DATABASE_TYPE=sqlite
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type {
  Person,
  WeightEntry,
  Workout,
  Meal,
  PantryItem,
  Recipe,
  Exercise,
} from './types';

// Database path - uses ./data directory for Docker volume mounting
const DATA_DIR = process.env.DATABASE_PATH || join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'fitness-tracker.db');

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Check if SQLite mode is enabled
 */
export function isSQLiteEnabled(): boolean {
  return process.env.DATABASE_TYPE === 'sqlite';
}

/**
 * Get or create the database instance
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Create or open database
  db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema if needed
  initializeSchema(db);

  // Seed default data if empty
  seedDefaultData(db);

  return db;
}

/**
 * Initialize database schema from SQL file
 */
function initializeSchema(database: Database.Database): void {
  const schemaPath = join(dirname(__dirname), 'lib', 'db-schema.sql');

  // Check if schema file exists
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');
    database.exec(schema);
  } else {
    // Fallback: create essential tables inline
    database.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
        age INTEGER NOT NULL,
        height REAL NOT NULL,
        weight REAL NOT NULL,
        bmi REAL NOT NULL,
        daily_calorie_target INTEGER NOT NULL,
        training_focus TEXT CHECK(training_focus IN ('powerlifting', 'cardio', 'mixed')) NOT NULL,
        workout_days_per_week INTEGER NOT NULL,
        household_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS weight_entries (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        person_id TEXT NOT NULL,
        date TEXT NOT NULL,
        weight_lbs REAL NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        person_id TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        exercises TEXT NOT NULL,
        duration_minutes INTEGER,
        intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
        notes TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        person_id TEXT,
        date TEXT NOT NULL,
        meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        calories INTEGER,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        fiber_g REAL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS pantry_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        location TEXT,
        expires_at TEXT,
        low_stock_threshold REAL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT CHECK(category IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
        prep_time_minutes INTEGER,
        cook_time_minutes INTEGER,
        servings INTEGER NOT NULL DEFAULT 1,
        base_servings INTEGER NOT NULL DEFAULT 1,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        nutrition TEXT,
        macros_per_serving TEXT,
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        tags TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS food_log (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        person_id TEXT NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
        food_name TEXT NOT NULL,
        serving_size REAL,
        serving_unit TEXT,
        calories INTEGER,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        fiber_g REAL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS water_intake (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        person_id TEXT NOT NULL,
        date TEXT NOT NULL,
        amount_ml INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
      );
    `);
  }
}

/**
 * Seed default persons if the table is empty
 */
function seedDefaultData(database: Database.Database): void {
  const count = database.prepare('SELECT COUNT(*) as count FROM persons').get() as { count: number };

  if (count.count === 0) {
    // Insert default persons (Taylor and Dylan from demo data)
    const insertPerson = database.prepare(`
      INSERT INTO persons (id, name, gender, age, height, weight, bmi, daily_calorie_target, training_focus, workout_days_per_week, household_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPerson.run(
      'person-taylor',
      'Taylor',
      'female',
      30,
      155,
      174,
      32.7,
      1900,
      'cardio',
      5,
      'household-demo',
      new Date().toISOString()
    );

    insertPerson.run(
      'person-dylan',
      'Dylan',
      'male',
      32,
      178,
      245,
      34.9,
      3400,
      'powerlifting',
      4,
      'household-demo',
      new Date().toISOString()
    );
  }
}

/**
 * Generate a UUID for new records
 */
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// PERSONS CRUD OPERATIONS
// ============================================================================

export function getAllPersons(): Person[] {
  const database = getDatabase();
  const rows = database.prepare('SELECT * FROM persons ORDER BY name').all() as PersonRow[];
  return rows.map(mapRowToPerson);
}

export function getPersonById(id: string): Person | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM persons WHERE id = ?').get(id) as PersonRow | undefined;
  return row ? mapRowToPerson(row) : null;
}

export function createPerson(person: Omit<Person, 'id' | 'created_at'>): Person {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO persons (id, name, gender, age, height, weight, bmi, daily_calorie_target, training_focus, workout_days_per_week, household_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    person.name,
    person.gender,
    person.age,
    person.height,
    person.weight,
    person.bmi,
    person.dailyCalorieTarget,
    person.training_focus,
    person.workoutDaysPerWeek,
    person.householdId || null,
    created_at
  );

  return { ...person, id, created_at };
}

export function updatePerson(id: string, updates: Partial<Person>): Person | null {
  const database = getDatabase();
  const existing = getPersonById(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };

  database.prepare(`
    UPDATE persons SET
      name = ?, gender = ?, age = ?, height = ?, weight = ?, bmi = ?,
      daily_calorie_target = ?, training_focus = ?, workout_days_per_week = ?,
      household_id = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.gender,
    updated.age,
    updated.height,
    updated.weight,
    updated.bmi,
    updated.dailyCalorieTarget,
    updated.training_focus,
    updated.workoutDaysPerWeek,
    updated.householdId || null,
    new Date().toISOString(),
    id
  );

  return getPersonById(id);
}

export function deletePerson(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM persons WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// WEIGHT ENTRIES CRUD OPERATIONS
// ============================================================================

export function getWeightEntries(personId: string, startDate?: string, endDate?: string): WeightEntry[] {
  const database = getDatabase();
  let query = 'SELECT * FROM weight_entries WHERE person_id = ?';
  const params: (string | undefined)[] = [personId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  const rows = database.prepare(query).all(...params.filter(Boolean)) as WeightEntryRow[];
  return rows.map(mapRowToWeightEntry);
}

export function createWeightEntry(entry: Omit<WeightEntry, 'id' | 'created_at'>): WeightEntry {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO weight_entries (id, person_id, date, weight_lbs, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, entry.person_id, entry.date, entry.weight_lbs, entry.notes || null, created_at);

  return { ...entry, id, created_at };
}

/**
 * Upsert a weight entry - creates or updates based on person_id + date
 * This is atomic and avoids race conditions when multiple requests try to
 * create/update weight entries for the same person on the same date.
 *
 * Note: This requires a unique index on (person_id, date). If the index doesn't
 * exist, this function will create a new entry each time.
 */
export function upsertWeightEntry(entry: Omit<WeightEntry, 'id' | 'created_at'>): WeightEntry {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  // First, ensure the unique index exists (idempotent operation)
  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_entries_person_date_unique
    ON weight_entries(person_id, date)
  `);

  // Use INSERT ... ON CONFLICT for atomic upsert
  const result = database.prepare(`
    INSERT INTO weight_entries (id, person_id, date, weight_lbs, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(person_id, date) DO UPDATE SET
      weight_lbs = excluded.weight_lbs,
      notes = excluded.notes
    RETURNING *
  `).get(id, entry.person_id, entry.date, entry.weight_lbs, entry.notes || null, created_at) as WeightEntryRow | undefined;

  if (result) {
    return mapRowToWeightEntry(result);
  }

  // Fallback: if RETURNING didn't work, fetch the entry
  const fetched = database.prepare(`
    SELECT * FROM weight_entries WHERE person_id = ? AND date = ?
  `).get(entry.person_id, entry.date) as WeightEntryRow;

  return mapRowToWeightEntry(fetched);
}

export function deleteWeightEntry(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM weight_entries WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getWeightEntryById(id: string): WeightEntry | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM weight_entries WHERE id = ?').get(id) as WeightEntryRow | undefined;
  return row ? mapRowToWeightEntry(row) : null;
}

// ============================================================================
// WORKOUTS CRUD OPERATIONS
// ============================================================================

export function getWorkouts(personId: string, date?: string): Workout[] {
  const database = getDatabase();
  let query = 'SELECT * FROM workouts WHERE person_id = ?';
  const params: string[] = [personId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  query += ' ORDER BY date DESC';

  const rows = database.prepare(query).all(...params) as WorkoutRow[];
  return rows.map(mapRowToWorkout);
}

export function getWorkoutById(id: string): Workout | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM workouts WHERE id = ?').get(id) as WorkoutRow | undefined;
  return row ? mapRowToWorkout(row) : null;
}

export function createWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Workout {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO workouts (id, person_id, date, type, exercises, duration_minutes, intensity, notes, completed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    workout.person_id,
    workout.date,
    workout.type,
    JSON.stringify(workout.exercises),
    workout.duration_minutes || null,
    workout.intensity || null,
    workout.notes || null,
    workout.completed ? 1 : 0,
    created_at
  );

  return { ...workout, id, created_at };
}

export function updateWorkout(id: string, updates: Partial<Workout>): Workout | null {
  const database = getDatabase();
  const existing = getWorkoutById(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };

  database.prepare(`
    UPDATE workouts SET
      type = ?, exercises = ?, duration_minutes = ?, intensity = ?,
      notes = ?, completed = ?
    WHERE id = ?
  `).run(
    updated.type,
    JSON.stringify(updated.exercises),
    updated.duration_minutes || null,
    updated.intensity || null,
    updated.notes || null,
    updated.completed ? 1 : 0,
    id
  );

  return getWorkoutById(id);
}

export function deleteWorkout(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM workouts WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// MEALS CRUD OPERATIONS
// ============================================================================

export function getMeals(date?: string, mealType?: string, personId?: string): Meal[] {
  const database = getDatabase();
  let query = 'SELECT * FROM meals WHERE 1=1';
  const params: string[] = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (mealType) {
    query += ' AND meal_type = ?';
    params.push(mealType);
  }
  if (personId) {
    query += ' AND person_id = ?';
    params.push(personId);
  }

  query += ' ORDER BY created_at ASC';

  const rows = database.prepare(query).all(...params) as MealRow[];
  return rows.map(mapRowToMeal);
}

export function createMeal(meal: Omit<Meal, 'id' | 'created_at'>): Meal {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO meals (id, person_id, date, meal_type, name, description, calories, protein_g, carbs_g, fat_g, fiber_g, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    (meal as MealWithPersonId).person_id || null,
    meal.date,
    meal.meal_type,
    meal.name,
    meal.description || null,
    meal.calories || null,
    meal.protein_g || null,
    meal.carbs_g || null,
    meal.fat_g || null,
    meal.fiber_g || null,
    created_at
  );

  return { ...meal, id, created_at };
}

export function deleteMeal(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM meals WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getMealById(id: string): Meal | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM meals WHERE id = ?').get(id) as MealRow | undefined;
  return row ? mapRowToMeal(row) : null;
}

// ============================================================================
// PANTRY ITEMS CRUD OPERATIONS
// ============================================================================

export function getPantryItems(category?: string, lowStockOnly?: boolean): PantryItem[] {
  const database = getDatabase();
  let query = 'SELECT * FROM pantry_items WHERE 1=1';
  const params: string[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY category ASC, name ASC';

  let rows = database.prepare(query).all(...params) as PantryItemRow[];
  let items = rows.map(mapRowToPantryItem);

  if (lowStockOnly) {
    items = items.filter(item =>
      item.low_stock_threshold !== undefined &&
      item.quantity <= item.low_stock_threshold
    );
  }

  return items;
}

export function getPantryItemById(id: string): PantryItem | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM pantry_items WHERE id = ?').get(id) as PantryItemRow | undefined;
  return row ? mapRowToPantryItem(row) : null;
}

export function createPantryItem(item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>): PantryItem {
  const database = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  database.prepare(`
    INSERT INTO pantry_items (id, name, category, quantity, unit, location, expires_at, low_stock_threshold, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    item.name,
    item.category,
    item.quantity,
    item.unit,
    item.location || null,
    item.expires_at || null,
    item.low_stock_threshold || null,
    item.notes || null,
    now,
    now
  );

  return { ...item, id, created_at: now, updated_at: now };
}

export function updatePantryItem(id: string, updates: Partial<PantryItem>): PantryItem | null {
  const database = getDatabase();
  const existing = getPantryItemById(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  const now = new Date().toISOString();

  database.prepare(`
    UPDATE pantry_items SET
      name = ?, category = ?, quantity = ?, unit = ?, location = ?,
      expires_at = ?, low_stock_threshold = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.category,
    updated.quantity,
    updated.unit,
    updated.location || null,
    updated.expires_at || null,
    updated.low_stock_threshold || null,
    updated.notes || null,
    now,
    id
  );

  return getPantryItemById(id);
}

/**
 * Atomically update pantry item quantity by a delta value.
 * This avoids race conditions by using a single SQL statement that reads
 * and updates the quantity in one atomic operation.
 *
 * @param id - The pantry item ID
 * @param delta - The amount to add (positive) or subtract (negative)
 * @returns The updated pantry item, or null if not found
 */
export function updatePantryQuantityDelta(id: string, delta: number): PantryItem | null {
  const database = getDatabase();
  const now = new Date().toISOString();

  // Use a single atomic SQL statement that:
  // 1. Adds the delta to the current quantity
  // 2. Ensures quantity doesn't go below 0 using MAX()
  // 3. Updates the timestamp
  // This is atomic and prevents read-modify-write race conditions
  const result = database.prepare(`
    UPDATE pantry_items
    SET quantity = MAX(0, quantity + ?),
        updated_at = ?
    WHERE id = ?
    RETURNING *
  `).get(delta, now, id) as PantryItemRow | undefined;

  if (result) {
    return mapRowToPantryItem(result);
  }

  // If RETURNING didn't work (shouldn't happen with better-sqlite3), check if item exists
  const existing = getPantryItemById(id);
  return existing;
}

/**
 * Atomically set pantry item quantity to an absolute value.
 * This is simpler than delta updates but still ensures atomicity.
 *
 * @param id - The pantry item ID
 * @param quantity - The new absolute quantity (will be clamped to 0 minimum)
 * @returns The updated pantry item, or null if not found
 */
export function setPantryQuantity(id: string, quantity: number): PantryItem | null {
  const database = getDatabase();
  const now = new Date().toISOString();
  const safeQuantity = Math.max(0, quantity);

  const result = database.prepare(`
    UPDATE pantry_items
    SET quantity = ?,
        updated_at = ?
    WHERE id = ?
    RETURNING *
  `).get(safeQuantity, now, id) as PantryItemRow | undefined;

  if (result) {
    return mapRowToPantryItem(result);
  }

  return null;
}

export function deletePantryItem(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM pantry_items WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// RECIPES CRUD OPERATIONS
// ============================================================================

export function getRecipes(category?: string, tags?: string[]): Recipe[] {
  const database = getDatabase();
  let query = 'SELECT * FROM recipes WHERE 1=1';
  const params: string[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY name ASC';

  const rows = database.prepare(query).all(...params) as RecipeRow[];
  let recipes = rows.map(mapRowToRecipe);

  // Filter by tags if provided
  if (tags && tags.length > 0) {
    const tagList = tags.map(t => t.toLowerCase());
    recipes = recipes.filter(recipe => {
      if (!recipe.tags || recipe.tags.length === 0) return false;
      const recipeTags = recipe.tags.map(t => t.toLowerCase());
      return tagList.some(tag => recipeTags.includes(tag));
    });
  }

  return recipes;
}

export function getRecipeById(id: string): Recipe | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as RecipeRow | undefined;
  return row ? mapRowToRecipe(row) : null;
}

export function createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Recipe {
  const database = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  database.prepare(`
    INSERT INTO recipes (id, name, description, category, prep_time_minutes, cook_time_minutes, servings, base_servings, ingredients, instructions, nutrition, macros_per_serving, difficulty, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    recipe.name,
    recipe.description || null,
    recipe.category,
    recipe.prep_time_minutes || null,
    recipe.cook_time_minutes || null,
    recipe.servings,
    recipe.baseServings || recipe.servings,
    JSON.stringify(recipe.ingredients),
    JSON.stringify(recipe.instructions),
    recipe.nutrition ? JSON.stringify(recipe.nutrition) : null,
    recipe.macrosPerServing ? JSON.stringify(recipe.macrosPerServing) : null,
    recipe.difficulty || null,
    recipe.tags ? JSON.stringify(recipe.tags) : null,
    now,
    now
  );

  return { ...recipe, id, created_at: now };
}

export function deleteRecipe(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM recipes WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// FOOD LOG CRUD OPERATIONS
// ============================================================================

interface FoodLogEntry {
  id: string;
  person_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  notes?: string;
  created_at: string;
}

export function getFoodLog(personId: string, date: string): FoodLogEntry[] {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT * FROM food_log WHERE person_id = ? AND date = ? ORDER BY created_at ASC
  `).all(personId, date) as FoodLogRow[];
  return rows.map(mapRowToFoodLogEntry);
}

export function createFoodLogEntry(entry: Omit<FoodLogEntry, 'id' | 'created_at'>): FoodLogEntry {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO food_log (id, person_id, date, meal_type, food_name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    entry.person_id,
    entry.date,
    entry.meal_type,
    entry.food_name,
    entry.serving_size || null,
    entry.serving_unit || null,
    entry.calories || null,
    entry.protein_g || null,
    entry.carbs_g || null,
    entry.fat_g || null,
    entry.fiber_g || null,
    entry.notes || null,
    created_at
  );

  return { ...entry, id, created_at };
}

export function deleteFoodLogEntry(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM food_log WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// WATER INTAKE CRUD OPERATIONS
// ============================================================================

interface WaterIntakeEntry {
  id: string;
  person_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export function getWaterIntake(personId: string, date: string): WaterIntakeEntry[] {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT * FROM water_intake WHERE person_id = ? AND date = ? ORDER BY created_at ASC
  `).all(personId, date) as WaterIntakeRow[];
  return rows.map(mapRowToWaterIntake);
}

export function getTotalWaterIntake(personId: string, date: string): number {
  const database = getDatabase();
  const result = database.prepare(`
    SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_intake WHERE person_id = ? AND date = ?
  `).get(personId, date) as { total: number };
  return result.total;
}

export function createWaterIntakeEntry(entry: Omit<WaterIntakeEntry, 'id' | 'created_at'>): WaterIntakeEntry {
  const database = getDatabase();
  const id = generateId();
  const created_at = new Date().toISOString();

  database.prepare(`
    INSERT INTO water_intake (id, person_id, date, amount_ml, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, entry.person_id, entry.date, entry.amount_ml, created_at);

  return { ...entry, id, created_at };
}

export function deleteWaterIntakeEntry(id: string): boolean {
  const database = getDatabase();
  const result = database.prepare('DELETE FROM water_intake WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================================
// ROW TYPE DEFINITIONS (for SQLite results)
// ============================================================================

interface PersonRow {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  bmi: number;
  daily_calorie_target: number;
  training_focus: 'powerlifting' | 'cardio' | 'mixed';
  workout_days_per_week: number;
  household_id: string | null;
  created_at: string;
  updated_at?: string;
}

interface WeightEntryRow {
  id: string;
  person_id: string;
  date: string;
  weight_lbs: number;
  notes: string | null;
  created_at: string;
}

interface WorkoutRow {
  id: string;
  person_id: string;
  date: string;
  type: string;
  exercises: string; // JSON string
  duration_minutes: number | null;
  intensity: 'low' | 'medium' | 'high' | null;
  notes: string | null;
  completed: number; // 0 or 1
  created_at: string;
}

interface MealRow {
  id: string;
  person_id: string | null;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  created_at: string;
}

interface MealWithPersonId extends Meal {
  person_id?: string;
}

interface PantryItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string | null;
  expires_at: string | null;
  low_stock_threshold: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  base_servings: number;
  ingredients: string; // JSON string
  instructions: string; // JSON string
  nutrition: string | null; // JSON string
  macros_per_serving: string | null; // JSON string
  difficulty: 'easy' | 'medium' | 'hard' | null;
  tags: string | null; // JSON string
  created_at: string;
  updated_at?: string;
}

interface FoodLogRow {
  id: string;
  person_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  created_at: string;
}

interface WaterIntakeRow {
  id: string;
  person_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

// ============================================================================
// ROW MAPPING FUNCTIONS
// ============================================================================

function mapRowToPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    age: row.age,
    height: row.height,
    weight: row.weight,
    bmi: row.bmi,
    dailyCalorieTarget: row.daily_calorie_target,
    training_focus: row.training_focus,
    workoutDaysPerWeek: row.workout_days_per_week,
    householdId: row.household_id || '',
    created_at: row.created_at,
  };
}

function mapRowToWeightEntry(row: WeightEntryRow): WeightEntry {
  return {
    id: row.id,
    person_id: row.person_id,
    date: row.date,
    weight_lbs: row.weight_lbs,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

function mapRowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    person_id: row.person_id,
    date: row.date,
    type: row.type,
    exercises: JSON.parse(row.exercises) as Exercise[],
    duration_minutes: row.duration_minutes || undefined,
    intensity: row.intensity || undefined,
    notes: row.notes || undefined,
    completed: row.completed === 1,
    created_at: row.created_at,
  };
}

function mapRowToMeal(row: MealRow): Meal {
  return {
    id: row.id,
    person_id: row.person_id || undefined,
    date: row.date,
    meal_type: row.meal_type,
    name: row.name,
    description: row.description || undefined,
    calories: row.calories || undefined,
    protein_g: row.protein_g || undefined,
    carbs_g: row.carbs_g || undefined,
    fat_g: row.fat_g || undefined,
    fiber_g: row.fiber_g || undefined,
    created_at: row.created_at,
  };
}

function mapRowToPantryItem(row: PantryItemRow): PantryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    location: row.location || undefined,
    expires_at: row.expires_at || undefined,
    low_stock_threshold: row.low_stock_threshold || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category,
    prep_time_minutes: row.prep_time_minutes || undefined,
    cook_time_minutes: row.cook_time_minutes || undefined,
    servings: row.servings,
    baseServings: row.base_servings,
    ingredients: JSON.parse(row.ingredients),
    instructions: JSON.parse(row.instructions),
    nutrition: row.nutrition ? JSON.parse(row.nutrition) : undefined,
    macrosPerServing: row.macros_per_serving ? JSON.parse(row.macros_per_serving) : undefined,
    difficulty: row.difficulty || undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    created_at: row.created_at,
  };
}

function mapRowToFoodLogEntry(row: FoodLogRow): FoodLogEntry {
  return {
    id: row.id,
    person_id: row.person_id,
    date: row.date,
    meal_type: row.meal_type,
    food_name: row.food_name,
    serving_size: row.serving_size || undefined,
    serving_unit: row.serving_unit || undefined,
    calories: row.calories || undefined,
    protein_g: row.protein_g || undefined,
    carbs_g: row.carbs_g || undefined,
    fat_g: row.fat_g || undefined,
    fiber_g: row.fiber_g || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

function mapRowToWaterIntake(row: WaterIntakeRow): WaterIntakeEntry {
  return {
    id: row.id,
    person_id: row.person_id,
    date: row.date,
    amount_ml: row.amount_ml,
    created_at: row.created_at,
  };
}

// ============================================================================
// DATABASE UTILITY FUNCTIONS
// ============================================================================

/**
 * Close the database connection (useful for testing)
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): { path: string; size: number; tables: string[] } {
  const database = getDatabase();
  const tables = database.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as { name: string }[];

  return {
    path: DB_PATH,
    size: existsSync(DB_PATH) ? require('fs').statSync(DB_PATH).size : 0,
    tables: tables.map(t => t.name),
  };
}
