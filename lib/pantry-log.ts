/**
 * Pantry Log Storage Utility
 * Manages pantry items using Supabase with localStorage fallback
 */

import type { PantryItem } from './types';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { safeLocalStorageSet, StorageError } from './utils';

const PANTRY_LOG_KEY = 'fitness-tracker-pantry-log';
const PANTRY_INITIALIZED_KEY = 'fitness-tracker-pantry-initialized';

function generatePantryItemId(): string {
  return `pantry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// ASYNC SUPABASE FUNCTIONS (Primary)
// ============================================================================

/**
 * Fetch all pantry items from Supabase
 */
export async function fetchAllPantryItems(): Promise<PantryItem[]> {
  if (!isSupabaseConfigured()) {
    return getAllPantryItems();
  }

  try {
    const { data, error } = await getSupabase()
      .from('pantry_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return getAllPantryItems();
    }

    return data as PantryItem[];
  } catch {
    return getAllPantryItems();
  }
}

/**
 * Save a new pantry item to Supabase
 */
export async function savePantryItem(
  item: Omit<PantryItem, 'id' | 'created_at'>
): Promise<PantryItem> {
  if (!isSupabaseConfigured()) {
    return addPantryItem(item);
  }

  try {
    const { data, error } = await getSupabase()
      .from('pantry_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      return addPantryItem(item);
    }

    return data as PantryItem;
  } catch {
    return addPantryItem(item);
  }
}

/**
 * Update a pantry item in Supabase
 */
export async function updatePantryItemAsync(
  id: string,
  updates: Partial<Omit<PantryItem, 'id' | 'created_at'>>
): Promise<PantryItem | null> {
  if (!isSupabaseConfigured()) {
    return updatePantryItem(id, updates);
  }

  try {
    const { data, error } = await getSupabase()
      .from('pantry_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return updatePantryItem(id, updates);
    }

    return data as PantryItem;
  } catch {
    return updatePantryItem(id, updates);
  }
}

/**
 * Update pantry item quantity in Supabase
 */
export async function updatePantryItemQuantityAsync(
  id: string,
  delta: number
): Promise<PantryItem | null> {
  if (!isSupabaseConfigured()) {
    return updatePantryItemQuantity(id, delta);
  }

  try {
    // First get current quantity
    const { data: current, error: fetchError } = await getSupabase()
      .from('pantry_items')
      .select('quantity')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return updatePantryItemQuantity(id, delta);
    }

    const newQuantity = Math.max(0, (current.quantity as number) + delta);

    const { data, error } = await getSupabase()
      .from('pantry_items')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return updatePantryItemQuantity(id, delta);
    }

    return data as PantryItem;
  } catch {
    return updatePantryItemQuantity(id, delta);
  }
}

/**
 * Delete a pantry item from Supabase
 */
export async function removePantryItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deletePantryItem(id);
  }

  try {
    const { error } = await getSupabase()
      .from('pantry_items')
      .delete()
      .eq('id', id);

    if (error) {
      return deletePantryItem(id);
    }

    return true;
  } catch {
    return deletePantryItem(id);
  }
}

/**
 * Fetch low stock items from Supabase
 */
export async function fetchLowStockItems(): Promise<PantryItem[]> {
  if (!isSupabaseConfigured()) {
    return getLowStockPantryItems();
  }

  try {
    const { data, error } = await getSupabase()
      .from('pantry_items')
      .select('*')
      .not('low_stock_threshold', 'is', null);

    if (error) {
      return getLowStockPantryItems();
    }

    // Filter where quantity <= threshold
    return (data || []).filter(
      (item) => item.quantity <= item.low_stock_threshold
    ) as PantryItem[];
  } catch {
    return getLowStockPantryItems();
  }
}

/**
 * Fetch expiring items from Supabase
 */
export async function fetchExpiringItems(daysThreshold: number = 7): Promise<PantryItem[]> {
  if (!isSupabaseConfigured()) {
    return getExpiringPantryItems(daysThreshold);
  }

  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await getSupabase()
      .from('pantry_items')
      .select('*')
      .not('expires_at', 'is', null)
      .gte('expires_at', today.toISOString().split('T')[0])
      .lte('expires_at', futureDate.toISOString().split('T')[0]);

    if (error) {
      return getExpiringPantryItems(daysThreshold);
    }

    return data as PantryItem[];
  } catch {
    return getExpiringPantryItems(daysThreshold);
  }
}

// ============================================================================
// SYNC LOCALSTORAGE FUNCTIONS (Fallback)
// ============================================================================

export function isPantryInitialized(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(PANTRY_INITIALIZED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markPantryInitialized(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(PANTRY_INITIALIZED_KEY, 'true');
  } catch {
    // Ignore storage errors for flag
  }
}

export function getAllPantryItems(): PantryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(PANTRY_LOG_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as PantryItem[];
  } catch {
    return [];
  }
}

export function saveAllPantryItems(items: PantryItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    safeLocalStorageSet(PANTRY_LOG_KEY, JSON.stringify(items));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some items to save changes.');
    }
    throw new Error('Failed to save pantry changes');
  }
}

export function initializePantryWithDemoData(demoItems: PantryItem[]): PantryItem[] {
  if (typeof window === 'undefined') {
    return demoItems;
  }

  // If Supabase is configured, don't use demo data
  if (isSupabaseConfigured()) {
    return [];
  }

  // Check if already initialized
  if (isPantryInitialized()) {
    const existingItems = getAllPantryItems();
    if (existingItems.length > 0) {
      return existingItems;
    }
  }

  // Initialize with demo data
  saveAllPantryItems(demoItems);
  markPantryInitialized();
  return demoItems;
}

export function addPantryItem(
  item: Omit<PantryItem, 'id' | 'created_at'>
): PantryItem {
  const items = getAllPantryItems();

  const newItem: PantryItem = {
    ...item,
    id: generatePantryItemId(),
    created_at: new Date().toISOString(),
  };

  items.push(newItem);

  try {
    safeLocalStorageSet(PANTRY_LOG_KEY, JSON.stringify(items));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some items to save new ones.');
    }
    throw new Error('Failed to save pantry item');
  }

  return newItem;
}

export function updatePantryItem(
  id: string,
  updates: Partial<Omit<PantryItem, 'id' | 'created_at'>>
): PantryItem | null {
  const items = getAllPantryItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updatedItem: PantryItem = {
    ...items[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  items[index] = updatedItem;

  try {
    safeLocalStorageSet(PANTRY_LOG_KEY, JSON.stringify(items));
  } catch (error) {
    if (error instanceof StorageError && error.type === 'quota_exceeded') {
      throw new Error('Storage full. Please delete some items.');
    }
    throw new Error('Failed to update pantry item');
  }

  return updatedItem;
}

export function updatePantryItemQuantity(
  id: string,
  delta: number
): PantryItem | null {
  const items = getAllPantryItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const newQuantity = Math.max(0, items[index].quantity + delta);
  items[index] = {
    ...items[index],
    quantity: newQuantity,
    updated_at: new Date().toISOString(),
  };

  try {
    safeLocalStorageSet(PANTRY_LOG_KEY, JSON.stringify(items));
  } catch {
    throw new Error('Failed to update quantity');
  }

  return items[index];
}

export function deletePantryItem(id: string): boolean {
  const items = getAllPantryItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  items.splice(index, 1);

  try {
    safeLocalStorageSet(PANTRY_LOG_KEY, JSON.stringify(items));
  } catch {
    throw new Error('Failed to delete pantry item');
  }

  return true;
}

export function getPantryItemById(id: string): PantryItem | null {
  const items = getAllPantryItems();
  return items.find((item) => item.id === id) || null;
}

export function getLowStockPantryItems(): PantryItem[] {
  const items = getAllPantryItems();
  return items.filter((item) => {
    if (item.low_stock_threshold === undefined) return false;
    return item.quantity <= item.low_stock_threshold;
  });
}

export function getPantryItemsByCategory(category: string): PantryItem[] {
  const items = getAllPantryItems();
  return items.filter((item) => item.category === category);
}

export function getExpiringPantryItems(daysThreshold: number = 7): PantryItem[] {
  const items = getAllPantryItems();
  const today = new Date();

  return items.filter((item) => {
    if (!item.expires_at) return false;
    const expiryDate = new Date(item.expires_at);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
  });
}

export function clearAllPantryItems(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(PANTRY_LOG_KEY);
    localStorage.removeItem(PANTRY_INITIALIZED_KEY);
  } catch {
    // Silently fail on clear
  }
}
