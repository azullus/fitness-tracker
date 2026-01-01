'use client';

import { clsx } from 'clsx';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white',
    },
    info: {
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop with fade animation */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/50 dark:bg-black/70',
          'backdrop-blur-[2px]',
          'animate-in fade-in duration-200'
        )}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog with slide-up animation */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full max-w-md rounded-2xl',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'shadow-2xl dark:shadow-black/50',
          'animate-in zoom-in-95 slide-in-from-bottom-4 duration-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className={clsx(
            'absolute top-4 right-4 p-1.5 rounded-lg',
            'text-gray-400 dark:text-gray-500',
            'hover:text-gray-600 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'active:scale-95',
            'transition-all duration-150'
          )}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon and title */}
          <div className="flex items-start gap-4">
            <div
              className={clsx(
                'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
                'shadow-sm',
                styles.icon
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className={clsx(
                'px-4 py-2.5 rounded-lg text-sm font-medium',
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
                'border border-gray-200 dark:border-gray-600',
                'hover:bg-gray-200 dark:hover:bg-gray-600',
                'active:scale-[0.98]',
                'transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={clsx(
                'px-4 py-2.5 rounded-lg text-sm font-medium',
                'active:scale-[0.98]',
                'transition-all duration-150',
                styles.button,
                'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
