'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useToastActions } from '@/components/ui/Toast';

export type ConnectionStatus = 'connected' | 'demo' | 'error' | 'loading';
export type DataSource = 'supabase' | 'sqlite' | 'demo' | 'localStorage';

interface ConnectionState {
  status: ConnectionStatus;
  source: DataSource;
  lastError?: string;
  lastRetry?: Date;
}

interface ConnectionStatusContextType {
  connectionState: ConnectionState;
  setConnectionStatus: (status: ConnectionStatus, source: DataSource, error?: string) => void;
  retryConnection: () => void;
  isConnected: boolean;
  isDemoMode: boolean;
}

const ConnectionStatusContext = createContext<ConnectionStatusContextType | undefined>(undefined);

interface ConnectionStatusProviderProps {
  children: ReactNode;
}

// Track if we've already shown a toast for the current session
let hasShownDemoToast = false;
let hasShownErrorToast = false;

export function ConnectionStatusProvider({ children }: ConnectionStatusProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'loading',
    source: 'demo',
  });

  const toast = useToastActions();

  const setConnectionStatus = useCallback(
    (status: ConnectionStatus, source: DataSource, error?: string) => {
      setConnectionState((prev) => {
        // Only update if something changed
        if (prev.status === status && prev.source === source && prev.lastError === error) {
          return prev;
        }

        const newState: ConnectionState = {
          status,
          source,
          lastError: error,
          lastRetry: new Date(),
        };

        // Show toast notifications for status changes
        if (status === 'demo' && !hasShownDemoToast && prev.status !== 'demo') {
          hasShownDemoToast = true;
          toast.warning(
            'Demo Mode Active',
            'Unable to connect to database. Using demo data - changes will not be saved.',
            10000 // Show for 10 seconds
          );
        } else if (status === 'error' && !hasShownErrorToast && error) {
          hasShownErrorToast = true;
          toast.error(
            'Connection Error',
            error,
            () => {
              // Reset toast flags on retry
              hasShownDemoToast = false;
              hasShownErrorToast = false;
              window.location.reload();
            }
          );
        } else if (status === 'connected' && prev.status !== 'connected') {
          // Only show success if we were previously in error/demo state
          if (prev.status === 'error' || prev.status === 'demo') {
            toast.success('Connected', `Successfully connected to ${source}`);
          }
        }

        return newState;
      });
    },
    [toast]
  );

  const retryConnection = useCallback(() => {
    // Reset toast flags
    hasShownDemoToast = false;
    hasShownErrorToast = false;

    // Clear demo mode flag
    try {
      localStorage.removeItem('fitness-tracker-demo-mode');
    } catch {
      // Failed to clear demo mode from localStorage
    }

    // Reload the page to attempt fresh connection
    window.location.reload();
  }, []);

  // Reset toast flags when component mounts (new session)
  useEffect(() => {
    // Check if this is a fresh session
    const sessionKey = 'connection-toast-session';
    const currentSession = sessionStorage.getItem(sessionKey);
    if (!currentSession) {
      hasShownDemoToast = false;
      hasShownErrorToast = false;
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);

  const isConnected = connectionState.status === 'connected';
  const isDemoMode = connectionState.status === 'demo' || connectionState.source === 'demo';

  return (
    <ConnectionStatusContext.Provider
      value={{
        connectionState,
        setConnectionStatus,
        retryConnection,
        isConnected,
        isDemoMode,
      }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  );
}

/**
 * Hook to access connection status
 */
export function useConnectionStatus() {
  const context = useContext(ConnectionStatusContext);
  if (context === undefined) {
    throw new Error('useConnectionStatus must be used within a ConnectionStatusProvider');
  }
  return context;
}

export default ConnectionStatusProvider;
