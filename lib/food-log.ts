/**
 * Food Log Storage Utility
 * Manages food entries using Supabase with localStorage fallback
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { safeLocalStorageSet, StorageError } from './utils';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  personId: string;
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize?: string;
  createdAt: string;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecentFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize?: string;
}

const FOOD_LOG_KEY = 'fitness-tracker-food-log';
const NUTRITION_TARGETS_KEY = 'fitness-tracker-nutrition-targets';
const RECENT_FOODS_KEY = 'fitness-tracker-recent-foods';
const MAX_RECENT_FOODS = 5;

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  protein: 160,
  carbs: 200,
  fat: 65,
  fiber: 30,
};

function generateFoodEntryId(): string {
  return `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to convert between local FoodEntry and Supabase meals table format
function toSupabaseFormat(entry: Omit<FoodEntry, 'id' | 'createdAt'>) {
  return {
    person_id: entry.personId,
    date: entry.date,
    meal_type: entry.mealType,
    name: entry.name,
    calories: entry.calories,
    protein_g: entry.protein,
    carbs_g: entry.carbs,
    fat_g: entry.fat,
    fiber_g: entry.fiber,
    description: entry.servingSize,
  };
}

function fromSupabaseFormat(row: Record<string, unknown>): FoodEntry {
  return {
    id: row.id as string,
    personId: row.person_id as string,
    date: row.date as string,
    mealType: row.meal_type as MealType,
    name: row.name as string,
    calories: (row.calories as number) || 0,
    protein: (row.protein_g as number) || 0,
    carbs: (row.carbs_g as number) || 0,
    fat: (row.fat_g as number) || 0,
    fiber: (row.fiber_g as number) || 0,
    servingSize: row.description as string | undefined,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// ASYNC SUPABASE FUNCTIONS (Primary)
// ============================================================================

/**
 * Fetch food entries for a date and optional person from Supabase
 * @param date - Date in YYYY-MM-DD format
 * @param personId - Optional person ID filter
 * @param limit - Optional limit for pagination (default: 100, max for a day)
 */
export async function fetchFoodEntriesForDate(
  date: string,
  personId?: string,
  limit: number = 100
): Promise<FoodEntry[]> {
  if (!isSupabaseConfigured()) {
    return getFoodEntriesForDate(date, personId);
  }

  try {
    let query = getSupabase()
      .from('meals')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (personId) {
      query = query.eq('person_id', personId);
    }

    const { data, error } = await query;

    if (error) {
      return getFoodEntriesForDate(date, personId);
    }

    return (data || []).map(fromSupabaseFormat);
  } catch {
    return getFoodEntriesForDate(date, personId);
  }
}

/**
 * Save a food entry to Supabase
 */
export async function saveFoodEntry(
  entry: Omit<FoodEntry, 'id' | 'createdAt'>
): Promise<FoodEntry> {
  if (!isSupabaseConfigured()) {
    return addFoodEntry(entry);
  }

  try {
    const { data, error } = await getSupabase()
      .from('meals')
      .insert([toSupabaseFormat(entry)])
      .select()
      .single();

    if (error) {
      return addFoodEntry(entry);
    }

    // Add to recent foods
    addRecentFood({
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      servingSize: entry.servingSize,
    }, entry.personId);

    return fromSupabaseFormat(data);
  } catch {
    return addFoodEntry(entry);
  }
}

/**
 * Update a food entry in Supabase
 */
export async function updateFoodEntryAsync(
  id: string,
  updates: Partial<Omit<FoodEntry, 'id' | 'createdAt'>>
): Promise<FoodEntry | null> {
  if (!isSupabaseConfigured()) {
    return updateFoodEntry(id, updates);
  }

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.mealType !== undefined) supabaseUpdates.meal_type = updates.mealType;
    if (updates.calories !== undefined) supabaseUpdates.calories = updates.calories;
    if (updates.protein !== undefined) supabaseUpdates.protein_g = updates.protein;
    if (updates.carbs !== undefined) supabaseUpdates.carbs_g = updates.carbs;
    if (updates.fat !== undefined) supabaseUpdates.fat_g = updates.fat;
    if (updates.fiber !== undefined) supabaseUpdates.fiber_g = updates.fiber;
    if (updates.servingSize !== undefined) supabaseUpdates.description = updates.servingSize;

    const { data, error } = await getSupabase()
      .from('meals')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return updateFoodEntry(id, updates);
    }

    return fromSupabaseFormat(data);
  } catch {
    return updateFoodEntry(id, updates);
  }
}

/**
 * Delete a food entry from Supabase
 */
export async function removeFoodEntry(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteFoodEntry(id);
  }

  try {
    const { error } = await getSupabase()
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) {
      return deleteFoodEntry(id);
    }

    return true;
  } catch {
    return deleteFoodEntry(id);
  }
}

/**
 * Calculate daily totals from Supabase (optimized to fetch only macro fields)
 */
export async function fetchDailyTotals(
  date: string,
  personId?: string
): Promise<DailyTotals> {
  if (!isSupabaseConfigured()) {
    return calculateDailyTotals(date, personId);
  }

  try {
    // Optimized query: only fetch the fields we need for totals
    let query = getSupabase()
      .from('meals')
      .select('calories, protein_g, carbs_g, fat_g, fiber_g')
      .eq('date', date);

    if (personId) {
      query = query.eq('person_id', personId);
    }

    const { data, error } = await query;

    if (error) {
      return calculateDailyTotals(date, personId);
    }

    return (data || []).reduce(
      (totals, row) => ({
        calories: totals.calories + ((row.calories as number) || 0),
        protein: totals.protein + ((row.protein_g as number) || 0),
        carbs: totals.carbs + ((row.carbs_g as number) || 0),
        fat: totals.fat + ((row.fat_g as number) || 0),
        fiber: totals.fiber + ((row.fiber_g as number) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  } catch {
    return calculateDailyTotals(date, personId);
  }
}

/**
 * Fetch food entries grouped by meal type from Supabase
 */
export async function fetchFoodEntriesGroupedByMeal(
  date: string,
  personId?: string
): Promise<Record<MealType, FoodEntry[]>> {
  const entries = await fetchFoodEntriesForDate(date, personId);
  const grouped: Record<MealType, FoodEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  entries.forEach((entry) => {
    grouped[entry.mealType].push(entry);
  });

  // Sort entries within each meal by creation time
  Object.keys(grouped).forEach((mealType) => {
    grouped[mealType as MealType].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  return grouped;
}

// ============================================================================
// SYNC LOCALSTORAGE FUNCTIONS (Fallback)
// ============================================================================

export function getAllFoodEntries(): FoodEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(FOOD_LOG_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as FoodEntry[];
  } catch {
    return [];
  }
}

export function getFoodEntriesForDate(date: string, personId?: string): FoodEntry[] {
  const allEntries = getAllFoodEntries();
  return allEntries
    .filter((entry) => {
      if (entry.date !== date) return false;
      if (personId && entry.personId !== personId) return false;
      return true;
    })
    .sort((a, b) => {
      const mealOrder: Record<MealType, number> = {
        breakfast: 0,
        lunch: 1,
        dinner: 2,
        snack: 3,
      };
      const mealDiff = mealOrder[a.mealType] - mealOrder[b.mealType];
      if (mealDiff !== 0) return mealDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function getFoodEntriesGroupedByMeal(
  date: string,
  personId?: string
): Record<MealType, FoodEntry[]> {
  const entries = getFoodEntriesForDate(date, personId);
  const grouped: Record<MealType, FoodEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  entries.forEach((entry) => {
    grouped[entry.mealType].push(entry);
  });

  return grouped;
}

export function addFoodEntry(
  entry: Omit<FoodEntry, 'id' | 'createdAt'>
): FoodEntry {
  const entries = getAllFoodEntries();

  const newEntry: FoodEntry = {
    ...entry,
    id: generateFoodEntryId(),
    createdAt: new Date().toISOString(),
  };

  entries.push(newEntry);

  try {
    safeLocalStorageSet(FOOD_LOG_KEY, JSON.stringify(entries));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old food entries to save new ones.');
    }
    throw new Error('Failed to save food entry');
  }

  // Add to recent foods
  addRecentFood({
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    servingSize: entry.servingSize,
  }, entry.personId);

  return newEntry;
}

export function updateFoodEntry(
  id: string,
  updates: Partial<Omit<FoodEntry, 'id' | 'createdAt'>>
): FoodEntry | null {
  const entries = getAllFoodEntries();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    return null;
  }

  const updatedEntry: FoodEntry = {
    ...entries[index],
    ...updates,
  };

  entries[index] = updatedEntry;

  try {
    safeLocalStorageSet(FOOD_LOG_KEY, JSON.stringify(entries));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old food entries.');
    }
    throw new Error('Failed to update food entry');
  }

  return updatedEntry;
}

export function deleteFoodEntry(id: string): boolean {
  const entries = getAllFoodEntries();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    return false;
  }

  entries.splice(index, 1);

  try {
    safeLocalStorageSet(FOOD_LOG_KEY, JSON.stringify(entries));
  } catch {
    throw new Error('Failed to delete food entry');
  }

  return true;
}

export function getFoodEntryById(id: string): FoodEntry | null {
  const entries = getAllFoodEntries();
  return entries.find((e) => e.id === id) || null;
}

export function calculateDailyTotals(date: string, personId?: string): DailyTotals {
  const entries = getFoodEntriesForDate(date, personId);

  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
      fiber: totals.fiber + entry.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function getRemainingMacros(
  date: string,
  targets: NutritionTargets = DEFAULT_TARGETS,
  personId?: string
): DailyTotals {
  const totals = calculateDailyTotals(date, personId);

  return {
    calories: Math.max(0, targets.calories - totals.calories),
    protein: Math.max(0, targets.protein - totals.protein),
    carbs: Math.max(0, targets.carbs - totals.carbs),
    fat: Math.max(0, targets.fat - totals.fat),
    fiber: Math.max(0, targets.fiber - totals.fiber),
  };
}

export function getNutritionTargets(): NutritionTargets {
  if (typeof window === 'undefined') {
    return DEFAULT_TARGETS;
  }

  try {
    const stored = localStorage.getItem(NUTRITION_TARGETS_KEY);
    if (!stored) {
      return DEFAULT_TARGETS;
    }
    return { ...DEFAULT_TARGETS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_TARGETS;
  }
}

export function saveNutritionTargets(targets: NutritionTargets): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    safeLocalStorageSet(NUTRITION_TARGETS_KEY, JSON.stringify(targets));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Cannot save nutrition targets.');
    }
    throw new Error('Failed to save nutrition targets');
  }
}

export function getProgressPercentage(
  current: number,
  target: number
): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function getProgressStatus(
  current: number,
  target: number
): 'green' | 'yellow' | 'red' {
  if (target <= 0) {
    return current > 0 ? 'red' : 'green';
  }
  const percentage = (current / target) * 100;
  if (percentage > 100) return 'red';
  if (percentage >= 80) return 'yellow';
  return 'green';
}

export function clearAllFoodEntries(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(FOOD_LOG_KEY);
  } catch {
    // Silently fail on clear
  }
}

function getRecentFoodsKey(personId?: string): string {
  return personId ? `${RECENT_FOODS_KEY}-${personId}` : RECENT_FOODS_KEY;
}

export function getRecentFoods(personId?: string): RecentFood[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const key = getRecentFoodsKey(personId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as RecentFood[];
  } catch {
    return [];
  }
}

export function addRecentFood(food: RecentFood, personId?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const recentFoods = getRecentFoods(personId);

    const filteredFoods = recentFoods.filter(
      (f) => f.name.toLowerCase() !== food.name.toLowerCase()
    );

    filteredFoods.unshift(food);

    const trimmedFoods = filteredFoods.slice(0, MAX_RECENT_FOODS);

    const key = getRecentFoodsKey(personId);
    safeLocalStorageSet(key, JSON.stringify(trimmedFoods));
  } catch (error) {
    // Log error for debugging but don't block the user
    console.warn('[FoodLog] Failed to save recent food:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export function clearRecentFoods(personId?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getRecentFoodsKey(personId);
    localStorage.removeItem(key);
  } catch {
    // Silently fail on clear
  }
}

// ============================================================================
// OFFLINE SYNC FUNCTIONS
// ============================================================================

const PENDING_SYNC_KEY = 'fitness-tracker-pending-food-sync';

interface PendingSyncEntry {
  entry: Omit<FoodEntry, 'id' | 'createdAt'>;
  localId: string;
  timestamp: number;
}

/**
 * Get pending entries that need to be synced to Supabase
 */
export function getPendingSyncEntries(): PendingSyncEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as PendingSyncEntry[];
  } catch {
    return [];
  }
}

/**
 * Add an entry to the pending sync queue
 */
export function addPendingSyncEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>, localId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const pending = getPendingSyncEntries();
    pending.push({
      entry,
      localId,
      timestamp: Date.now(),
    });
    safeLocalStorageSet(PENDING_SYNC_KEY, JSON.stringify(pending));
  } catch (error) {
    console.warn('[FoodLog] Failed to queue entry for sync:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Remove an entry from the pending sync queue
 */
export function removePendingSyncEntry(localId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const pending = getPendingSyncEntries();
    const filtered = pending.filter((p) => p.localId !== localId);
    safeLocalStorageSet(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch {
    // Silently fail
  }
}

/**
 * Sync pending localStorage entries to Supabase
 * Call this when the app comes back online or Supabase becomes available
 * Returns the number of entries successfully synced
 */
export async function syncPendingEntriesToSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const pending = getPendingSyncEntries();
  if (pending.length === 0) {
    return 0;
  }

  let syncedCount = 0;

  for (const item of pending) {
    try {
      const { error } = await getSupabase()
        .from('meals')
        .insert([toSupabaseFormat(item.entry)]);

      if (!error) {
        removePendingSyncEntry(item.localId);
        syncedCount++;
      }
    } catch {
      // Continue trying other entries
      console.warn('[FoodLog] Failed to sync entry:', item.localId);
    }
  }

  if (syncedCount > 0) {
    console.info(`[FoodLog] Synced ${syncedCount} offline entries to Supabase`);
  }

  return syncedCount;
}

/**
 * Check if there are pending entries to sync
 */
export function hasPendingSyncEntries(): boolean {
  return getPendingSyncEntries().length > 0;
}
