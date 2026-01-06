'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  isLoading: boolean;
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthEnabled: false,
  isLoading: true,
  user: null,
  profile: null,
  signUp: async () => ({ needsConfirmation: false }),
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const isAuthEnabled = isSupabaseConfigured();

  useEffect(() => {
    if (!isAuthEnabled || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isAuthEnabled]);

  async function signUp(email: string, password: string, name?: string): Promise<{ needsConfirmation: boolean }> {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;

    // If user was created and we have their ID, create a person record
    if (data.user) {
      const { error: personError } = await supabase
        .from('persons')
        .insert({
          id: data.user.id,
          name: name || email.split('@')[0],
          training_focus: '',
          allergies: '',
          supplements: '',
        });

      if (personError) {
        console.error('Error creating person record:', personError);
      }
    }

    // Return whether email confirmation is needed
    return { needsConfirmation: !data.session };
  }

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Auth not configured');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    if (!supabase) throw new Error('Auth not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword: string) {
    if (!supabase) throw new Error('Auth not configured');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthEnabled,
        isLoading,
        user,
        profile,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
