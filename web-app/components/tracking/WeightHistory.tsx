'use client';

import React, { useState, useCallback, memo } from 'react';
import { Trash2, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteWeightEntry } from '@/lib/weight-log';
import type { WeightEntry } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';

interface WeightHistoryProps {
  entries: WeightEntry[];
  onEntryDeleted?: (entry: WeightEntry) => void;
  maxEntries?: number;
  showAll?: boolean;
}

interface WeightHistoryItemProps {
  entry: WeightEntry;
  previousEntry?: WeightEntry;
  onDelete: (entry: WeightEntry) => void;
}

const WeightHistoryItem = memo(function WeightHistoryItem({
  entry,
  previousEntry,
  onDelete,
}: WeightHistoryItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate weight change from previous entry
  const weightChange = previousEntry
    ? entry.weight_lbs - previousEntry.weight_lbs
    : null;

  const getTrendIcon = () => {
    if (weightChange === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (weightChange > 0.1) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (weightChange < -0.1) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (weightChange === null) return 'text-gray-500';
    if (weightChange > 0.1) return 'text-red-500';
    if (weightChange < -0.1) return 'text-green-500';
    return 'text-gray-500';
  };

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      deleteWeightEntry(entry.id);
      onDelete(entry);
    } catch {
      // Deletion failed, but UI already updated
    } finally {
      setIsDeleting(false);
    }
  }, [entry, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const formattedDate = format(new Date(entry.date), 'EEE, MMM d');
  const relativeTime = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });

  return (
    <>
      <div
        className={clsx(
          'flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600 transition-colors',
          isDeleting && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {entry.weight_lbs.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">lbs</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formattedDate}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{relativeTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Weight change indicator */}
          {weightChange !== null && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={clsx('text-sm font-medium', getTrendColor())}>
                {weightChange > 0 ? '+' : ''}
                {weightChange.toFixed(1)}
              </span>
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              'text-gray-400 hover:text-red-600 hover:bg-red-100',
              'dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/40'
            )}
            aria-label={`Delete weight entry from ${formattedDate}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes if present */}
      {entry.notes && (
        <div className="ml-11 -mt-2 mb-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-x border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            {entry.notes}
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Weight Entry"
        message={`Are you sure you want to delete the weight entry of ${entry.weight_lbs.toFixed(1)} lbs from ${formattedDate}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
});

export const WeightHistory = memo(function WeightHistory({
  entries,
  onEntryDeleted,
  maxEntries = 10,
  showAll = false,
}: WeightHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const handleEntryDelete = useCallback(
    (entry: WeightEntry) => {
      onEntryDeleted?.(entry);
    },
    [onEntryDeleted]
  );

  // Limit displayed entries unless expanded or showAll is true
  const displayedEntries = showAll || expanded ? entries : entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries && !showAll;

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No weight entries yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Start logging your weight to track progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Weight History
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="space-y-2">
        {displayedEntries.map((entry, index) => (
          <WeightHistoryItem
            key={entry.id}
            entry={entry}
            previousEntry={displayedEntries[index + 1]}
            onDelete={handleEntryDelete}
          />
        ))}
      </div>

      {/* Show more/less button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'w-full py-2 text-sm font-medium rounded-lg transition-colors',
            'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          )}
        >
          {expanded
            ? 'Show less'
            : `Show ${entries.length - maxEntries} more entries`}
        </button>
      )}
    </div>
  );
});

export default WeightHistory;
