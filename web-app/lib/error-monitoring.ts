/**
 * Error Monitoring Infrastructure
 *
 * Provides centralized error tracking and reporting.
 * Can be configured to use external services (Sentry, etc.) or local logging.
 */

import { env } from './env';

// Error severity levels
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

// Error context for additional debugging info
export interface ErrorContext {
  // Where the error occurred
  component?: string;
  action?: string;
  route?: string;

  // User context (anonymized)
  userId?: string;
  personId?: string;
  isDemo?: boolean;

  // Request context
  method?: string;
  url?: string;
  statusCode?: number;

  // Additional data
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

// Error report structure
export interface ErrorReport {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  environment: string;
}

// Error monitoring configuration
interface ErrorMonitoringConfig {
  enabled: boolean;
  logToConsole: boolean;
  sampleRate: number; // 0-1, percentage of errors to report
  ignorePatterns: RegExp[];
}

// Default configuration
const defaultConfig: ErrorMonitoringConfig = {
  enabled: true,
  logToConsole: true,
  sampleRate: 1.0,
  ignorePatterns: [
    /ResizeObserver loop/i,
    /Loading chunk \d+ failed/i,
    /Network request failed/i,
  ],
};

// In-memory error buffer for batch reporting
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if error should be ignored based on patterns
 */
function shouldIgnoreError(message: string, config: ErrorMonitoringConfig): boolean {
  return config.ignorePatterns.some(pattern => pattern.test(message));
}

/**
 * Check if error should be sampled
 */
function shouldSampleError(config: ErrorMonitoringConfig): boolean {
  return Math.random() < config.sampleRate;
}

/**
 * Format error for reporting
 */
function formatError(
  error: Error | string,
  severity: ErrorSeverity,
  context: ErrorContext
): ErrorReport {
  const isError = error instanceof Error;
  const envConfig = env();

  return {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    severity,
    message: isError ? error.message : String(error),
    stack: isError ? error.stack : undefined,
    context: {
      ...context,
      isDemo: !envConfig.supabase.configured,
    },
    environment: envConfig.nodeEnv,
  };
}

/**
 * Log error to console with formatting
 */
function logToConsole(report: ErrorReport): void {
  const prefix = `[${report.severity.toUpperCase()}]`;
  const contextStr = Object.entries(report.context)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  const logFn = report.severity === 'fatal' || report.severity === 'error'
    ? console.error
    : report.severity === 'warning'
      ? console.warn
      : console.info;

  logFn(`${prefix} ${report.message}`);
  if (contextStr) {
    logFn(`  Context: ${contextStr}`);
  }
  if (report.stack && report.severity !== 'info') {
    logFn(`  Stack: ${report.stack.split('\n').slice(0, 3).join('\n')}`);
  }
}

/**
 * Add error to buffer for batch processing
 */
function bufferError(report: ErrorReport): void {
  errorBuffer.push(report);

  // Trim buffer if too large
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }
}

/**
 * Main error capture function
 */
export function captureError(
  error: Error | string,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'error'
): string | null {
  const config = defaultConfig;

  // Check if monitoring is enabled
  if (!config.enabled) {
    return null;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Check ignore patterns
  if (shouldIgnoreError(message, config)) {
    return null;
  }

  // Check sampling
  if (!shouldSampleError(config)) {
    return null;
  }

  // Format the error
  const report = formatError(error, severity, context);

  // Log to console if enabled
  if (config.logToConsole) {
    logToConsole(report);
  }

  // Buffer for potential batch sending
  bufferError(report);

  // Here you would send to external service (Sentry, etc.)
  // sendToExternalService(report);

  return report.id;
}

/**
 * Capture exception (alias for captureError with error severity)
 */
export function captureException(
  error: Error,
  context: ErrorContext = {}
): string | null {
  return captureError(error, context, 'error');
}

/**
 * Capture message (for non-exception errors)
 */
export function captureMessage(
  message: string,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'info'
): string | null {
  return captureError(message, context, severity);
}

/**
 * Capture warning
 */
export function captureWarning(
  message: string,
  context: ErrorContext = {}
): string | null {
  return captureError(message, context, 'warning');
}

/**
 * Capture fatal error
 */
export function captureFatal(
  error: Error | string,
  context: ErrorContext = {}
): string | null {
  return captureError(error, context, 'fatal');
}

/**
 * Get recent errors from buffer
 */
export function getRecentErrors(count: number = 10): ErrorReport[] {
  return errorBuffer.slice(-count);
}

/**
 * Clear error buffer
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}

/**
 * Wrap async function with error capture
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  }) as T;
}

/**
 * API route error handler
 */
export function handleApiError(
  error: unknown,
  context: Omit<ErrorContext, 'component'> = {}
): { message: string; errorId: string | null } {
  const err = error instanceof Error ? error : new Error(String(error));

  const errorId = captureException(err, {
    component: 'api',
    ...context,
  });

  // Return safe error message for client
  const envConfig = env();
  const message = envConfig.isProduction
    ? 'An unexpected error occurred'
    : err.message;

  return { message, errorId };
}

/**
 * Component error boundary helper
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack?: string },
  componentName?: string
): string | null {
  return captureException(error, {
    component: componentName || 'unknown',
    extra: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * Initialize error monitoring (call once at app startup)
 */
export function initErrorMonitoring(): void {
  const envConfig = env();

  // Log initialization
  if (typeof console !== 'undefined') {
    console.info(
      `[Error Monitoring] Initialized in ${envConfig.nodeEnv} mode` +
      (envConfig.supabase.configured ? '' : ' (demo mode)')
    );
  }

  // Set up global error handler for uncaught errors (browser)
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      captureError(error || String(message), {
        component: 'global',
        extra: { source, lineno, colno },
      }, 'fatal');
    };

    window.onunhandledrejection = (event) => {
      captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { component: 'global', action: 'unhandledRejection' },
        'error'
      );
    };
  }

  // Set up global error handler for uncaught errors (Node.js)
  if (typeof process !== 'undefined' && process.on) {
    process.on('uncaughtException', (error) => {
      captureFatal(error, { component: 'process', action: 'uncaughtException' });
    });

    process.on('unhandledRejection', (reason) => {
      captureError(
        reason instanceof Error ? reason : new Error(String(reason)),
        { component: 'process', action: 'unhandledRejection' },
        'error'
      );
    });
  }
}

// Export types for external use
export type { ErrorMonitoringConfig };
