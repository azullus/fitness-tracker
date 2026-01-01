'use client';

import { clsx } from 'clsx';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'default' | 'primary' | 'white';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

const variantStyles: Record<SpinnerVariant, string> = {
  default: 'border-emerald-500 dark:border-emerald-400',
  primary: 'border-blue-500 dark:border-blue-400',
  white: 'border-white',
};

export function LoadingSpinner({ size = 'md', variant = 'default', className }: LoadingSpinnerProps) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-solid border-t-transparent',
          sizeStyles[size],
          variantStyles[variant]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
