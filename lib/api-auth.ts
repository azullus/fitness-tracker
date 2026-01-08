import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isSQLiteEnabled } from './database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if demo mode is explicitly enabled
// IMPORTANT: Demo mode must be explicitly enabled via environment variable
// This prevents accidental exposure of unprotected APIs
export const isDemoModeEnabled = (): boolean => {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Check if app should allow unauthenticated access
// Either SQLite mode (local-only) or explicit demo mode
export const allowUnauthenticatedAccess = (): boolean => {
  return isSQLiteEnabled() || isDemoModeEnabled();
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
  // If SQLite mode or explicit demo mode, allow unauthenticated access
  if (allowUnauthenticatedAccess()) {
    return { authenticated: true };
  }

  // Supabase must be configured if not in demo/SQLite mode
  if (!isSupabaseConfigured()) {
    // Neither Supabase nor demo mode - deny access
    return { authenticated: false, error: 'Authentication not configured. Set DEMO_MODE=true for demo access.' };
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { authenticated: false, error: 'Failed to create auth client' };
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  // Also check for session cookie (for browser requests)
  const accessToken = authHeader?.replace('Bearer ', '') ||
    request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    // No token provided - require authentication
    return { authenticated: false, error: 'No authentication token provided' };
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

    // Create an authenticated client with the user's token for RLS to work
    const authenticatedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Get user's household from profile using authenticated client
    const { data: profile } = await authenticatedClient
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExtendedAuthResult extends AuthResult {
  isDemoMode: boolean;
  // The Supabase client is typed as 'any' to avoid complex generic type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: any;
}

/**
 * Authenticate API request - handles both demo mode and authenticated mode
 * Returns auth info (including authenticated Supabase client) or an error response
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ auth: ExtendedAuthResult } | { error: NextResponse }> {
  // If SQLite mode or explicit demo mode enabled, allow all requests
  if (allowUnauthenticatedAccess()) {
    return {
      auth: {
        authenticated: true,
        isDemoMode: true,
      },
    };
  }

  // Supabase must be configured if not in demo/SQLite mode
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 503 }
      ),
    };
  }

  // Get the authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '') ||
    request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    return {
      error: NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      ),
    };
  }

  // Create authenticated client with user's token
  const authenticatedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  try {
    // Verify the token and get user
    const { data: { user }, error } = await authenticatedClient.auth.getUser(accessToken);

    if (error || !user) {
      return {
        error: NextResponse.json(
          { success: false, error: error?.message || 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    // Get user's household from profile
    const { data: profile } = await authenticatedClient
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    return {
      auth: {
        authenticated: true,
        userId: user.id,
        householdId: profile?.household_id || undefined,
        isDemoMode: false,
        supabaseClient: authenticatedClient,
      },
    };
  } catch {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Check if user can access a specific person's data
 * In demo mode or if user has access, returns true
 * Otherwise returns an error response
 *
 * Uses the authenticated client from auth to verify person belongs to user's household
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

  // For SQLite mode, allow all authenticated users
  if (isSQLiteEnabled()) {
    return { authorized: true };
  }

  // If no authenticated client, allow (fallback for edge cases)
  if (!auth.supabaseClient) {
    return { authorized: true };
  }

  // Use the authenticated client to check if person belongs to user's household
  try {
    const { data: person } = await auth.supabaseClient
      .from('persons')
      .select('household_id')
      .eq('id', personId)
      .single();

    // If person exists and belongs to user's household, allow access
    if (person && person.household_id === auth.householdId) {
      return { authorized: true };
    }

    // If user has no household or person doesn't belong to it
    if (!auth.householdId || person?.household_id !== auth.householdId) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Access denied to this person\'s data' },
          { status: 403 }
        ),
      };
    }
  } catch {
    // On error, allow (person might not exist yet during creation)
    return { authorized: true };
  }

  return { authorized: true };
}

/**
 * Check if user can access household data
 * In demo mode or if user has household access, returns true
 *
 * Note: We trust auth.householdId which was already retrieved using the
 * authenticated client in getAuthFromRequest. No need to re-query.
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

  // Compare with the household already retrieved from the authenticated session
  // This avoids re-querying with anon key which would be blocked by RLS
  if (auth.householdId && auth.householdId === householdId) {
    return { authorized: true };
  }

  // For SQLite mode, allow all authenticated users
  if (isSQLiteEnabled()) {
    return { authorized: true };
  }

  // User's household doesn't match the requested household
  return {
    error: NextResponse.json(
      { success: false, error: 'Access denied to this household\'s data' },
      { status: 403 }
    ),
  };
}
