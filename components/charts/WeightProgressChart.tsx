'use client';

import React, { useMemo, memo, useState } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, Target, Activity } from 'lucide-react';
import type { WeightEntry } from '@/lib/types';

interface WeightProgressChartProps {
  entries: WeightEntry[];
  goalWeight?: number;
  daysToShow?: 14 | 30;
  className?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  date: string;
  weight: number;
  isMovingAvg?: boolean;
}

// Calculate 7-day moving average
function calculateMovingAverage(
  entries: WeightEntry[],
  windowSize: number = 7
): { date: string; weight: number }[] {
  const result: { date: string; weight: number }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = entries.slice(start, i + 1);
    const avg = window.reduce((sum, e) => sum + e.weight_lbs, 0) / window.length;
    result.push({
      date: entries[i].date,
      weight: avg,
    });
  }

  return result;
}

// Generate SVG path from points
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _unused_generatePath(points: ChartPoint[]): string {
  if (points.length < 2) return '';

  return points.reduce((path, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');
}

// Generate smooth curve path (Catmull-Rom spline approximation)
function generateSmoothPath(points: ChartPoint[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Control points for bezier curve
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

// Stats card sub-component
const StatItem = memo(function StatItem({
  label,
  value,
  unit,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon?: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue' | 'red' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
}) {
  const colorStyles = {
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2">
      {Icon && (
        <div className={clsx('p-1.5 rounded-lg', colorStyles[color])}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>
          {trend && (
            <TrendIcon className={clsx(
              'w-3 h-3 ml-1',
              trend === 'up' && 'text-red-500',
              trend === 'down' && 'text-green-500',
              trend === 'neutral' && 'text-gray-400'
            )} />
          )}
        </div>
      </div>
    </div>
  );
});

StatItem.displayName = 'StatItem';

export const WeightProgressChart = memo(function WeightProgressChart({
  entries,
  goalWeight,
  daysToShow = 14,
  className,
}: WeightProgressChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [showMovingAvg, setShowMovingAvg] = useState(true);

  // Sort entries by date (oldest first) and filter to show only requested days
  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-daysToShow);
  }, [entries, daysToShow]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedEntries.length === 0) {
      return {
        current: 0,
        starting: 0,
        change: 0,
        min: 0,
        max: 0,
        trend: 'neutral' as const,
      };
    }

    const weights = sortedEntries.map(e => e.weight_lbs);
    const current = weights[weights.length - 1];
    const starting = weights[0];
    const change = current - starting;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const trend = change > 0.1 ? 'up' as const : change < -0.1 ? 'down' as const : 'neutral' as const;

    return { current, starting, change, min, max, trend };
  }, [sortedEntries]);

  // Calculate moving averages
  const movingAvgData = useMemo(() => {
    return calculateMovingAverage(sortedEntries, 7);
  }, [sortedEntries]);

  // Chart dimensions
  const chartConfig = useMemo(() => {
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 100; // percentage-based width
    const height = 200;

    return { padding, width, height };
  }, []);

  // Calculate chart bounds and scale
  const chartScale = useMemo(() => {
    if (sortedEntries.length === 0) {
      return { minY: 0, maxY: 100, rangeY: 100 };
    }

    const allWeights = sortedEntries.map(e => e.weight_lbs);
    if (goalWeight) {
      allWeights.push(goalWeight);
    }

    let minY = Math.min(...allWeights);
    let maxY = Math.max(...allWeights);

    // Add padding to Y range
    const padding = (maxY - minY) * 0.15 || 5;
    minY = Math.floor(minY - padding);
    maxY = Math.ceil(maxY + padding);

    return { minY, maxY, rangeY: maxY - minY };
  }, [sortedEntries, goalWeight]);

  // Generate chart points for main data line
  const dataPoints = useMemo((): ChartPoint[] => {
    if (sortedEntries.length === 0) return [];

    const { padding, height } = chartConfig;
    const { minY, rangeY } = chartScale;
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = 100 - ((padding.left + padding.right) / 4); // Approximate percentage

    return sortedEntries.map((entry, i) => {
      const x = padding.left + (i / Math.max(1, sortedEntries.length - 1)) * chartWidth;
      const y = padding.top + ((1 - (entry.weight_lbs - minY) / rangeY) * chartHeight);
      return {
        x,
        y,
        date: entry.date,
        weight: entry.weight_lbs,
      };
    });
  }, [sortedEntries, chartConfig, chartScale]);

  // Generate chart points for moving average line
  const movingAvgPoints = useMemo((): ChartPoint[] => {
    if (movingAvgData.length === 0) return [];

    const { padding, height } = chartConfig;
    const { minY, rangeY } = chartScale;
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = 100 - ((padding.left + padding.right) / 4);

    return movingAvgData.map((entry, i) => {
      const x = padding.left + (i / Math.max(1, movingAvgData.length - 1)) * chartWidth;
      const y = padding.top + ((1 - (entry.weight - minY) / rangeY) * chartHeight);
      return {
        x,
        y,
        date: entry.date,
        weight: entry.weight,
        isMovingAvg: true,
      };
    });
  }, [movingAvgData, chartConfig, chartScale]);

  // Calculate goal line Y position
  const goalLineY = useMemo(() => {
    if (!goalWeight) return null;

    const { padding, height } = chartConfig;
    const { minY, rangeY } = chartScale;
    const chartHeight = height - padding.top - padding.bottom;

    return padding.top + ((1 - (goalWeight - minY) / rangeY) * chartHeight);
  }, [goalWeight, chartConfig, chartScale]);

  // Y-axis labels
  const yAxisLabels = useMemo(() => {
    const { minY, maxY } = chartScale;
    const step = Math.ceil((maxY - minY) / 4);
    const labels: number[] = [];

    for (let value = minY; value <= maxY; value += step) {
      labels.push(value);
    }

    return labels;
  }, [chartScale]);

  // X-axis labels (dates)
  const xAxisLabels = useMemo(() => {
    if (sortedEntries.length === 0) return [];

    const labelCount = Math.min(5, sortedEntries.length);
    const step = Math.max(1, Math.floor((sortedEntries.length - 1) / (labelCount - 1)));
    const labels: { index: number; date: string; label: string }[] = [];

    for (let i = 0; i < sortedEntries.length; i += step) {
      const date = new Date(sortedEntries[i].date);
      labels.push({
        index: i,
        date: sortedEntries[i].date,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    // Always include the last point
    if (labels.length > 0 && labels[labels.length - 1].index !== sortedEntries.length - 1) {
      const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
      labels.push({
        index: sortedEntries.length - 1,
        date: sortedEntries[sortedEntries.length - 1].date,
        label: lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    return labels;
  }, [sortedEntries]);

  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (sortedEntries.length === 0) {
    return (
      <div className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6',
        className
      )}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No weight data yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start logging your weight to see progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Weight Progress</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMovingAvg(!showMovingAvg)}
              className={clsx(
                'px-2 py-1 text-xs font-medium rounded-full transition-colors',
                showMovingAvg
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}
            >
              7-day avg
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatItem
            label="Current"
            value={stats.current.toFixed(1)}
            unit="lbs"
            color="blue"
          />
          <StatItem
            label="Change"
            value={(stats.change >= 0 ? '+' : '') + stats.change.toFixed(1)}
            unit="lbs"
            color={stats.change < 0 ? 'green' : stats.change > 0 ? 'red' : 'gray'}
            trend={stats.trend}
          />
          <StatItem
            label="Min"
            value={stats.min.toFixed(1)}
            unit="lbs"
            color="green"
          />
          <StatItem
            label="Max"
            value={stats.max.toFixed(1)}
            unit="lbs"
            color="gray"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="relative">
          <svg
            viewBox={`0 0 100 ${chartConfig.height}`}
            className="w-full h-48 sm:h-56"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {yAxisLabels.map((value) => {
              const y = chartConfig.padding.top +
                ((1 - (value - chartScale.minY) / chartScale.rangeY) *
                (chartConfig.height - chartConfig.padding.top - chartConfig.padding.bottom));
              return (
                <g key={value}>
                  <line
                    x1={chartConfig.padding.left}
                    y1={y}
                    x2={100 - chartConfig.padding.right}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    className="text-gray-400 dark:text-gray-600"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={chartConfig.padding.left - 5}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-gray-400 dark:fill-gray-500 text-[3px]"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Goal weight line */}
            {goalLineY !== null && (
              <g>
                <line
                  x1={chartConfig.padding.left}
                  y1={goalLineY}
                  x2={100 - chartConfig.padding.right}
                  y2={goalLineY}
                  stroke="rgb(234, 179, 8)"
                  strokeDasharray="2 2"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
                <g transform={`translate(${100 - chartConfig.padding.right + 2}, ${goalLineY})`}>
                  <rect
                    x="0"
                    y="-4"
                    width="12"
                    height="8"
                    rx="1"
                    fill="rgb(234, 179, 8)"
                    fillOpacity="0.2"
                  />
                  <text
                    x="6"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-yellow-600 dark:fill-yellow-400 text-[2.5px] font-medium"
                  >
                    Goal
                  </text>
                </g>
              </g>
            )}

            {/* Area fill under the line */}
            {dataPoints.length > 1 && (
              <path
                d={`${generateSmoothPath(dataPoints)} L ${dataPoints[dataPoints.length - 1].x} ${chartConfig.height - chartConfig.padding.bottom} L ${dataPoints[0].x} ${chartConfig.height - chartConfig.padding.bottom} Z`}
                fill="url(#areaGradient)"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Moving average line */}
            {showMovingAvg && movingAvgPoints.length > 1 && (
              <path
                d={generateSmoothPath(movingAvgPoints)}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="0.8"
                strokeOpacity="0.6"
                strokeDasharray="1.5 1"
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Main data line */}
            {dataPoints.length > 1 && (
              <path
                d={generateSmoothPath(dataPoints)}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Data points */}
            {dataPoints.map((point) => (
              <g
                key={point.date}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onTouchStart={() => setHoveredPoint(point)}
                onTouchEnd={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible larger hit area */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="transparent"
                />
                {/* Visible point */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredPoint?.date === point.date ? 2 : 1.2}
                  fill="white"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="0.6"
                  className="transition-all duration-200"
                />
              </g>
            ))}

            {/* X-axis labels */}
            {xAxisLabels.map((label) => {
              const x = chartConfig.padding.left +
                (label.index / Math.max(1, sortedEntries.length - 1)) *
                (100 - chartConfig.padding.left - chartConfig.padding.right);
              return (
                <text
                  key={label.date}
                  x={x}
                  y={chartConfig.height - 8}
                  textAnchor="middle"
                  className="fill-gray-400 dark:fill-gray-500 text-[2.5px]"
                >
                  {label.label}
                </text>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap"
              style={{
                left: `${hoveredPoint.x}%`,
                top: `${(hoveredPoint.y / chartConfig.height) * 100 - 15}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-medium">{hoveredPoint.weight.toFixed(1)} lbs</div>
              <div className="text-gray-300 text-[10px]">
                {hoveredPoint.isMovingAvg ? '7-day avg - ' : ''}
                {formatDate(hoveredPoint.date)}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded" />
            <span>Weight</span>
          </div>
          {showMovingAvg && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500 opacity-60 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgb(59, 130, 246) 2px, rgb(59, 130, 246) 4px)' }} />
              <span>7-day Avg</span>
            </div>
          )}
          {goalWeight && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-yellow-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgb(234, 179, 8) 2px, rgb(234, 179, 8) 4px)' }} />
              <span>Goal ({goalWeight} lbs)</span>
            </div>
          )}
        </div>
      </div>

      {/* Goal Section */}
      {goalWeight && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/40">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Goal: {goalWeight} lbs
              </span>
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              {stats.current > goalWeight
                ? `${(stats.current - goalWeight).toFixed(1)} lbs to go`
                : stats.current < goalWeight
                  ? `${(goalWeight - stats.current).toFixed(1)} lbs below goal`
                  : 'Goal reached!'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WeightProgressChart.displayName = 'WeightProgressChart';

export default WeightProgressChart;
