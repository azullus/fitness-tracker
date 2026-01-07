'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import {
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
  UtensilsCrossed,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  type FoodEntry,
  type MealType,
  getFoodEntriesGroupedByMeal,
  deleteFoodEntry,
} from '@/lib/food-log';

// LocalStorage key for collapsed state
const COLLAPSED_STATE_KEY = 'foodlog-collapsed-meals';

interface FoodLogProps {
  date: string;
  personId?: string; // Filter entries by person
  onEntryDeleted?: (entry: FoodEntry) => void;
  onEntryEdit?: (entry: FoodEntry) => void;
  refreshTrigger?: number;
}

const mealTypeConfig: Record<
  MealType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
  }
> = {
  breakfast: {
    label: 'Breakfast',
    icon: Coffee,
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  lunch: {
    label: 'Lunch',
    icon: Sun,
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  dinner: {
    label: 'Dinner',
    icon: Moon,
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  snack: {
    label: 'Snacks',
    icon: Cookie,
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface FoodItemProps {
  entry: FoodEntry;
  onDelete: (entry: FoodEntry) => void;
  onEdit?: (entry: FoodEntry) => void;
}

// Swipe threshold in pixels to trigger delete
const SWIPE_THRESHOLD = 80;
// Animation duration in ms
const ANIMATION_DURATION = 300;

const FoodItem = memo(function FoodItem({ entry, onDelete, onEdit }: FoodItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingSwipeDelete, setPendingSwipeDelete] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const swipeOffsetRef = useRef(0); // Track current offset for touch end handler
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const performDelete = useCallback(() => {
    setIsDeleting(true);
    setIsAnimatingOut(true);

    // Clear any existing timeout
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }

    // Wait for animation to complete
    deleteTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return; // Guard against unmounted component
      try {
        deleteFoodEntry(entry.id);
        onDelete(entry);
      } catch {
        if (isMountedRef.current) {
          setIsAnimatingOut(false);
        }
      } finally {
        if (isMountedRef.current) {
          setIsDeleting(false);
        }
      }
    }, ANIMATION_DURATION);
  }, [entry, onDelete]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setPendingSwipeDelete(false);
    performDelete();
  }, [performDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setPendingSwipeDelete(false);
    // Reset swipe state if cancelled from swipe
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    setIsSwiping(false);
  }, []);

  // Touch event handlers for swipe-to-delete
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // Only handle horizontal swipes (left direction = negative deltaX)
    if (isHorizontalSwipe.current && deltaX < 0) {
      setIsSwiping(true);
      // Limit swipe to max threshold + some resistance
      const offset = Math.max(deltaX, -(SWIPE_THRESHOLD + 40));
      swipeOffsetRef.current = offset; // Keep ref in sync for touch end
      setSwipeOffset(offset);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Use ref for current offset value to avoid stale closure
    if (swipeOffsetRef.current < -SWIPE_THRESHOLD) {
      // Show confirmation instead of directly deleting
      setPendingSwipeDelete(true);
      setShowDeleteConfirm(true);
    }
    // Reset swipe state
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'group relative overflow-hidden rounded-lg',
        isAnimatingOut && 'animate-slide-out-right'
      )}
      style={{
        transition: isAnimatingOut
          ? `opacity ${ANIMATION_DURATION}ms ease-out, transform ${ANIMATION_DURATION}ms ease-out, max-height ${ANIMATION_DURATION}ms ease-out`
          : undefined,
        opacity: isAnimatingOut ? 0 : 1,
        transform: isAnimatingOut ? 'translateX(100%)' : undefined,
        maxHeight: isAnimatingOut ? 0 : '200px',
      }}
    >
      {/* Delete background (revealed on swipe) */}
      <div
        className={clsx(
          'absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-4',
          'transition-opacity duration-150',
          (swipeOffset < -20 || isAnimatingOut) ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: Math.abs(swipeOffset) + 20 }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Main content */}
      <div
        className={clsx(
          'relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600',
          isSwiping ? '' : 'transition-all duration-200'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {entry.name}
              </h4>
              {entry.servingSize && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {entry.servingSize}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {entry.calories} cal
              </span>
              {/* Visible delete button */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label={`Delete ${entry.name}`}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle actions"
              >
                {showActions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Macro summary */}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-blue-600 dark:text-blue-400">
              P: {entry.protein}g
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              C: {entry.carbs}g
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              F: {entry.fat}g
            </span>
            <span className="text-purple-600 dark:text-purple-400">
              Fb: {entry.fiber}g
            </span>
          </div>

          {/* Action buttons */}
          <div
            className={clsx(
              'overflow-hidden transition-all duration-200 ease-in-out',
              showActions ? 'max-h-20 opacity-100 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700' : 'max-h-0 opacity-0'
            )}
          >
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(entry)}
                  className="flex-1"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteClick}
                loading={isDeleting}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Food Entry"
        message={`Are you sure you want to delete "${entry.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
});

interface MealGroupProps {
  mealType: MealType;
  entries: FoodEntry[];
  onEntryDelete: (entry: FoodEntry) => void;
  onEntryEdit?: (entry: FoodEntry) => void;
  initialCollapsed?: boolean;
  onCollapsedChange?: (mealType: MealType, collapsed: boolean) => void;
}

// Helper to get collapsed state from localStorage
function getCollapsedState(): Record<MealType, boolean> {
  if (typeof window === 'undefined') {
    return { breakfast: false, lunch: false, dinner: false, snack: false };
  }
  try {
    const stored = localStorage.getItem(COLLAPSED_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return { breakfast: false, lunch: false, dinner: false, snack: false };
}

// Helper to save collapsed state to localStorage
function saveCollapsedState(state: Record<MealType, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COLLAPSED_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

const MealGroup = memo(function MealGroup({
  mealType,
  entries,
  onEntryDelete,
  onEntryEdit,
  initialCollapsed = false,
  onCollapsedChange,
}: MealGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const config = mealTypeConfig[mealType];
  const Icon = config.icon;

  // Sync with initial collapsed prop when it changes
  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(mealType, newCollapsed);
  }, [isCollapsed, mealType, onCollapsedChange]);

  // Calculate meal totals
  const mealTotals = useMemo(() => {
    return entries.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        protein: totals.protein + entry.protein,
        carbs: totals.carbs + entry.carbs,
        fat: totals.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Meal type header */}
      <button
        onClick={handleToggleCollapse}
        className={clsx(
          'w-full flex items-center justify-between py-2 px-1',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <div className={clsx('p-1.5 rounded-lg', config.bgColor)}>
            <Icon className={clsx('w-4 h-4', config.iconColor)} />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            {config.label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({entries.length} {entries.length === 1 ? 'item' : 'items'})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {mealTotals.calories} cal
          </span>
          <ChevronDown
            className={clsx(
              'w-5 h-5 text-gray-400 transition-transform duration-200',
              !isCollapsed && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Meal entries with animation */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}
      >
        <div className="mt-2 space-y-2 pl-2">
          {entries.map((entry) => (
            <FoodItem
              key={entry.id}
              entry={entry}
              onDelete={onEntryDelete}
              onEdit={onEntryEdit}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export const FoodLog = memo(function FoodLog({
  date,
  personId,
  onEntryDeleted,
  onEntryEdit,
  refreshTrigger,
}: FoodLogProps) {
  const [, setRefreshCount] = useState(0);
  const [collapsedState, setCollapsedState] = useState<Record<MealType, boolean>>(() => getCollapsedState());
  const [isMounted, setIsMounted] = useState(false);

  // Track when component is mounted (client-side) to handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setCollapsedState(getCollapsedState());
  }, []);

  // Get entries grouped by meal type (filtered by person if provided)
  // Include isMounted in dependencies to re-fetch after hydration
  const groupedEntries = useMemo(() => {
    // Use refreshTrigger and isMounted to force recalculation
    void refreshTrigger;
    void isMounted;
    return getFoodEntriesGroupedByMeal(date, personId);
  }, [date, personId, refreshTrigger, isMounted]);

  // Check if there are any entries
  const hasEntries = useMemo(() => {
    return mealTypeOrder.some((type) => groupedEntries[type].length > 0);
  }, [groupedEntries]);

  const handleEntryDelete = useCallback(
    (entry: FoodEntry) => {
      // Trigger a refresh
      setRefreshCount((c) => c + 1);
      onEntryDeleted?.(entry);
    },
    [onEntryDeleted]
  );

  const handleCollapsedChange = useCallback((mealType: MealType, collapsed: boolean) => {
    setCollapsedState((prev) => {
      const newState = { ...prev, [mealType]: collapsed };
      saveCollapsedState(newState);
      return newState;
    });
  }, []);

  // Show loading state until hydration completes
  if (!isMounted) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasEntries) {
    return (
      <div className="py-12 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No food logged yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Tap the + button to log your first meal or snack for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mealTypeOrder.map((mealType) => (
        <MealGroup
          key={mealType}
          mealType={mealType}
          entries={groupedEntries[mealType]}
          onEntryDelete={handleEntryDelete}
          onEntryEdit={onEntryEdit}
          initialCollapsed={collapsedState[mealType]}
          onCollapsedChange={handleCollapsedChange}
        />
      ))}
    </div>
  );
});

export default FoodLog;
