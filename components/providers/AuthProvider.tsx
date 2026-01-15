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
import type { User, Session } from '@supabase/supabase-js';
import {
  isAuthAvailable,
  getSession,
  getUser,
  getProfile,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  onAuthStateChange,
  ProfileData,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clear service worker auth-related caches (API responses, dynamic pages)
// This prevents stale user data from being served after login/logout
function clearAuthCache(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_AUTH_CACHE' });
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthEnabled = isAuthAvailable();

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!isAuthEnabled) return;

    const profileData = await getProfile();
    setProfile(profileData);
  }, [isAuthEnabled]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    if (result.success && result.user) {
      // Clear cached data from previous session/demo mode
      clearAuthCache();
      setUser(result.user);
      setSession(result.session || null);
      await loadProfile();
    }
    return { success: result.success, error: result.error };
  }, [loadProfile]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const result = await authSignUp(email, password, displayName);
    if (result.success && result.user) {
      // Clear cached data from demo mode
      clearAuthCache();
      setUser(result.user);
      setSession(result.session || null);
      // Profile is created automatically by database trigger
      await loadProfile();
    }
    return { success: result.success, error: result.error };
  }, [loadProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    const result = await authSignOut();
    if (result.success) {
      // Clear cached user data to prevent showing stale content
      clearAuthCache();
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    return { success: result.success, error: result.error };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      if (!isAuthEnabled) {
        // Auth not configured, skip authentication
        setIsLoading(false);
        return;
      }

      try {
        // Get current session
        const currentSession = await getSession();
        setSession(currentSession);

        if (currentSession) {
          // Get user data
          const currentUser = await getUser();
          setUser(currentUser);

          // Load profile
          await loadProfile();
        }
      } catch {
        // Auth initialization failed
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isAuthEnabled, loadProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    if (!isAuthEnabled) return;

    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      // Clear cache on auth state changes (handles external changes like token expiry)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        clearAuthCache();
      }

      if (newSession?.user) {
        setUser(newSession.user);
        await loadProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthEnabled, loadProfile]);

  const isAuthenticated = useMemo(() => {
    // If auth is not enabled, consider user as "authenticated" for demo mode
    if (!isAuthEnabled) return true;
    return !!session && !!user;
  }, [isAuthEnabled, session, user]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthenticated,
      isAuthEnabled,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, isLoading, isAuthenticated, isAuthEnabled, signIn, signUp, signOut, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the full auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get just the current user
 * @returns The currently authenticated user or null
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get user's household ID
 * @returns The household ID or null
 */
export function useHouseholdId(): string | null {
  const { profile } = useAuth();
  return profile?.household_id || null;
}

export default AuthProvider;
