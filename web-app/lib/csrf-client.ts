/**
 * Client-side CSRF utilities
 *
 * These utilities help frontend code include CSRF tokens in API requests.
 * The token is read from a cookie and included in request headers.
 */

import { CSRF_CONFIG } from './csrf';

/**
 * Get CSRF token from cookies on the client side
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_CONFIG.TOKEN_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Get headers object with CSRF token included
 */
export function getCSRFHeaders(): HeadersInit {
  const token = getCSRFToken();
  if (!token) {
    return {};
  }

  return {
    [CSRF_CONFIG.TOKEN_HEADER_NAME]: token,
  };
}

/**
 * Merge CSRF headers with existing headers
 */
export function withCSRFHeaders(headers?: HeadersInit): HeadersInit {
  const csrfHeaders = getCSRFHeaders();

  if (!headers) {
    return csrfHeaders;
  }

  // Handle Headers object
  if (headers instanceof Headers) {
    const merged = new Headers(headers);
    const token = getCSRFToken();
    if (token) {
      merged.set(CSRF_CONFIG.TOKEN_HEADER_NAME, token);
    }
    return merged;
  }

  // Handle array of tuples
  if (Array.isArray(headers)) {
    const token = getCSRFToken();
    if (token) {
      return [...headers, [CSRF_CONFIG.TOKEN_HEADER_NAME, token]];
    }
    return headers;
  }

  // Handle plain object
  return {
    ...headers,
    ...csrfHeaders,
  };
}

/**
 * Enhanced fetch function that automatically includes CSRF token
 *
 * Usage:
 * ```typescript
 * const response = await csrfFetch('/api/meals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = init?.method?.toUpperCase() || 'GET';

  // Only add CSRF token for state-changing methods
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!protectedMethods.includes(method)) {
    return fetch(input, init);
  }

  const enhancedInit: RequestInit = {
    ...init,
    headers: withCSRFHeaders(init?.headers),
    credentials: 'same-origin', // Ensure cookies are sent
  };

  return fetch(input, enhancedInit);
}

/**
 * Create a fetch wrapper that automatically includes CSRF token
 * Useful for creating API clients
 */
export function createCSRFFetch() {
  return {
    get: (url: string, init?: Omit<RequestInit, 'method'>) =>
      csrfFetch(url, { ...init, method: 'GET' }),

    post: (url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      csrfFetch(url, {
        ...init,
        method: 'POST',
        headers: withCSRFHeaders({
          'Content-Type': 'application/json',
          ...init?.headers,
        }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),

    put: (url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      csrfFetch(url, {
        ...init,
        method: 'PUT',
        headers: withCSRFHeaders({
          'Content-Type': 'application/json',
          ...init?.headers,
        }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),

    patch: (url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      csrfFetch(url, {
        ...init,
        method: 'PATCH',
        headers: withCSRFHeaders({
          'Content-Type': 'application/json',
          ...init?.headers,
        }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),

    delete: (url: string, init?: Omit<RequestInit, 'method'>) =>
      csrfFetch(url, { ...init, method: 'DELETE' }),
  };
}

/**
 * Pre-configured API client with CSRF protection
 */
export const api = createCSRFFetch();
