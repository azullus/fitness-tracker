'use client';

import { clsx } from 'clsx';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeightCardProps {
  currentWeight: number;
  previousWeight?: number;
  personName: string;
  onLogWeight?: () => void;
}

export default function WeightCard({
  currentWeight,
  previousWeight,
  personName,
  onLogWeight,
}: WeightCardProps) {
  const formattedWeight = currentWeight.toFixed(1);

  // Calculate 7-day change
  const weightChange = previousWeight !== undefined
    ? currentWeight - previousWeight
    : undefined;

  const getTrendInfo = () => {
    if (weightChange === undefined) {
      return { icon: Minus, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    }

    // Use a small threshold to consider weights as "stable"
    const threshold = 0.1;

    if (weightChange > threshold) {
      return { icon: TrendingUp, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/40' };
    } else if (weightChange < -threshold) {
      return { icon: TrendingDown, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/40' };
    } else {
      return { icon: Minus, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  const { icon: TrendIcon, color: trendColor, bgColor: trendBgColor } = getTrendInfo();

  const formatChange = () => {
    if (weightChange === undefined) return 'No previous data';

    const absChange = Math.abs(weightChange).toFixed(1);
    if (weightChange > 0.1) {
      return `+${absChange} lbs`;
    } else if (weightChange < -0.1) {
      return `-${absChange} lbs`;
    } else {
      return 'Stable';
    }
  };

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl p-4',
        'border border-gray-100 dark:border-gray-700',
        'shadow-sm hover:shadow-md dark:hover:shadow-gray-900/30',
        'transition-all duration-200',
        'hover:border-gray-200 dark:hover:border-gray-600',
        'hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {personName}&apos;s Weight
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formattedWeight}</p>
            <span className="text-lg text-gray-500 dark:text-gray-400">lbs</span>
          </div>
        </div>
        <div
          className={clsx(
            'flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-blue-100 dark:bg-blue-900/40',
            'transition-transform duration-200'
          )}
        >
          <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'flex items-center justify-center',
              'w-6 h-6 rounded-full',
              trendBgColor
            )}
          >
            <TrendIcon className={clsx('w-4 h-4', trendColor)} />
          </div>
          <span className={clsx('text-sm font-medium', trendColor)}>
            {formatChange()}
          </span>
          {weightChange !== undefined && (
            <span className="text-xs text-gray-400 dark:text-gray-500">7-day change</span>
          )}
        </div>

        {onLogWeight && (
          <button
            onClick={onLogWeight}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium',
              'bg-blue-500 dark:bg-blue-600 text-white rounded-lg',
              'hover:bg-blue-600 dark:hover:bg-blue-500',
              'active:scale-[0.98]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
            )}
          >
            Log Weight
          </button>
        )}
      </div>
    </div>
  );
}
