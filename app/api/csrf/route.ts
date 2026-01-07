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

  // If token exists, return it
  if (existingToken) {
    return NextResponse.json({
      success: true,
      token: existingToken,
      hasToken: true,
    });
  }

  // Generate and set new token
  const response = NextResponse.json({
    success: true,
    token: '', // Will be set by setCSRFTokenCookie
    hasToken: false,
  });

  // setCSRFTokenCookie generates a token and sets it in the cookie
  const responseWithCookie = setCSRFTokenCookie(response);

  // Extract the token from the Set-Cookie header to return it
  const setCookieHeader = responseWithCookie.headers.get('Set-Cookie');
  if (setCookieHeader) {
    const tokenMatch = setCookieHeader.match(/csrf-token=([^;]+)/);
    if (tokenMatch) {
      const newToken = tokenMatch[1];
      return NextResponse.json({
        success: true,
        token: newToken,
        hasToken: true,
      }, {
        headers: responseWithCookie.headers,
      });
    }
  }

  return responseWithCookie;
}
