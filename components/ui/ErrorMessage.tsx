'use client';

import { clsx } from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30',
        'shadow-sm',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-1 rounded-full bg-red-100 dark:bg-red-900/50">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="danger"
                size="sm"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
