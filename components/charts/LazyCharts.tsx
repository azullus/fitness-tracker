'use client';

import dynamic from 'next/dynamic';
import { WeightChartSkeleton, MacroChartSkeleton } from '@/components/ui/Skeleton';

/**
 * Lazy-loaded WeightProgressChart with skeleton loading state
 * Use this for non-critical rendering paths to improve initial load time
 */
export const LazyWeightProgressChart = dynamic(
  () => import('./WeightProgressChart').then((mod) => mod.WeightProgressChart),
  {
    loading: () => <WeightChartSkeleton />,
    ssr: false, // Charts often use browser-specific APIs
  }
);

/**
 * Lazy-loaded MacroPieChart with skeleton loading state
 * Use this for non-critical rendering paths to improve initial load time
 */
export const LazyMacroPieChart = dynamic(
  () => import('./MacroPieChart').then((mod) => mod.MacroPieChart),
  {
    loading: () => <MacroChartSkeleton />,
    ssr: false, // Charts often use browser-specific APIs
  }
);
