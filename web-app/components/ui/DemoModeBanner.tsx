'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { usePerson } from '@/components/providers/PersonProvider';
import { useAuth } from '@/components/providers/AuthProvider';

interface DemoModeBannerProps {
  className?: string;
}

/**
 * Banner that displays when the app is running in demo mode
 * Shows connection status and provides retry/sign-up options
 */
export function DemoModeBanner({ className }: DemoModeBannerProps) {
  const { isDemoMode, connectionError, retryConnection } = usePerson();
  const { isAuthEnabled } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has previously dismissed the banner in this session
    const wasDismissed = sessionStorage.getItem('demo-banner-dismissed') === 'true';
    setDismissed(wasDismissed);
  }, []);

  // Don't render on server or if not in demo mode
  if (!mounted || !isDemoMode || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('demo-banner-dismissed', 'true');
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    // Small delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 300));
    retryConnection();
  };

  return (
    <div
      className={clsx(
        'relative',
        'bg-amber-50 dark:bg-amber-900/30',
        'border-b border-amber-200 dark:border-amber-800',
        'px-4 py-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 max-w-4xl mx-auto">
        {/* Warning icon */}
        <div className="flex-shrink-0 p-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
          <AlertTriangle
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Demo Mode Active
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
            {connectionError
              ? `Connection failed: ${connectionError}. Your data is stored locally and will not persist.`
              : isAuthEnabled
                ? 'Unable to connect to the database. Your data is stored locally and will not persist.'
                : 'Running without a database connection. Sign up for a free account to save your fitness data.'}
          </p>

          {/* Action buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={clsx(
                'inline-flex items-center gap-1.5',
                'text-sm font-medium',
                'px-3 py-1.5 rounded-md',
                'bg-amber-100 dark:bg-amber-900/50',
                'text-amber-800 dark:text-amber-200',
                'hover:bg-amber-200 dark:hover:bg-amber-800/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
            >
              <RefreshCw
                className={clsx('h-3.5 w-3.5', isRetrying && 'animate-spin')}
                aria-hidden="true"
              />
              {isRetrying ? 'Retrying...' : 'Retry Connection'}
            </button>

            {isAuthEnabled && (
              <a
                href="/auth/login"
                className={clsx(
                  'inline-flex items-center gap-1.5',
                  'text-sm font-medium',
                  'px-3 py-1.5 rounded-md',
                  'bg-amber-600 dark:bg-amber-700',
                  'text-white',
                  'hover:bg-amber-700 dark:hover:bg-amber-600',
                  'transition-colors duration-150'
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Sign In
              </a>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={clsx(
            'flex-shrink-0 p-1.5 rounded-full',
            'hover:bg-amber-200 dark:hover:bg-amber-800/50',
            'text-amber-600 dark:text-amber-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
          )}
          aria-label="Dismiss demo mode notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default DemoModeBanner;
