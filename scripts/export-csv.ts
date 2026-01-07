#!/usr/bin/env tsx
/**
 * export-csv.ts
 *
 * Exports data from Supabase database to CSV files in the FITNESS-TRACKER directory.
 * Creates backup files before overwriting existing CSVs.
 *
 * Usage:
 *   npm run sync:export                    # Export all tables
 *   npm run sync:export -- --table weight  # Export specific table
 *   npm run sync:export -- --since 7       # Export data from last 7 days
 *
 * CSV Output Locations (relative to FITNESS-TRACKER/):
 *   - Tracking/weight-tracker.csv
 *   - Tracking/his-workout-checklist.csv
 *   - Tracking/her-workout-checklist.csv
 *   - Tracking/weekly-meals.csv
 *   - Pantry/pantry-inventory.csv
 *   - Tracking/grocery-checklist.csv
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove surrounding quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
let tableFilter: string | null = null;
let sinceDays: number | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--table' && args[i + 1]) {
    tableFilter = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--since' && args[i + 1]) {
    sinceDays = parseInt(args[i + 1], 10);
    if (isNaN(sinceDays)) {
      console.error('Error: --since must be a number');
      process.exit(1);
    }
    i++;
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Base paths
const FITNESS_TRACKER_DIR = path.resolve(__dirname, '..', '..');
const TRACKING_DIR = path.join(FITNESS_TRACKER_DIR, 'Tracking');
const PANTRY_DIR = path.join(FITNESS_TRACKER_DIR, 'Pantry');

// Ensure directories exist
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Create backup of existing file
function backupFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + '.bak';
    fs.copyFileSync(filePath, backupPath);
    console.log(`  Backed up existing file to: ${path.basename(backupPath)}`);
  }
}

// Calculate date filter for --since flag
function getSinceDate(): string | null {
  if (sinceDays === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - sinceDays);
  return date.toISOString().split('T')[0];
}

// Interface for person lookup
interface Person {
  id: string;
  name: string;
}

// Fetch persons for ID-to-name lookup
async function fetchPersons(): Promise<Map<string, Person>> {
  const { data, error } = await supabase
    .from('persons')
    .select('id, name');

  if (error) {
    console.error('Error fetching persons:', error.message);
    return new Map();
  }

  const personMap = new Map<string, Person>();
  for (const person of data || []) {
    personMap.set(person.id, person);
  }
  return personMap;
}

// Export weight entries
async function exportWeightEntries(persons: Map<string, Person>): Promise<void> {
  console.log('\n[Weight Entries]');

  const sinceDate = getSinceDate();
  let query = supabase
    .from('weight_entries')
    .select('date, person_id, weight_lbs, notes')
    .order('date', { ascending: true });

  if (sinceDate) {
    query = query.gte('date', sinceDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  No data to export');
    return;
  }

  // Transform data - resolve person_id to person name
  const csvData = data.map((row) => ({
    date: row.date,
    person: persons.get(row.person_id)?.name || row.person_id,
    weight_lbs: row.weight_lbs,
    notes: row.notes || '',
  }));

  const headers = ['date', 'person', 'weight_lbs', 'notes'];
  const csv = stringify(csvData, { header: true, columns: headers });

  ensureDir(TRACKING_DIR);
  const filePath = path.join(TRACKING_DIR, 'weight-tracker.csv');
  backupFile(filePath);
  fs.writeFileSync(filePath, csv);
  console.log(`  Exported ${data.length} rows to: ${filePath}`);
}

// Export workouts for a specific person
async function exportWorkouts(
  persons: Map<string, Person>,
  personName: string,
  fileName: string
): Promise<void> {
  console.log(`\n[Workouts - ${personName}]`);

  // Find person ID by name
  let personId: string | null = null;
  Array.from(persons.entries()).forEach(([id, person]) => {
    if (person.name.toLowerCase() === personName.toLowerCase()) {
      personId = id;
    }
  });

  if (!personId) {
    console.log(`  Person "${personName}" not found in database`);
    return;
  }

  const sinceDate = getSinceDate();
  let query = supabase
    .from('workouts')
    .select('date, type, exercises, duration_minutes, intensity, completed, notes')
    .eq('person_id', personId)
    .order('date', { ascending: true });

  if (sinceDate) {
    query = query.gte('date', sinceDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  No data to export');
    return;
  }

  // Transform data - serialize exercises JSON to string
  const csvData = data.map((row) => ({
    date: row.date,
    type: row.type,
    exercises: typeof row.exercises === 'string'
      ? row.exercises
      : JSON.stringify(row.exercises || []),
    duration: row.duration_minutes || '',
    intensity: row.intensity || '',
    completed: row.completed ? 'true' : 'false',
    notes: row.notes || '',
  }));

  const headers = ['date', 'type', 'exercises', 'duration', 'intensity', 'completed', 'notes'];
  const csv = stringify(csvData, { header: true, columns: headers });

  ensureDir(TRACKING_DIR);
  const filePath = path.join(TRACKING_DIR, fileName);
  backupFile(filePath);
  fs.writeFileSync(filePath, csv);
  console.log(`  Exported ${data.length} rows to: ${filePath}`);
}

// Export meals
async function exportMeals(): Promise<void> {
  console.log('\n[Meals]');

  const sinceDate = getSinceDate();
  let query = supabase
    .from('meals')
    .select('date, meal_type, name, description, calories, protein_g, carbs_g, fat_g, fiber_g')
    .order('date', { ascending: true });

  if (sinceDate) {
    query = query.gte('date', sinceDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  No data to export');
    return;
  }

  // Transform data
  const csvData = data.map((row) => ({
    date: row.date,
    meal_type: row.meal_type,
    name: row.name,
    description: row.description || '',
    calories: row.calories ?? '',
    protein: row.protein_g ?? '',
    carbs: row.carbs_g ?? '',
    fat: row.fat_g ?? '',
    fiber: row.fiber_g ?? '',
  }));

  const headers = ['date', 'meal_type', 'name', 'description', 'calories', 'protein', 'carbs', 'fat', 'fiber'];
  const csv = stringify(csvData, { header: true, columns: headers });

  ensureDir(TRACKING_DIR);
  const filePath = path.join(TRACKING_DIR, 'weekly-meals.csv');
  backupFile(filePath);
  fs.writeFileSync(filePath, csv);
  console.log(`  Exported ${data.length} rows to: ${filePath}`);
}

// Export pantry items
async function exportPantryItems(): Promise<void> {
  console.log('\n[Pantry Items]');

  const { data, error } = await supabase
    .from('pantry_items')
    .select('name, category, quantity, unit, location, expires_at, low_stock_threshold, notes')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  No data to export');
    return;
  }

  // Transform data
  const csvData = data.map((row) => ({
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    location: row.location || '',
    expires_at: row.expires_at || '',
    low_stock_threshold: row.low_stock_threshold ?? '',
    notes: row.notes || '',
  }));

  const headers = ['name', 'category', 'quantity', 'unit', 'location', 'expires_at', 'low_stock_threshold', 'notes'];
  const csv = stringify(csvData, { header: true, columns: headers });

  ensureDir(PANTRY_DIR);
  const filePath = path.join(PANTRY_DIR, 'pantry-inventory.csv');
  backupFile(filePath);
  fs.writeFileSync(filePath, csv);
  console.log(`  Exported ${data.length} rows to: ${filePath}`);
}

// Export grocery items
async function exportGroceryItems(): Promise<void> {
  console.log('\n[Grocery Items]');

  const { data, error } = await supabase
    .from('grocery_items')
    .select('name, category, quantity, unit, store, checked, estimated_price')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  No data to export');
    return;
  }

  // Transform data
  const csvData = data.map((row) => ({
    name: row.name,
    category: row.category,
    quantity: row.quantity ?? '',
    unit: row.unit || '',
    store: row.store || '',
    checked: row.checked ? 'true' : 'false',
    estimated_price: row.estimated_price ?? '',
  }));

  const headers = ['name', 'category', 'quantity', 'unit', 'store', 'checked', 'estimated_price'];
  const csv = stringify(csvData, { header: true, columns: headers });

  ensureDir(TRACKING_DIR);
  const filePath = path.join(TRACKING_DIR, 'grocery-checklist.csv');
  backupFile(filePath);
  fs.writeFileSync(filePath, csv);
  console.log(`  Exported ${data.length} rows to: ${filePath}`);
}

// Valid table names for --table flag
const VALID_TABLES = ['weight', 'workouts', 'meals', 'pantry', 'grocery'];

// Main export function
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('FITNESS-TRACKER CSV Export');
  console.log('='.repeat(60));

  if (tableFilter) {
    if (!VALID_TABLES.includes(tableFilter)) {
      console.error(`Error: Invalid table "${tableFilter}"`);
      console.error(`Valid tables: ${VALID_TABLES.join(', ')}`);
      process.exit(1);
    }
    console.log(`Exporting table: ${tableFilter}`);
  } else {
    console.log('Exporting all tables');
  }

  if (sinceDays !== null) {
    console.log(`Filtering: last ${sinceDays} days`);
  }

  // Fetch persons lookup
  const persons = await fetchPersons();
  console.log(`Found ${persons.size} person(s) in database`);

  // Export based on filter
  const shouldExport = (table: string): boolean => !tableFilter || tableFilter === table;

  if (shouldExport('weight')) {
    await exportWeightEntries(persons);
  }

  if (shouldExport('workouts')) {
    // Export both his and her workouts
    await exportWorkouts(persons, 'Him', 'his-workout-checklist.csv');
    await exportWorkouts(persons, 'Her', 'her-workout-checklist.csv');
  }

  if (shouldExport('meals')) {
    await exportMeals();
  }

  if (shouldExport('pantry')) {
    await exportPantryItems();
  }

  if (shouldExport('grocery')) {
    await exportGroceryItems();
  }

  console.log('\n' + '='.repeat(60));
  console.log('Export complete!');
  console.log('='.repeat(60));
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
