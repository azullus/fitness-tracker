'use client';

import { clsx } from 'clsx';
import { Warehouse, Plus, Minus, Trash2, AlertTriangle, Clock } from 'lucide-react';
import type { PantryItem } from '@/lib/types';

export interface PantryItemCardProps {
  item: PantryItem;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onDelete?: (id: string) => void;
}

function isExpiringSoon(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7;
}

function formatExpiryDate(expiresAt: string): string {
  const expiryDate = new Date(expiresAt);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago`;
  } else if (daysUntilExpiry === 0) {
    return 'Expires today';
  } else if (daysUntilExpiry === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${daysUntilExpiry} days`;
  }
}

export function PantryItemCard({
  item,
  onUpdateQuantity,
  onDelete,
}: PantryItemCardProps) {
  const isLowStock =
    item.low_stock_threshold !== undefined &&
    item.quantity <= item.low_stock_threshold;
  const expiringSoon = isExpiringSoon(item.expires_at);

  return (
    <div
      className={clsx(
        'rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm transition-shadow hover:shadow-md dark:hover:shadow-gray-900/30',
        isLowStock
          ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
          : 'border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Header with icon and name */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isLowStock
                ? 'bg-orange-200 dark:bg-orange-900/50'
                : 'bg-orange-100 dark:bg-orange-900/30'
            )}
          >
            <Warehouse
              className={clsx(
                'h-5 w-5',
                isLowStock
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-orange-500 dark:text-orange-400'
              )}
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col">
            <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
            {item.location && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.location}</span>
            )}
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className={clsx(
              'rounded-md p-1.5 text-gray-400 dark:text-gray-500 transition-colors',
              'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
            )}
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category badge */}
      <div className="mt-3">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          )}
        >
          {item.category}
        </span>
      </div>

      {/* Quantity display with controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onUpdateQuantity && (
            <button
              onClick={() => onUpdateQuantity(item.id, -1)}
              disabled={item.quantity <= 0}
              className={clsx(
                'rounded-md p-1.5 transition-colors',
                'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200',
                'hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50',
                'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <span className="min-w-[80px] text-center text-lg font-semibold text-gray-900 dark:text-white">
            {item.quantity} {item.unit}
          </span>

          {onUpdateQuantity && (
            <button
              onClick={() => onUpdateQuantity(item.id, 1)}
              className={clsx(
                'rounded-md p-1.5 transition-colors',
                'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200',
                'hover:bg-gray-50 dark:hover:bg-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Low stock warning */}
        {isLowStock && (
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-medium">Low Stock</span>
          </div>
        )}
      </div>

      {/* Expiry warning */}
      {item.expires_at && (
        <div
          className={clsx(
            'mt-3 flex items-center gap-1.5 text-sm',
            expiringSoon ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className={expiringSoon ? 'font-medium' : ''}>
            {formatExpiryDate(item.expires_at)}
          </span>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">{item.notes}</p>
      )}
    </div>
  );
}
