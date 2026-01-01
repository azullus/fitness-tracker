/**
 * Rate Limiting Utility for Next.js API Routes
 *
 * Uses an in-memory sliding window algorithm suitable for single-instance deployments.
 * For multi-instance deployments, consider using Redis or a distributed cache.
 */

import { NextResponse } from 'next/server';

// Store for rate limiting data
// Key: identifier (e.g., IP address), Value: array of request timestamps
const rateLimitStore = new Map<string, number[]>();

// Cleanup interval for expired entries (5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Last cleanup timestamp
let lastCleanup = Date.now();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional custom identifier function (defaults to IP-based) */
  getIdentifier?: (request: Request) => string;
}

/**
 * Result from rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** The maximum number of requests allowed */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the rate limit resets */
  reset: number;
}

/**
 * Pre-configured rate limit settings for common use cases
 */
export const RateLimitPresets = {
  /** General API routes: 100 requests per minute */
  GENERAL: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Auth-related routes: 10 requests per minute */
  AUTH: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Seed endpoint: 5 requests per hour */
  SEED: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** GET requests: more permissive - 100 requests per minute */
  READ: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  /** POST/PUT/PATCH requests: moderate - 30 requests per minute */
  WRITE: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  /** DELETE requests: stricter - 20 requests per minute */
  DELETE: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Extract client identifier from request
 * Uses X-Forwarded-For header (for proxied requests) or falls back to a default
 */
function getDefaultIdentifier(request: Request): string {
  // Try to get the client IP from common headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // For development/testing, use a default identifier
  // In production behind a proxy, one of the above headers should be set
  return 'default-client';
}

/**
 * Clean up expired entries from the rate limit store
 * This prevents memory leaks from accumulated old entries
 */
function cleanupExpiredEntries(maxWindowMs: number): void {
  const now = Date.now();
  const cutoff = now - maxWindowMs;

  for (const [key, timestamps] of Array.from(rateLimitStore.entries())) {
    // Filter out expired timestamps
    const validTimestamps = timestamps.filter((ts: number) => ts > cutoff);

    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else if (validTimestamps.length !== timestamps.length) {
      rateLimitStore.set(key, validTimestamps);
    }
  }

  lastCleanup = now;
}

/**
 * Check rate limit for a request
 * Uses sliding window algorithm for accurate rate limiting
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, getIdentifier = getDefaultIdentifier } = config;
  const now = Date.now();

  // Periodic cleanup to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    // Use the longest possible window for cleanup (1 hour for SEED preset)
    cleanupExpiredEntries(60 * 60 * 1000);
  }

  const identifier = getIdentifier(request);
  const windowStart = now - windowMs;

  // Get existing timestamps for this identifier
  const timestamps = rateLimitStore.get(identifier) || [];

  // Filter to only include timestamps within the current window
  const validTimestamps = timestamps.filter(ts => ts > windowStart);

  // Calculate remaining requests
  const remaining = Math.max(0, limit - validTimestamps.length);

  // Calculate reset time (when the oldest request in window expires)
  const oldestInWindow = validTimestamps.length > 0
    ? Math.min(...validTimestamps)
    : now;
  const reset = Math.ceil((oldestInWindow + windowMs) / 1000);

  if (validTimestamps.length >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  // Add current request timestamp and update store
  validTimestamps.push(now);
  rateLimitStore.set(identifier, validTimestamps);

  return {
    success: true,
    limit,
    remaining: remaining - 1, // Account for current request
    reset,
  };
}

/**
 * Create a rate limiter function with the given configuration
 * This is the recommended way to use rate limiting in API routes
 *
 * @example
 * ```typescript
 * const limiter = rateLimit(RateLimitPresets.GENERAL);
 *
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = limiter(request);
 *   if (!rateLimitResult.success) {
 *     return createRateLimitResponse(rateLimitResult);
 *   }
 *   // Handle request...
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: Request): RateLimitResult => {
    return checkRateLimit(request, config);
  };
}

/**
 * Create a 429 Too Many Requests response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(0, result.reset - Math.floor(Date.now() / 1000));

  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}

/**
 * Add rate limit headers to a successful response
 * Useful for informing clients of their rate limit status
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.reset));
  return response;
}

/**
 * Middleware helper for rate limiting
 * Returns null if allowed, or a 429 response if rate limited
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const rateLimitResponse = applyRateLimit(request, RateLimitPresets.GENERAL);
 *   if (rateLimitResponse) {
 *     return rateLimitResponse;
 *   }
 *   // Handle request...
 * }
 * ```
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(request, config);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  return null;
}

/**
 * Clear rate limit data for a specific identifier
 * Useful for testing or manual resets
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limit data
 * Useful for testing or server restarts
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for an identifier without counting as a request
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs } = config;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = rateLimitStore.get(identifier) || [];
  const validTimestamps = timestamps.filter(ts => ts > windowStart);

  const remaining = Math.max(0, limit - validTimestamps.length);
  const oldestInWindow = validTimestamps.length > 0
    ? Math.min(...validTimestamps)
    : now;
  const reset = Math.ceil((oldestInWindow + windowMs) / 1000);

  return {
    success: validTimestamps.length < limit,
    limit,
    remaining,
    reset,
  };
}
