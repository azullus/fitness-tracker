'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { getCSRFToken, csrfFetch, api } from '@/lib/csrf-client';

interface CSRFContextType {
  /** The current CSRF token, or null if not yet loaded */
  token: string | null;
  /** Whether the CSRF token has been loaded */
  isReady: boolean;
  /** Refresh the CSRF token from cookies */
  refreshToken: () => void;
  /** Fetch function with CSRF protection */
  fetch: typeof csrfFetch;
  /** Pre-configured API client with CSRF protection */
  api: typeof api;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

interface CSRFProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages CSRF token state
 * Wrap your application with this to enable CSRF protection
 *
 * Usage:
 * ```tsx
 * // In your layout or root component
 * <CSRFProvider>
 *   <App />
 * </CSRFProvider>
 *
 * // In your components
 * const { api } = useCSRF();
 * await api.post('/api/meals', { name: 'Lunch' });
 * ```
 */
export function CSRFProvider({ children }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshToken = useCallback(() => {
    const currentToken = getCSRFToken();
    setToken(currentToken);
    setIsReady(true);
  }, []);

  // Initialize token on mount
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // If no token exists, make a request to get one
  // This ensures the cookie is set on first load
  useEffect(() => {
    if (isReady && !token) {
      // Make a simple GET request to establish CSRF cookie
      // The server should set the cookie on any response
      fetch('/api/csrf', { credentials: 'same-origin' })
        .then(() => {
          refreshToken();
        })
        .catch(() => {
          // Silently fail - CSRF endpoint might not exist
          // The cookie will be set on the next API call
        });
    }
  }, [isReady, token, refreshToken]);

  const contextValue = useMemo<CSRFContextType>(
    () => ({
      token,
      isReady,
      refreshToken,
      fetch: csrfFetch,
      api,
    }),
    [token, isReady, refreshToken]
  );

  return (
    <CSRFContext.Provider value={contextValue}>
      {children}
    </CSRFContext.Provider>
  );
}

/**
 * Hook to access CSRF protection utilities
 *
 * @throws Error if used outside CSRFProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { api, token, isReady } = useCSRF();
 *
 *   const handleSubmit = async () => {
 *     const response = await api.post('/api/meals', { name: 'Lunch' });
 *     // ...
 *   };
 *
 *   return <button onClick={handleSubmit}>Submit</button>;
 * }
 * ```
 */
export function useCSRF(): CSRFContextType {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

/**
 * Hook to get just the CSRF-protected fetch function
 * Useful when you only need to make API calls
 *
 * @example
 * ```tsx
 * const csrfFetch = useCSRFFetch();
 *
 * await csrfFetch('/api/meals', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCSRFFetch(): typeof csrfFetch {
  const { fetch: csrfFetchFn } = useCSRF();
  return csrfFetchFn;
}

/**
 * Hook to get the pre-configured API client
 *
 * @example
 * ```tsx
 * const api = useCSRFAPI();
 *
 * await api.post('/api/meals', { name: 'Lunch' });
 * await api.delete('/api/meals?id=123');
 * ```
 */
export function useCSRFAPI(): typeof api {
  const { api: apiClient } = useCSRF();
  return apiClient;
}

/**
 * Hook to get just the current CSRF token
 */
export function useCSRFToken(): string | null {
  const { token } = useCSRF();
  return token;
}

export default CSRFProvider;
