#!/usr/bin/env tsx
/**
 * CSV Import Script for FITNESS-TRACKER
 *
 * Imports data from Obsidian CSV files into Supabase database.
 *
 * Usage:
 *   npm run sync:import          # Import all CSV files
 *   npm run sync:import -- --dry-run   # Preview without writing
 *
 * Required environment variables:
 *   SUPABASE_URL         - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key (for admin access)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CSV Row Interfaces (matching expected CSV formats)
// ============================================================================

interface WeightTrackerRow {
  date: string;
  person: string;
  weight_lbs: string;
  notes?: string;
}

interface WorkoutChecklistRow {
  date: string;
  type: string;
  exercises: string; // JSON string
  duration: string;
  intensity: string;
  completed: string;
  notes?: string;
}

interface WeeklyMealsRow {
  date: string;
  meal_type: string;
  name: string;
  description?: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
}

interface PantryInventoryRow {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  location?: string;
  expires_at?: string;
  low_stock_threshold?: string;
  notes?: string;
}

interface GroceryChecklistRow {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  store?: string;
  checked: string;
  estimated_price?: string;
}

// ============================================================================
// Database Record Interfaces
// ============================================================================

interface WeightEntryRecord {
  date: string;
  person: string;
  weight_lbs: number;
  notes: string | null;
}

interface WorkoutRecord {
  date: string;
  person: string;
  type: string;
  exercises: object[];
  duration_minutes: number | null;
  intensity: string | null;
  completed: boolean;
  notes: string | null;
}

interface MealRecord {
  date: string;
  meal_type: string;
  name: string;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
}

interface PantryItemRecord {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string | null;
  expires_at: string | null;
  low_stock_threshold: number | null;
  notes: string | null;
}

interface GroceryItemRecord {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  store: string | null;
  checked: boolean;
  estimated_price: number | null;
}

// ============================================================================
// Configuration
// ============================================================================

const BASE_PATH = path.resolve(__dirname, '../..');
const CSV_PATHS = {
  weightTracker: path.join(BASE_PATH, 'Tracking/weight-tracker.csv'),
  hisWorkouts: path.join(BASE_PATH, 'Tracking/his-workout-checklist.csv'),
  herWorkouts: path.join(BASE_PATH, 'Tracking/her-workout-checklist.csv'),
  weeklyMeals: path.join(BASE_PATH, 'Tracking/weekly-meals.csv'),
  pantryInventory: path.join(BASE_PATH, 'Pantry/pantry-inventory.csv'),
  groceryChecklist: path.join(BASE_PATH, 'Tracking/grocery-checklist.csv'),
};

// ============================================================================
// Utility Functions
// ============================================================================

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'x';
}

function parseJSON<T>(value: string | undefined): T[] {
  if (!value || value.trim() === '') return [];
  try {
    return JSON.parse(value);
  } catch {
    console.warn(`  Warning: Failed to parse JSON: ${value.substring(0, 50)}...`);
    return [];
  }
}

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function readCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relaxColumnCount: true,
  }) as T[];
}

// ============================================================================
// Import Functions
// ============================================================================

async function importWeightEntries(
  supabase: SupabaseClient,
  dryRun: boolean
): Promise<{ success: number; errors: number }> {
  const filePath = CSV_PATHS.weightTracker;
  console.log(`\nImporting weight entries from: ${filePath}`);

  if (!fileExists(filePath)) {
    console.log('  File not found, skipping...');
    return { success: 0, errors: 0 };
  }

  const rows = readCSV<WeightTrackerRow>(filePath);
  console.log(`  Found ${rows.length} rows`);

  const records: WeightEntryRecord[] = rows.map((row) => ({
    date: row.date,
    person: row.person,
    weight_lbs: parseNumber(row.weight_lbs) ?? 0,
    notes: row.notes?.trim() || null,
  }));

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${records.length} weight entries`);
    records.slice(0, 3).forEach((r) => console.log(`    - ${r.date} | ${r.person}: ${r.weight_lbs} lbs`));
    if (records.length > 3) console.log(`    ... and ${records.length - 3} more`);
    return { success: records.length, errors: 0 };
  }

  const { data, error } = await supabase
    .from('weight_entries')
    .upsert(records, { onConflict: 'date,person' });

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: 0, errors: records.length };
  }

  console.log(`  Successfully imported ${records.length} weight entries`);
  return { success: records.length, errors: 0 };
}

async function importWorkouts(
  supabase: SupabaseClient,
  filePath: string,
  person: 'Him' | 'Her',
  dryRun: boolean
): Promise<{ success: number; errors: number }> {
  console.log(`\nImporting ${person}'s workouts from: ${filePath}`);

  if (!fileExists(filePath)) {
    console.log('  File not found, skipping...');
    return { success: 0, errors: 0 };
  }

  const rows = readCSV<WorkoutChecklistRow>(filePath);
  console.log(`  Found ${rows.length} rows`);

  const records: WorkoutRecord[] = rows.map((row) => ({
    date: row.date,
    person: person,
    type: row.type,
    exercises: parseJSON<object>(row.exercises),
    duration_minutes: parseNumber(row.duration),
    intensity: row.intensity?.trim() || null,
    completed: parseBoolean(row.completed),
    notes: row.notes?.trim() || null,
  }));

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${records.length} workouts for ${person}`);
    records.slice(0, 3).forEach((r) => console.log(`    - ${r.date}: ${r.type} (${r.completed ? 'completed' : 'pending'})`));
    if (records.length > 3) console.log(`    ... and ${records.length - 3} more`);
    return { success: records.length, errors: 0 };
  }

  const { data, error } = await supabase
    .from('workouts')
    .upsert(records, { onConflict: 'date,person' });

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: 0, errors: records.length };
  }

  console.log(`  Successfully imported ${records.length} workouts for ${person}`);
  return { success: records.length, errors: 0 };
}

async function importMeals(
  supabase: SupabaseClient,
  dryRun: boolean
): Promise<{ success: number; errors: number }> {
  const filePath = CSV_PATHS.weeklyMeals;
  console.log(`\nImporting meals from: ${filePath}`);

  if (!fileExists(filePath)) {
    console.log('  File not found, skipping...');
    return { success: 0, errors: 0 };
  }

  const rows = readCSV<WeeklyMealsRow>(filePath);
  console.log(`  Found ${rows.length} rows`);

  const records: MealRecord[] = rows.map((row) => ({
    date: row.date,
    meal_type: row.meal_type,
    name: row.name,
    description: row.description?.trim() || null,
    calories: parseNumber(row.calories),
    protein_g: parseNumber(row.protein),
    carbs_g: parseNumber(row.carbs),
    fat_g: parseNumber(row.fat),
    fiber_g: parseNumber(row.fiber),
  }));

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${records.length} meals`);
    records.slice(0, 3).forEach((r) => console.log(`    - ${r.date} ${r.meal_type}: ${r.name}`));
    if (records.length > 3) console.log(`    ... and ${records.length - 3} more`);
    return { success: records.length, errors: 0 };
  }

  const { data, error } = await supabase
    .from('meals')
    .upsert(records, { onConflict: 'date,meal_type,name' });

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: 0, errors: records.length };
  }

  console.log(`  Successfully imported ${records.length} meals`);
  return { success: records.length, errors: 0 };
}

async function importPantryItems(
  supabase: SupabaseClient,
  dryRun: boolean
): Promise<{ success: number; errors: number }> {
  const filePath = CSV_PATHS.pantryInventory;
  console.log(`\nImporting pantry items from: ${filePath}`);

  if (!fileExists(filePath)) {
    console.log('  File not found, skipping...');
    return { success: 0, errors: 0 };
  }

  const rows = readCSV<PantryInventoryRow>(filePath);
  console.log(`  Found ${rows.length} rows`);

  const records: PantryItemRecord[] = rows.map((row) => ({
    name: row.name,
    category: row.category,
    quantity: parseNumber(row.quantity) ?? 0,
    unit: row.unit,
    location: row.location?.trim() || null,
    expires_at: row.expires_at?.trim() || null,
    low_stock_threshold: parseNumber(row.low_stock_threshold),
    notes: row.notes?.trim() || null,
  }));

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${records.length} pantry items`);
    records.slice(0, 3).forEach((r) => console.log(`    - ${r.name}: ${r.quantity} ${r.unit}`));
    if (records.length > 3) console.log(`    ... and ${records.length - 3} more`);
    return { success: records.length, errors: 0 };
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .upsert(records, { onConflict: 'name' });

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: 0, errors: records.length };
  }

  console.log(`  Successfully imported ${records.length} pantry items`);
  return { success: records.length, errors: 0 };
}

async function importGroceryItems(
  supabase: SupabaseClient,
  dryRun: boolean
): Promise<{ success: number; errors: number }> {
  const filePath = CSV_PATHS.groceryChecklist;
  console.log(`\nImporting grocery items from: ${filePath}`);

  if (!fileExists(filePath)) {
    console.log('  File not found, skipping...');
    return { success: 0, errors: 0 };
  }

  const rows = readCSV<GroceryChecklistRow>(filePath);
  console.log(`  Found ${rows.length} rows`);

  const records: GroceryItemRecord[] = rows.map((row) => ({
    name: row.name,
    category: row.category,
    quantity: parseNumber(row.quantity) ?? 1,
    unit: row.unit,
    store: row.store?.trim() || null,
    checked: parseBoolean(row.checked),
    estimated_price: parseNumber(row.estimated_price),
  }));

  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${records.length} grocery items`);
    records.slice(0, 3).forEach((r) => console.log(`    - ${r.name}: ${r.quantity} ${r.unit} (${r.checked ? 'checked' : 'unchecked'})`));
    if (records.length > 3) console.log(`    ... and ${records.length - 3} more`);
    return { success: records.length, errors: 0 };
  }

  const { data, error } = await supabase
    .from('grocery_items')
    .upsert(records, { onConflict: 'name' });

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: 0, errors: records.length };
  }

  console.log(`  Successfully imported ${records.length} grocery items`);
  return { success: records.length, errors: 0 };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('FITNESS-TRACKER CSV Import');
  console.log('='.repeat(60));

  // Parse command-line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    console.log('\n*** DRY RUN MODE - No changes will be made to the database ***\n');
  }

  // Load environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) environment variable is required');
    console.error('Set it in your .env file or export it before running this script.');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.error('This is the service_role key from your Supabase project settings.');
    console.error('Set it in your .env file or export it before running this script.');
    process.exit(1);
  }

  // Create Supabase client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Base CSV Path: ${BASE_PATH}`);

  // Check which files exist
  console.log('\nChecking CSV files:');
  Object.entries(CSV_PATHS).forEach(([key, filePath]) => {
    const exists = fileExists(filePath);
    const relativePath = path.relative(BASE_PATH, filePath);
    console.log(`  ${exists ? '[OK]' : '[--]'} ${relativePath}`);
  });

  // Track results
  const results: { table: string; success: number; errors: number }[] = [];

  try {
    // Import weight entries
    const weightResult = await importWeightEntries(supabase, dryRun);
    results.push({ table: 'weight_entries', ...weightResult });

    // Import workouts (both His and Her)
    const hisWorkoutResult = await importWorkouts(supabase, CSV_PATHS.hisWorkouts, 'Him', dryRun);
    results.push({ table: 'workouts (His)', ...hisWorkoutResult });

    const herWorkoutResult = await importWorkouts(supabase, CSV_PATHS.herWorkouts, 'Her', dryRun);
    results.push({ table: 'workouts (Her)', ...herWorkoutResult });

    // Import meals
    const mealsResult = await importMeals(supabase, dryRun);
    results.push({ table: 'meals', ...mealsResult });

    // Import pantry items
    const pantryResult = await importPantryItems(supabase, dryRun);
    results.push({ table: 'pantry_items', ...pantryResult });

    // Import grocery items
    const groceryResult = await importGroceryItems(supabase, dryRun);
    results.push({ table: 'grocery_items', ...groceryResult });

  } catch (error) {
    console.error('\nFatal error during import:', error);
    process.exit(1);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalErrors = 0;

  results.forEach(({ table, success, errors }) => {
    totalSuccess += success;
    totalErrors += errors;
    const status = errors > 0 ? '[ERRORS]' : success > 0 ? '[OK]' : '[SKIP]';
    console.log(`  ${status.padEnd(10)} ${table.padEnd(20)} ${success} imported, ${errors} errors`);
  });

  console.log('-'.repeat(60));
  console.log(`  Total: ${totalSuccess} records imported, ${totalErrors} errors`);

  if (dryRun) {
    console.log('\n*** This was a DRY RUN - no changes were made ***');
    console.log('Run without --dry-run flag to perform actual import.');
  }

  console.log('\nDone!');
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
