'use client';

import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X, Package, Plus, Minus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { PantryItem } from '@/lib/types';

// Category options matching the pantry page
const CATEGORIES = [
  'Proteins',
  'Dairy',
  'Grains',
  'Produce',
  'Frozen',
  'Condiments',
  'Snacks',
] as const;

// Common unit options
const UNITS = [
  'count',
  'lbs',
  'oz',
  'cups',
  'tbsp',
  'tsp',
  'bags',
  'boxes',
  'cans',
  'bottles',
  'cartons',
  'packages',
] as const;

// Location options
const LOCATIONS = [
  'Pantry',
  'Refrigerator',
  'Freezer',
  'Counter',
] as const;

export interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PantryItem, 'id' | 'created_at'>) => void;
}

export function AddPantryItemModal({
  isOpen,
  onClose,
  onSave,
}: AddPantryItemModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>(UNITS[0]);
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory(CATEGORIES[0]);
      setQuantity(1);
      setUnit(UNITS[0]);
      setLocation(LOCATIONS[0]);
      setLowStockThreshold(undefined);
      setExpiresAt('');
      setNotes('');
      setErrors({});
      // Focus name input after a brief delay for animation
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleQuantityAdjust = (delta: number) => {
    setQuantity((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      setErrors({ name: 'Item name is required' });
      nameInputRef.current?.focus();
      return;
    }

    const newItem: Omit<PantryItem, 'id' | 'created_at'> = {
      name: name.trim(),
      category,
      quantity,
      unit,
      location,
      low_stock_threshold: lowStockThreshold,
      expires_at: expiresAt || undefined,
      notes: notes.trim() || undefined,
      updated_at: new Date().toISOString(),
    };

    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-pantry-item-title"
    >
      {/* Backdrop */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/50 dark:bg-black/70',
          'backdrop-blur-[2px]',
          'animate-in fade-in duration-200'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'shadow-2xl dark:shadow-black/50',
          'animate-in zoom-in-95 slide-in-from-bottom-4 duration-200'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2
              id="add-pantry-item-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Add Pantry Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-1.5 rounded-lg',
              'text-gray-400 dark:text-gray-500',
              'hover:text-gray-600 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'active:scale-95',
              'transition-all duration-150'
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <Input
            ref={nameInputRef}
            label="Item Name"
            placeholder="e.g., Greek Yogurt, Chicken Breast"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            error={errors.name}
            required
          />

          {/* Category & Location Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2',
                  'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                  'transition-all duration-200'
                )}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2',
                  'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                  'transition-all duration-200'
                )}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantityAdjust(-1)}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-700',
                    'hover:bg-gray-200 dark:hover:bg-gray-600',
                    'active:scale-95',
                    'transition-all duration-150'
                  )}
                  disabled={quantity <= 0}
                >
                  <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={clsx(
                    'w-20 text-center rounded-lg border px-2 py-2',
                    'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                    'border-gray-300 dark:border-gray-600',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                    'transition-all duration-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => handleQuantityAdjust(1)}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-700',
                    'hover:bg-gray-200 dark:hover:bg-gray-600',
                    'active:scale-95',
                    'transition-all duration-150'
                  )}
                >
                  <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2',
                  'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                  'transition-all duration-200'
                )}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Low Stock & Expiration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Low Stock Alert
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 2"
                value={lowStockThreshold ?? ''}
                onChange={(e) =>
                  setLowStockThreshold(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className={clsx(
                  'w-full rounded-lg border px-3 py-2',
                  'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                  'transition-all duration-200'
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Alert when quantity drops to this level
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Expires
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2',
                  'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Costco brand, 2% fat"
              rows={2}
              className={clsx(
                'w-full rounded-lg border px-3 py-2',
                'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'border-gray-300 dark:border-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500',
                'transition-all duration-200 resize-none'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 !bg-orange-500 hover:!bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
