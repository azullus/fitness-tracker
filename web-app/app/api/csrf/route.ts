import { NextRequest, NextResponse } from 'next/server';
import { getCSRFTokenFromCookie, setCSRFTokenCookie } from '@/lib/csrf';

/**
 * GET /api/csrf
 *
 * Endpoint to initialize or retrieve CSRF token.
 * Sets the CSRF cookie if not already present.
 *
 * This endpoint can be called on page load to ensure
 * the CSRF token cookie is set before any POST requests.
 */
export async function GET(request: NextRequest) {
  const existingToken = getCSRFTokenFromCookie(request);

  const response = NextResponse.json({
    success: true,
    hasToken: !!existingToken,
  });

  // Set cookie if not present
  if (!existingToken) {
    return setCSRFTokenCookie(response);
  }

  return response;
}
