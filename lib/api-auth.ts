import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isSQLiteEnabled } from './database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Create a Supabase client for server-side use
export const createServerSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createClient(supabaseUrl!, supabaseAnonKey!);
};

// Auth result type
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  householdId?: string;
  error?: string;
}

// Get authentication from request
export async function getAuthFromRequest(request: NextRequest): Promise<AuthResult> {
  // If Supabase is not configured, skip auth (demo mode)
  if (!isSupabaseConfigured()) {
    return { authenticated: true };
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { authenticated: true }; // Allow in demo mode
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  // Also check for session cookie (for browser requests)
  const accessToken = authHeader?.replace('Bearer ', '') ||
    request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    // No token - check if this is demo mode or require auth
    // For now, allow requests without auth in demo mode
    return { authenticated: true };
  }

  try {
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return {
        authenticated: false,
        error: error?.message || 'Invalid or expired token',
      };
    }

    // Get user's household from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    return {
      authenticated: true,
      userId: user.id,
      householdId: profile?.household_id || undefined,
    };
  } catch {
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

// Middleware helper to require authentication
export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authResult = await getAuthFromRequest(request);

  // If Supabase is not configured, allow all requests (demo mode)
  if (!isSupabaseConfigured()) {
    return authResult;
  }

  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return authResult;
}

// Helper to check if user has access to a household
export async function checkHouseholdAccess(
  userId: string,
  householdId: string
): Promise<boolean> {
  // If using SQLite, allow all authenticated users
  // (SQLite is single-household, shared locally)
  if (isSQLiteEnabled()) {
    return true;
  }

  if (!isSupabaseConfigured()) {
    return true; // Allow in demo mode
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return true;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', userId)
    .single();

  return profile?.household_id === householdId;
}

// Helper to check if user has access to a person
export async function checkPersonAccess(
  userId: string,
  personId: string
): Promise<boolean> {
  // If using SQLite, allow all authenticated users to manage their persons
  // (SQLite doesn't have user-specific data, it's all local)
  if (isSQLiteEnabled()) {
    return true;
  }

  if (!isSupabaseConfigured()) {
    return true; // Allow in demo mode
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return true;
  }

  // Get user's household
  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', userId)
    .single();

  if (!profile?.household_id) {
    return false;
  }

  // Check if person belongs to user's household
  const { data: person } = await supabase
    .from('persons')
    .select('household_id')
    .eq('id', personId)
    .single();

  return person?.household_id === profile.household_id;
}

// Extended auth result with demo mode flag
export interface ExtendedAuthResult extends AuthResult {
  isDemoMode: boolean;
}

/**
 * Authenticate API request - handles both demo mode and authenticated mode
 * Returns auth info or an error response
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ auth: ExtendedAuthResult } | { error: NextResponse }> {
  // If Supabase is not configured, this is demo mode - allow all requests
  if (!isSupabaseConfigured()) {
    return {
      auth: {
        authenticated: true,
        isDemoMode: true,
      },
    };
  }

  const authResult = await getAuthFromRequest(request);

  // Check if there's a valid token but authentication failed
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '') ||
    request.cookies.get('sb-access-token')?.value;

  // If no token provided and Supabase is configured, treat as demo mode request
  // This allows the app to work without auth while still supporting authenticated users
  if (!accessToken) {
    return {
      auth: {
        authenticated: true,
        isDemoMode: true,
      },
    };
  }

  // Token was provided but auth failed
  if (!authResult.authenticated) {
    return {
      error: NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return {
    auth: {
      ...authResult,
      isDemoMode: false,
    },
  };
}

/**
 * Check if user can access a specific person's data
 * In demo mode or if user has access, returns true
 * Otherwise returns an error response
 */
export async function authorizePersonAccess(
  auth: ExtendedAuthResult,
  personId: string
): Promise<{ authorized: true } | { error: NextResponse }> {
  // Demo mode - allow all
  if (auth.isDemoMode) {
    return { authorized: true };
  }

  // Must be authenticated with a userId
  if (!auth.userId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      ),
    };
  }

  const hasAccess = await checkPersonAccess(auth.userId, personId);
  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Access denied to this person\'s data' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}

/**
 * Check if user can access household data
 * In demo mode or if user has household access, returns true
 */
export async function authorizeHouseholdAccess(
  auth: ExtendedAuthResult,
  householdId?: string
): Promise<{ authorized: true } | { error: NextResponse }> {
  // Demo mode - allow all
  if (auth.isDemoMode) {
    return { authorized: true };
  }

  // Must be authenticated with a userId
  if (!auth.userId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      ),
    };
  }

  // If no specific household requested, just verify user is authenticated
  if (!householdId) {
    return { authorized: true };
  }

  const hasAccess = await checkHouseholdAccess(auth.userId, householdId);
  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Access denied to this household\'s data' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}
