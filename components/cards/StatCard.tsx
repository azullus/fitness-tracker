'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

type ColorVariant = 'blue' | 'green' | 'purple' | 'orange';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: ColorVariant;
}

const colorStyles: Record<ColorVariant, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' },
};

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'blue',
}: StatCardProps) {
  const styles = colorStyles[color];

  const renderChangeIndicator = () => {
    if (change === undefined || change === 0) return null;

    const isPositive = change > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const formattedChange = isPositive ? `+${change}` : `${change}`;

    return (
      <div className={clsx('flex items-center gap-1 text-sm', changeColor)}>
        <TrendIcon className="w-4 h-4" />
        <span>{formattedChange}</span>
      </div>
    );
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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {renderChangeIndicator()}
        </div>
        {Icon && (
          <div
            className={clsx(
              'flex items-center justify-center',
              'w-12 h-12 rounded-full',
              'transition-transform duration-200',
              styles.bg
            )}
          >
            <Icon className={clsx('w-6 h-6', styles.text)} />
          </div>
        )}
      </div>
    </div>
  );
}
