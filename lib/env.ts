/**
 * Environment Variable Validation
 *
 * Validates required environment variables at build/runtime.
 * Provides type-safe access to environment configuration.
 */

// Environment modes
export type EnvMode = 'development' | 'production' | 'test';

// Environment configuration interface
export interface EnvConfig {
  // App mode
  nodeEnv: EnvMode;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Supabase (optional - app works in demo mode without these)
  supabase: {
    configured: boolean;
    url: string | null;
    anonKey: string | null;
  };

  // App configuration
  app: {
    url: string;
    name: string;
  };
}

// Validation error type
export interface EnvValidationError {
  variable: string;
  message: string;
  required: boolean;
}

/**
 * Validate environment variables and return configuration
 */
export function validateEnv(): { config: EnvConfig; errors: EnvValidationError[]; warnings: EnvValidationError[] } {
  const errors: EnvValidationError[] = [];
  const warnings: EnvValidationError[] = [];

  // Determine environment mode
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvMode;
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';

  // Supabase configuration (optional)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
  const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

  // Validate Supabase URL format if provided
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes('supabase')) {
        warnings.push({
          variable: 'NEXT_PUBLIC_SUPABASE_URL',
          message: 'URL does not appear to be a Supabase URL',
          required: false,
        });
      }
    } catch {
      errors.push({
        variable: 'NEXT_PUBLIC_SUPABASE_URL',
        message: 'Invalid URL format',
        required: false,
      });
    }
  }

  // Validate Supabase anon key format if provided
  if (supabaseAnonKey) {
    // Supabase anon keys can be JWTs (eyJ...) or publishable keys (sb_publishable_...)
    const isJWT = supabaseAnonKey.split('.').length === 3;
    const isPublishable = supabaseAnonKey.startsWith('sb_publishable_');

    if (!isJWT && !isPublishable) {
      errors.push({
        variable: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        message: 'Invalid key format (expected JWT or sb_publishable_ format)',
        required: false,
      });
    }
  }

  // Warn if only one Supabase variable is set
  if ((supabaseUrl && !supabaseAnonKey) || (!supabaseUrl && supabaseAnonKey)) {
    warnings.push({
      variable: 'SUPABASE_CONFIG',
      message: 'Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for Supabase to work',
      required: false,
    });
  }

  // Production-specific validations
  if (isProduction && !supabaseConfigured) {
    warnings.push({
      variable: 'SUPABASE_CONFIG',
      message: 'Running in production without Supabase configured - app will use demo mode only',
      required: false,
    });
  }

  // App URL (for CORS, redirects, etc.)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (isProduction ? '' : 'http://localhost:3000');

  if (isProduction && !process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push({
      variable: 'NEXT_PUBLIC_APP_URL',
      message: 'NEXT_PUBLIC_APP_URL not set in production - some features may not work correctly',
      required: false,
    });
  }

  const config: EnvConfig = {
    nodeEnv,
    isDevelopment,
    isProduction,
    isTest,
    supabase: {
      configured: supabaseConfigured,
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    app: {
      url: appUrl,
      name: process.env.NEXT_PUBLIC_APP_NAME || 'Fitness Tracker',
    },
  };

  return { config, errors, warnings };
}

/**
 * Get validated environment configuration
 * Throws if there are critical errors in production
 */
export function getEnvConfig(): EnvConfig {
  const { config, errors, warnings } = validateEnv();

  // Log warnings
  if (warnings.length > 0 && typeof console !== 'undefined') {
    warnings.forEach(w => {
      console.warn(`[ENV WARNING] ${w.variable}: ${w.message}`);
    });
  }

  // In production, throw on errors
  if (config.isProduction && errors.length > 0) {
    const errorMessages = errors.map(e => `${e.variable}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // In development, just log errors
  if (errors.length > 0 && typeof console !== 'undefined') {
    errors.forEach(e => {
      console.error(`[ENV ERROR] ${e.variable}: ${e.message}`);
    });
  }

  return config;
}

/**
 * Check if the app is properly configured for production
 */
export function isProductionReady(): { ready: boolean; issues: string[] } {
  const { config, errors } = validateEnv();
  const issues: string[] = [];

  // Check for errors
  errors.forEach(e => {
    issues.push(`Error: ${e.variable} - ${e.message}`);
  });

  // Check for critical warnings in production
  if (config.isProduction) {
    if (!config.supabase.configured) {
      issues.push('Supabase not configured - authentication will not work');
    }
    if (!config.app.url) {
      issues.push('App URL not configured - CORS and redirects may fail');
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

// Export singleton config (validated once at startup)
let _envConfig: EnvConfig | null = null;

export function env(): EnvConfig {
  if (!_envConfig) {
    _envConfig = getEnvConfig();
  }
  return _envConfig;
}
