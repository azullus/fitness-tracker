'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function DebugPage() {
  const { isAuthenticated, isAuthEnabled, isLoading, user, profile } = useAuth();

  const supabaseConfigured = isSupabaseConfigured();
  const supabaseExists = supabase !== null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>

      <div className="space-y-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
        <div>
          <strong>supabaseConfigured:</strong> {String(supabaseConfigured)}
        </div>
        <div>
          <strong>supabaseExists:</strong> {String(supabaseExists)}
        </div>
        <div>
          <strong>isAuthEnabled:</strong> {String(isAuthEnabled)}
        </div>
        <div>
          <strong>isLoading:</strong> {String(isLoading)}
        </div>
        <div>
          <strong>isAuthenticated:</strong> {String(isAuthenticated)}
        </div>
        <div>
          <strong>user:</strong> {user ? user.email : 'null'}
        </div>
        <div>
          <strong>profile:</strong> {profile ? JSON.stringify(profile) : 'null'}
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET'}
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <a href="/auth/login" className="text-blue-600 underline">Go to Login</a>
        <a href="/" className="text-blue-600 underline">Go to Home</a>
      </div>
    </div>
  );
}
