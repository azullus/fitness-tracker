'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import { clsx } from 'clsx';

// Calorie conversion factors
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

// Macro colors matching the existing design
const MACRO_COLORS = {
  protein: {
    fill: '#3B82F6', // blue-500
    fillDark: '#60A5FA', // blue-400
    label: 'Protein',
  },
  carbs: {
    fill: '#F59E0B', // amber-500
    fillDark: '#FBBF24', // amber-400
    label: 'Carbs',
  },
  fat: {
    fill: '#F97316', // orange-500
    fillDark: '#FB923C', // orange-400
    label: 'Fat',
  },
} as const;

type MacroType = keyof typeof MACRO_COLORS;

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroPieChartProps {
  data: MacroData;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

interface MacroSegment {
  type: MacroType;
  grams: number;
  calories: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
  colorDark: string;
  label: string;
}

/**
 * Converts polar coordinates to cartesian for SVG path commands
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Creates an SVG arc path for a donut segment
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Handle full circle case
  if (endAngle - startAngle >= 359.99) {
    const start = polarToCartesian(x, y, radius, startAngle);
    const mid = polarToCartesian(x, y, radius, startAngle + 180);
    const end = polarToCartesian(x, y, radius, endAngle - 0.01);
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, 0, 1, mid.x, mid.y,
      'A', radius, radius, 0, 0, 1, end.x, end.y,
    ].join(' ');
  }

  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
  ].join(' ');
}

/**
 * Calculate macro segment data from raw gram values
 */
function calculateSegments(data: MacroData): MacroSegment[] {
  const macros: MacroType[] = ['protein', 'carbs', 'fat'];

  // Calculate total calories
  const totalCalories = macros.reduce(
    (sum, macro) => sum + data[macro] * CALORIES_PER_GRAM[macro],
    0
  );

  if (totalCalories === 0) {
    return [];
  }

  let currentAngle = 0;
  const segments: MacroSegment[] = [];

  for (const macro of macros) {
    const grams = data[macro];
    const calories = grams * CALORIES_PER_GRAM[macro];
    const percentage = (calories / totalCalories) * 100;
    const angleSpan = (percentage / 100) * 360;

    if (grams > 0) {
      segments.push({
        type: macro,
        grams,
        calories,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan,
        color: MACRO_COLORS[macro].fill,
        colorDark: MACRO_COLORS[macro].fillDark,
        label: MACRO_COLORS[macro].label,
      });
    }

    currentAngle += angleSpan;
  }

  return segments;
}

interface DonutSegmentProps {
  segment: MacroSegment;
  center: number;
  radius: number;
  strokeWidth: number;
  isSelected: boolean;
  onSelect: (type: MacroType | null) => void;
}

const DonutSegment = memo(function DonutSegment({
  segment,
  center,
  radius,
  strokeWidth,
  isSelected,
  onSelect,
}: DonutSegmentProps) {
  const path = useMemo(
    () => describeArc(center, center, radius, segment.startAngle, segment.endAngle),
    [center, radius, segment.startAngle, segment.endAngle]
  );

  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : segment.type);
  }, [isSelected, onSelect, segment.type]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(isSelected ? null : segment.type);
      }
    },
    [isSelected, onSelect, segment.type]
  );

  return (
    <path
      d={path}
      fill="none"
      strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
      strokeLinecap="round"
      className={clsx(
        'cursor-pointer transition-all duration-300 ease-out',
        isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'
      )}
      style={{
        stroke: `var(--segment-color-${segment.type})`,
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        transformOrigin: `${center}px ${center}px`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${segment.label}: ${Math.round(segment.percentage)}%, ${Math.round(segment.grams)}g, ${Math.round(segment.calories)} calories`}
    />
  );
});

DonutSegment.displayName = 'DonutSegment';

interface LegendItemProps {
  segment: MacroSegment;
  isSelected: boolean;
  onSelect: (type: MacroType | null) => void;
}

const LegendItem = memo(function LegendItem({
  segment,
  isSelected,
  onSelect,
}: LegendItemProps) {
  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : segment.type);
  }, [isSelected, onSelect, segment.type]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700/50',
        isSelected && 'bg-gray-100 dark:bg-gray-700/50 ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-600 dark:ring-offset-gray-800'
      )}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: `var(--segment-color-${segment.type})` }}
      />
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {segment.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(segment.grams)}g ({Math.round(segment.percentage)}%)
        </span>
      </div>
      <span className="ml-auto text-xs font-medium text-gray-600 dark:text-gray-400">
        {Math.round(segment.calories)} cal
      </span>
    </button>
  );
});

LegendItem.displayName = 'LegendItem';

export const MacroPieChart = memo(function MacroPieChart({
  data,
  className,
  size = 160,
  strokeWidth = 24,
}: MacroPieChartProps) {
  const [selectedMacro, setSelectedMacro] = useState<MacroType | null>(null);

  const segments = useMemo(() => calculateSegments(data), [data]);

  const totalCalories = useMemo(
    () =>
      data.protein * CALORIES_PER_GRAM.protein +
      data.carbs * CALORIES_PER_GRAM.carbs +
      data.fat * CALORIES_PER_GRAM.fat,
    [data]
  );

  const { center, radius } = useMemo(() => {
    const c = size / 2;
    const r = (size - strokeWidth) / 2;
    return { center: c, radius: r };
  }, [size, strokeWidth]);

  const handleSelect = useCallback((type: MacroType | null) => {
    setSelectedMacro(type);
  }, []);

  // Find selected segment for center display
  const selectedSegment = useMemo(
    () => segments.find((s) => s.type === selectedMacro),
    [segments, selectedMacro]
  );

  if (segments.length === 0) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center p-4',
          className
        )}
      >
        <div
          className="relative flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          style={{ width: size, height: size }}
        >
          <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
            No macro data
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex flex-col', className)}
      style={
        {
          '--segment-color-protein': 'var(--macro-protein)',
          '--segment-color-carbs': 'var(--macro-carbs)',
          '--segment-color-fat': 'var(--macro-fat)',
        } as React.CSSProperties
      }
    >
      {/* CSS Variables for colors based on color scheme */}
      <style jsx>{`
        :root {
          --macro-protein: ${MACRO_COLORS.protein.fill};
          --macro-carbs: ${MACRO_COLORS.carbs.fill};
          --macro-fat: ${MACRO_COLORS.fat.fill};
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --macro-protein: ${MACRO_COLORS.protein.fillDark};
            --macro-carbs: ${MACRO_COLORS.carbs.fillDark};
            --macro-fat: ${MACRO_COLORS.fat.fillDark};
          }
        }
        :global(.dark) {
          --macro-protein: ${MACRO_COLORS.protein.fillDark};
          --macro-carbs: ${MACRO_COLORS.carbs.fillDark};
          --macro-fat: ${MACRO_COLORS.fat.fillDark};
        }
      `}</style>

      {/* Chart */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
            aria-label="Macro distribution pie chart"
            role="img"
          >
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="text-gray-100 dark:text-gray-700"
              stroke="currentColor"
            />
            {/* Segments */}
            {segments.map((segment) => (
              <DonutSegment
                key={segment.type}
                segment={segment}
                center={center}
                radius={radius}
                strokeWidth={strokeWidth}
                isSelected={selectedMacro === segment.type}
                onSelect={handleSelect}
              />
            ))}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {selectedSegment ? (
              <>
                <span
                  className="text-2xl font-bold transition-all duration-200"
                  style={{ color: `var(--segment-color-${selectedSegment.type})` }}
                >
                  {Math.round(selectedSegment.percentage)}%
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedSegment.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {Math.round(selectedSegment.calories)} cal
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(totalCalories)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  calories
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-1">
        {segments.map((segment) => (
          <LegendItem
            key={segment.type}
            segment={segment}
            isSelected={selectedMacro === segment.type}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
});

MacroPieChart.displayName = 'MacroPieChart';

export default MacroPieChart;
