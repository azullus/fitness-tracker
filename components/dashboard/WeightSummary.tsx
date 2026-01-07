'use client';

import React from 'react';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardWidget } from './shared';

export interface WeightSummaryProps {
  latestWeight?: number;
  weightChange: string | null;
}

export function WeightSummary({
  latestWeight,
  weightChange,
}: WeightSummaryProps) {
  const getTrendIcon = () => {
    if (!weightChange) return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
    const change = parseFloat(weightChange);
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
  };

  return (
    <DashboardWidget
      title="Current Weight"
      icon={Scale}
      iconBgColor="bg-blue-100 dark:bg-blue-900/40"
      iconColor="text-blue-600 dark:text-blue-400"
      href="/log?tab=weight"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {latestWeight?.toFixed(1) || '--'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">lbs</span>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          {weightChange && (
            <span className={clsx(
              'text-sm font-medium',
              parseFloat(weightChange) > 0 ? 'text-red-500' : 'text-green-500'
            )}>
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} lbs
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        7-day change
      </p>
    </DashboardWidget>
  );
}

export default WeightSummary;
