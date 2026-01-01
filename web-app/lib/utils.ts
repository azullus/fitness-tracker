import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Calculate BMI from weight (lbs) and height (inches)
 */
export function calculateBMI(weightLbs: number, heightInches: number): number {
  return (weightLbs / (heightInches * heightInches)) * 703;
}

/**
 * Format weight with proper precision
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} lbs`;
}

/**
 * Calculate percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Check if an item is low in stock
 */
export function isLowStock(quantity: number, threshold: number = 2): boolean {
  return quantity <= threshold;
}

/**
 * Format macros for display
 */
export function formatMacros(protein: number, carbs: number, fat: number): string {
  return `P: ${protein}g | C: ${carbs}g | F: ${fat}g`;
}

/**
 * Calculate total calories from macros
 */
export function calculateCalories(protein: number, carbs: number, fat: number): number {
  return (protein * 4) + (carbs * 4) + (fat * 9);
}

/**
 * Storage error types for better error handling
 */
export type StorageErrorType = 'quota_exceeded' | 'unavailable' | 'parse_error' | 'unknown';

export class StorageError extends Error {
  type: StorageErrorType;

  constructor(message: string, type: StorageErrorType) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
  }
}

/**
 * Check if error is a quota exceeded error
 */
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Different browsers report this differently
    return (
      error.code === 22 || // Legacy code
      error.code === 1014 || // Firefox
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return false;
}

/**
 * Safely save to localStorage with quota handling
 * Returns true on success, throws StorageError on failure
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    throw new StorageError('localStorage is not available', 'unavailable');
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      throw new StorageError(
        'Storage quota exceeded. Please delete some data to free up space.',
        'quota_exceeded'
      );
    }
    throw new StorageError(
      'Failed to save data to storage',
      'unknown'
    );
  }
}

/**
 * Safely get from localStorage with error handling
 * Returns null if key doesn't exist or on error
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Get estimated localStorage usage in bytes
 */
export function getLocalStorageUsage(): { used: number; total: number; percentage: number } {
  if (typeof window === 'undefined') {
    return { used: 0, total: 0, percentage: 0 };
  }

  try {
    let total = 0;
    // Use localStorage.length and localStorage.key() for safer iteration
    // Direct property access can throw in some environments (Safari private browsing)
    const length = localStorage.length;
    for (let i = 0; i < length; i++) {
      try {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            total += (value.length + key.length) * 2; // UTF-16 = 2 bytes per char
          }
        }
      } catch {
        // Skip items that can't be read
        continue;
      }
    }
    // Most browsers allow ~5MB
    const maxStorage = 5 * 1024 * 1024;
    return {
      used: total,
      total: maxStorage,
      percentage: Math.round((total / maxStorage) * 100),
    };
  } catch {
    return { used: 0, total: 0, percentage: 0 };
  }
}
