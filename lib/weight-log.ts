/**
 * Weight Log Storage Utility
 * Manages weight entries using Supabase with localStorage fallback
 */

import type { WeightEntry } from './types';
import { format, parseISO, startOfDay } from 'date-fns';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { safeLocalStorageSet, StorageError } from './utils';

const WEIGHT_LOG_KEY = 'fitness-tracker-weight-log';

/**
 * Generate a unique ID for weight entries (localStorage fallback)
 */
function generateWeightEntryId(): string {
  return `weight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// ASYNC SUPABASE FUNCTIONS (Primary)
// ============================================================================

/**
 * Get all weight entries for a person from Supabase
 */
export async function fetchWeightEntriesForPerson(personId: string): Promise<WeightEntry[]> {
  if (!isSupabaseConfigured()) {
    return getWeightEntriesForPerson(personId);
  }

  try {
    const { data, error } = await getSupabase()
      .from('weight_entries')
      .select('*')
      .eq('person_id', personId)
      .order('date', { ascending: false });

    if (error) {
      return getWeightEntriesForPerson(personId);
    }

    return data as WeightEntry[];
  } catch {
    return getWeightEntriesForPerson(personId);
  }
}

/**
 * Get weight entries in a date range from Supabase
 */
export async function fetchWeightEntriesInRange(
  personId: string,
  startDate: string,
  endDate: string
): Promise<WeightEntry[]> {
  if (!isSupabaseConfigured()) {
    return getWeightEntriesInRange(personId, startDate, endDate);
  }

  try {
    const { data, error } = await getSupabase()
      .from('weight_entries')
      .select('*')
      .eq('person_id', personId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      return getWeightEntriesInRange(personId, startDate, endDate);
    }

    return data as WeightEntry[];
  } catch {
    return getWeightEntriesInRange(personId, startDate, endDate);
  }
}

/**
 * Save a weight entry to Supabase
 */
export async function saveWeightEntry(
  entry: Omit<WeightEntry, 'id' | 'created_at'>
): Promise<WeightEntry> {
  if (!isSupabaseConfigured()) {
    return addWeightEntry(entry);
  }

  try {
    // Check if entry exists for this person and date (upsert)
    const { data: existing } = await getSupabase()
      .from('weight_entries')
      .select('id')
      .eq('person_id', entry.person_id)
      .eq('date', entry.date)
      .single();

    if (existing) {
      // Update existing entry
      const { data, error } = await getSupabase()
        .from('weight_entries')
        .update({
          weight_lbs: entry.weight_lbs,
          notes: entry.notes,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as WeightEntry;
    } else {
      // Insert new entry
      const { data, error } = await getSupabase()
        .from('weight_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data as WeightEntry;
    }
  } catch {
    // Fall back to localStorage
    return addWeightEntry(entry);
  }
}

/**
 * Delete a weight entry from Supabase
 */
export async function removeWeightEntry(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteWeightEntry(id);
  }

  try {
    const { error } = await getSupabase()
      .from('weight_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return deleteWeightEntry(id);
    }

    return true;
  } catch {
    return deleteWeightEntry(id);
  }
}

/**
 * Get the latest weight entry for a person
 */
export async function fetchLatestWeightEntry(personId: string): Promise<WeightEntry | null> {
  if (!isSupabaseConfigured()) {
    return getLatestWeightEntry(personId);
  }

  try {
    const { data, error } = await getSupabase()
      .from('weight_entries')
      .select('*')
      .eq('person_id', personId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      return getLatestWeightEntry(personId);
    }

    return data as WeightEntry;
  } catch {
    return getLatestWeightEntry(personId);
  }
}

// ============================================================================
// SYNC LOCALSTORAGE FUNCTIONS (Fallback)
// ============================================================================

/**
 * Get all weight entries from localStorage
 */
export function getAllWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(WEIGHT_LOG_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as WeightEntry[];
  } catch {
    return [];
  }
}

/**
 * Get weight entries for a specific person (localStorage)
 */
export function getWeightEntriesForPerson(personId: string): WeightEntry[] {
  const allEntries = getAllWeightEntries();
  return allEntries
    .filter((entry) => entry.person_id === personId)
    .sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * Get weight entries for a specific person on a specific date
 */
export function getWeightEntriesForPersonAndDate(
  personId: string,
  date: string
): WeightEntry[] {
  const personEntries = getWeightEntriesForPerson(personId);
  return personEntries.filter((entry) => entry.date === date);
}

/**
 * Add a new weight entry (localStorage)
 */
export function addWeightEntry(
  entry: Omit<WeightEntry, 'id' | 'created_at'>
): WeightEntry {
  const entries = getAllWeightEntries();

  const newEntry: WeightEntry = {
    ...entry,
    id: generateWeightEntryId(),
    created_at: new Date().toISOString(),
  };

  entries.push(newEntry);

  try {
    safeLocalStorageSet(WEIGHT_LOG_KEY, JSON.stringify(entries));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old weight entries to save new ones.');
    }
    throw new Error('Failed to save weight entry');
  }

  return newEntry;
}

/**
 * Update an existing weight entry (localStorage)
 */
export function updateWeightEntry(
  id: string,
  updates: Partial<Omit<WeightEntry, 'id' | 'created_at'>>
): WeightEntry | null {
  const entries = getAllWeightEntries();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    return null;
  }

  const updatedEntry: WeightEntry = {
    ...entries[index],
    ...updates,
  };

  entries[index] = updatedEntry;

  try {
    safeLocalStorageSet(WEIGHT_LOG_KEY, JSON.stringify(entries));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some old weight entries.');
    }
    throw new Error('Failed to update weight entry');
  }

  return updatedEntry;
}

/**
 * Delete a weight entry (localStorage)
 */
export function deleteWeightEntry(id: string): boolean {
  const entries = getAllWeightEntries();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    return false;
  }

  entries.splice(index, 1);

  try {
    safeLocalStorageSet(WEIGHT_LOG_KEY, JSON.stringify(entries));
  } catch {
    throw new Error('Failed to delete weight entry');
  }

  return true;
}

/**
 * Get a single weight entry by ID (localStorage)
 */
export function getWeightEntryById(id: string): WeightEntry | null {
  const entries = getAllWeightEntries();
  return entries.find((e) => e.id === id) || null;
}

/**
 * Get the most recent weight entry for a person (localStorage)
 */
export function getLatestWeightEntry(personId: string): WeightEntry | null {
  const personEntries = getWeightEntriesForPerson(personId);
  return personEntries.length > 0 ? personEntries[0] : null;
}

/**
 * Get weight entries for a person within a date range (localStorage)
 */
export function getWeightEntriesInRange(
  personId: string,
  startDate: string,
  endDate: string
): WeightEntry[] {
  const personEntries = getWeightEntriesForPerson(personId);
  const start = startOfDay(parseISO(startDate)).getTime();
  const end = startOfDay(parseISO(endDate)).getTime();

  return personEntries.filter((entry) => {
    const entryDate = startOfDay(parseISO(entry.date)).getTime();
    return entryDate >= start && entryDate <= end;
  });
}

/**
 * Calculate weight change over a period
 */
export function calculateWeightChange(
  personId: string,
  days: number = 7
): { current: number; previous: number; change: number } | null {
  const entries = getWeightEntriesForPerson(personId);

  if (entries.length === 0) {
    return null;
  }

  const current = entries[0].weight_lbs;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  const previousEntry = entries.find((e) => e.date <= targetDateStr);
  const previous = previousEntry?.weight_lbs ?? current;

  return {
    current,
    previous,
    change: current - previous,
  };
}

/**
 * Clear all weight entries (for testing/reset purposes)
 */
export function clearAllWeightEntries(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(WEIGHT_LOG_KEY);
  } catch {
    // Silently fail on clear
  }
}

/**
 * Check if a weight entry exists for a person on a specific date
 */
export function hasWeightEntryForDate(personId: string, date: string): boolean {
  const entries = getWeightEntriesForPersonAndDate(personId, date);
  return entries.length > 0;
}
