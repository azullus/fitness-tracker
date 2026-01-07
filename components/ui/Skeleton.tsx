'use client';

import { clsx } from 'clsx';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Pre-built skeleton for dashboard cards
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700',
        className
      )}
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="circular" className="h-8 w-8" />
        </div>
        <Skeleton variant="text" className="h-8 w-32" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for nutrition progress widget
 */
export function NutritionProgressSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
      aria-busy="true"
      aria-label="Loading nutrition data"
    >
      <div className="space-y-4">
        <Skeleton variant="text" className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-2 w-full" />
              <Skeleton variant="text" className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for weight chart
 */
export function WeightChartSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
      aria-busy="true"
      aria-label="Loading weight chart"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-5 w-32" />
          <Skeleton variant="rounded" className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton variant="text" className="h-3 w-12" />
              <Skeleton variant="text" className="h-6 w-full" />
            </div>
          ))}
        </div>
        <Skeleton variant="rounded" className="h-48 w-full" />
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for macro pie chart
 */
export function MacroChartSkeleton() {
  return (
    <div
      className="flex flex-col items-center"
      aria-busy="true"
      aria-label="Loading macro chart"
    >
      <Skeleton variant="circular" className="h-40 w-40 mb-4" />
      <div className="w-full space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton variant="circular" className="h-3 w-3" />
            <Skeleton variant="text" className="h-4 w-16" />
            <Skeleton variant="text" className="h-3 w-12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for workout status widget
 */
export function WorkoutStatusSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
      aria-busy="true"
      aria-label="Loading workout status"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-5 w-32" />
          <Skeleton variant="rounded" className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-40" />
            <Skeleton variant="text" className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for hero section
 */
export function HeroSkeleton() {
  return (
    <div
      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-6 w-32 bg-white/20" />
            <Skeleton variant="text" className="h-4 w-48 bg-white/20" />
          </div>
          <Skeleton variant="circular" className="h-16 w-16 bg-white/20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton variant="text" className="h-3 w-12 bg-white/20" />
              <Skeleton variant="text" className="h-6 w-16 bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
