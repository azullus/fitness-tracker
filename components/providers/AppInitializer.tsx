'use client';

import { useEffect, ReactNode } from 'react';
import { initErrorMonitoring } from '@/lib/error-monitoring';
import { validateEnv } from '@/lib/env';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AppInitializerProps {
  children: ReactNode;
}

/**
 * App Initializer component
 *
 * Handles app-level initialization:
 * - Error monitoring setup
 * - Environment validation
 * - Global error boundaries
 */
export function AppInitializer({ children }: AppInitializerProps) {
  useEffect(() => {
    // Initialize error monitoring
    initErrorMonitoring();

    // Validate environment and log warnings
    const { warnings, errors } = validateEnv();

    if (warnings.length > 0) {
      console.group('[App] Environment Warnings');
      warnings.forEach(w => console.warn(`${w.variable}: ${w.message}`));
      console.groupEnd();
    }

    if (errors.length > 0) {
      console.group('[App] Environment Errors');
      errors.forEach(e => console.error(`${e.variable}: ${e.message}`));
      console.groupEnd();
    }
  }, []);

  return (
    <ErrorBoundary componentName="App">
      {children}
    </ErrorBoundary>
  );
}

export default AppInitializer;
