'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// ProgressBar Component
// ============================================================================

export interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  showOverflow?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-green-500',
  showOverflow = false,
  label,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
    >
      <div
        className={clsx(
          'h-full rounded-full transition-all duration-500',
          isOver && showOverflow ? 'bg-red-500' : colorClass
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ============================================================================
// QuickActionButton Component
// ============================================================================

export interface QuickActionButtonProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
}

export function QuickActionButton({
  href,
  icon: Icon,
  label,
  colorClass,
}: QuickActionButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex flex-col items-center justify-center p-4 rounded-xl',
        'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700',
        'hover:shadow-md transition-all duration-200 active:scale-95'
      )}
    >
      <div className={clsx('p-3 rounded-full mb-2', colorClass)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
        {label}
      </span>
    </Link>
  );
}

// ============================================================================
// DashboardWidget Component
// ============================================================================

export interface DashboardWidgetProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  href?: string;
  children: React.ReactNode;
}

export function DashboardWidget({
  title,
  icon: Icon,
  iconBgColor,
  iconColor,
  href,
  children,
}: DashboardWidgetProps) {
  const content = (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700',
        href && 'hover:shadow-md transition-shadow duration-200 cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('p-2 rounded-lg', iconBgColor)}>
            <Icon className={clsx('w-5 h-5', iconColor)} />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {href && (
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      {children}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
