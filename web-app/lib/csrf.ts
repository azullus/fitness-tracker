/**
 * CSRF Protection Utilities
 *
 * Implements the double-submit cookie pattern for CSRF protection:
 * 1. Server generates a secure random token and sets it in an HTTP-only cookie
 * 2. Client reads the token from a separate readable cookie and includes it in request headers
 * 3. Server validates that the header token matches the cookie token
 *
 * This works in both authenticated and demo mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual } from 'crypto';

// CSRF configuration
export const CSRF_CONFIG = {
  // Cookie names
  TOKEN_COOKIE_NAME: 'csrf-token',
  // Header name for CSRF token
  TOKEN_HEADER_NAME: 'x-csrf-token',
  // Token length in bytes (32 bytes = 64 hex characters)
  TOKEN_LENGTH: 32,
  // Cookie max age (24 hours)
  COOKIE_MAX_AGE: 60 * 60 * 24,
  // Methods that require CSRF validation
  PROTECTED_METHODS: ['POST', 'PUT', 'PATCH', 'DELETE'] as const,
} as const;

export type ProtectedMethod = (typeof CSRF_CONFIG.PROTECTED_METHODS)[number];

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex');
}

/**
 * Create a response with a new CSRF token cookie set
 * Use this when you need to set or refresh the token
 */
export function setCSRFTokenCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCSRFToken();

  // Set HTTP-only cookie for server validation
  response.cookies.set(CSRF_CONFIG.TOKEN_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript for double-submit pattern
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_CONFIG.COOKIE_MAX_AGE,
  });

  return response;
}

/**
 * Get CSRF token from request cookies
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_CONFIG.TOKEN_COOKIE_NAME)?.value || null;
}

/**
 * Get CSRF token from request header
 */
export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_CONFIG.TOKEN_HEADER_NAME);
}

/**
 * Validate that the CSRF tokens match using timing-safe comparison
 */
function tokensMatch(token1: string, token2: string): boolean {
  if (!token1 || !token2) return false;
  if (token1.length !== token2.length) return false;

  try {
    const buf1 = Buffer.from(token1, 'utf-8');
    const buf2 = Buffer.from(token2, 'utf-8');
    return timingSafeEqual(buf1, buf2);
  } catch {
    return false;
  }
}

/**
 * CSRF validation result
 */
export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
  shouldSetToken?: boolean;
}

/**
 * Validate CSRF token for a request
 *
 * For protected methods (POST, PUT, PATCH, DELETE):
 * - Checks that both cookie and header contain the same token
 *
 * For safe methods (GET, HEAD, OPTIONS):
 * - Always valid, but indicates if token should be set
 */
export function validateCSRFToken(request: NextRequest): CSRFValidationResult {
  const method = request.method.toUpperCase();

  // Check if this method requires CSRF protection
  const isProtectedMethod = CSRF_CONFIG.PROTECTED_METHODS.includes(
    method as ProtectedMethod
  );

  // Get tokens
  const cookieToken = getCSRFTokenFromCookie(request);
  const headerToken = getCSRFTokenFromHeader(request);

  // For safe methods, just check if we need to set a token
  if (!isProtectedMethod) {
    return {
      valid: true,
      shouldSetToken: !cookieToken,
    };
  }

  // For protected methods, validate tokens
  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token cookie not found',
      shouldSetToken: true,
    };
  }

  if (!headerToken) {
    return {
      valid: false,
      error: 'CSRF token header not found',
    };
  }

  if (!tokensMatch(cookieToken, headerToken)) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * CSRF protection middleware helper for API routes
 *
 * Usage in API route:
 * ```typescript
 * import { withCSRFProtection } from '@/lib/csrf';
 *
 * export async function POST(request: NextRequest) {
 *   const csrfResult = withCSRFProtection(request);
 *   if (csrfResult.response) {
 *     return csrfResult.response;
 *   }
 *
 *   // Process request...
 *   const response = NextResponse.json({ success: true });
 *
 *   // Optionally refresh token if needed
 *   if (csrfResult.shouldSetToken) {
 *     return setCSRFTokenCookie(response);
 *   }
 *   return response;
 * }
 * ```
 */
export function withCSRFProtection(request: NextRequest): { response?: NextResponse; shouldSetToken?: boolean } {
  const result = validateCSRFToken(request);

  if (!result.valid) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: result.error || 'CSRF validation failed',
          code: 'CSRF_VALIDATION_FAILED',
        },
        { status: 403 }
      ),
    };
  }

  return { shouldSetToken: result.shouldSetToken };
}

/**
 * Create a CSRF-protected API response
 * Automatically sets CSRF token cookie if needed
 */
export function createCSRFProtectedResponse<T>(
  data: T,
  request: NextRequest,
  options?: { status?: number }
): NextResponse {
  const response = NextResponse.json(data, { status: options?.status || 200 });

  // Check if we need to set/refresh the token
  const cookieToken = getCSRFTokenFromCookie(request);
  if (!cookieToken) {
    return setCSRFTokenCookie(response);
  }

  return response;
}

/**
 * Rotate CSRF token after sensitive operations
 * Use this after login, logout, or other sensitive operations
 */
export function rotateCSRFToken(response: NextResponse): NextResponse {
  return setCSRFTokenCookie(response, generateCSRFToken());
}

/**
 * Clear CSRF token (e.g., on logout)
 */
export function clearCSRFToken(response: NextResponse): NextResponse {
  response.cookies.delete(CSRF_CONFIG.TOKEN_COOKIE_NAME);
  return response;
}
