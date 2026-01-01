'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PantryItem } from '@/lib/types';

const CATEGORIES = [
  'Proteins',
  'Dairy',
  'Grains',
  'Produce',
  'Frozen',
  'Condiments',
  'Snacks',
  'Beverages',
] as const;

const LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter'] as const;

type Category = (typeof CATEGORIES)[number];
type Location = (typeof LOCATIONS)[number];

interface PantryItemFormData {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location?: string;
  expires_at?: string;
  low_stock_threshold?: number;
  notes?: string;
}

interface PantryItemFormProps {
  item?: PantryItem;
  onSubmit: (data: PantryItemFormData) => Promise<void>;
  onCancel?: () => void;
}

function formatDateForInput(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function PantryItemForm({ item, onSubmit, onCancel }: PantryItemFormProps) {
  const isEditMode = !!item;

  const [name, setName] = useState<string>(item?.name || '');
  const [category, setCategory] = useState<Category | string>(item?.category || CATEGORIES[0]);
  const [quantity, setQuantity] = useState<number>(item?.quantity ?? 1);
  const [unit, setUnit] = useState<string>(item?.unit || 'each');
  const [location, setLocation] = useState<Location | string>(item?.location || '');
  const [expiresAt, setExpiresAt] = useState<string>(formatDateForInput(item?.expires_at));
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(
    item?.low_stock_threshold ?? ''
  );
  const [notes, setNotes] = useState<string>(item?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when item prop changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setLocation(item.location || '');
      setExpiresAt(formatDateForInput(item.expires_at));
      setLowStockThreshold(item.low_stock_threshold ?? '');
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    if (quantity < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: PantryItemFormData = {
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim() || 'each',
        ...(location && { location }),
        ...(expiresAt && { expires_at: expiresAt }),
        ...(typeof lowStockThreshold === 'number' && lowStockThreshold >= 0 && {
          low_stock_threshold: lowStockThreshold,
        }),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      await onSubmit(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'add'} pantry item. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [name, category, quantity, unit, location, expiresAt, lowStockThreshold, notes, isEditMode, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Pantry Item' : 'Add Pantry Item'}
        </h2>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </div>
      )}

      <Input
        type="text"
        label="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Chicken Breast"
        required
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isSubmitting}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          min="0"
          step="0.1"
          disabled={isSubmitting}
        />
        <Input
          type="text"
          label="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g., lbs, oz, each"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Location
        </label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isSubmitting}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400"
        >
          <option value="">Select location...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      <Input
        type="date"
        label="Expiration Date (optional)"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        disabled={isSubmitting}
      />

      <Input
        type="number"
        label="Low Stock Threshold (optional)"
        value={lowStockThreshold}
        onChange={(e) =>
          setLowStockThreshold(e.target.value ? parseFloat(e.target.value) : '')
        }
        placeholder="Alert when quantity falls below"
        min="0"
        step="0.1"
        helperText="Get notified when stock falls below this amount"
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <label htmlFor="pantry-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes (optional)
        </label>
        <textarea
          id="pantry-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Costco brand, best for grilling..."
          rows={3}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="flex-1"
        >
          {isEditMode ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}
