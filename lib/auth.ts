import { supabase, isSupabaseConfigured } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// Types for auth responses
export interface AuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
}

export interface ProfileData {
  id: string;
  household_id: string | null;
  display_name: string | null;
  created_at: string;
}

// Check if auth is available (Supabase must be configured)
export const isAuthAvailable = (): boolean => {
  return isSupabaseConfigured() && supabase !== null;
};

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    // Call our API endpoint which handles profile/household creation
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split('@')[0],
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Sign up failed' };
    }

    return {
      success: true,
      user: result.user,
      session: result.session,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign up failed',
    };
  }
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign in failed',
    };
  }
}

// Sign out
export async function signOut(): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign out failed',
    };
  }
}

// Get current session
export async function getSession(): Promise<Session | null> {
  if (!isAuthAvailable() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }
    return data.session;
  } catch {
    return null;
  }
}

// Get current user
export async function getUser(): Promise<User | null> {
  if (!isAuthAvailable() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Password reset failed',
    };
  }
}

// Update password (after reset)
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Password update failed',
    };
  }
}

// Get user profile with household info
export async function getProfile(): Promise<ProfileData | null> {
  if (!isAuthAvailable() || !supabase) {
    return null;
  }

  try {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return null;
    }

    return data as ProfileData;
  } catch {
    return null;
  }
}

// Update user profile
export async function updateProfile(
  updates: Partial<Pick<ProfileData, 'display_name'>>
): Promise<AuthResponse> {
  if (!isAuthAvailable() || !supabase) {
    return { success: false, error: 'Authentication is not configured' };
  }

  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Profile update failed',
    };
  }
}

// Subscribe to auth state changes
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!isAuthAvailable() || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
}
