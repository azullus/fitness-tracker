import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/signup
 *
 * Handles user signup with automatic profile and household creation.
 * This replaces the disabled database trigger by creating profile/household in application code.
 */
export async function POST(request: NextRequest) {
  // Use runtime env vars (non-NEXT_PUBLIC prefixed) to avoid build-time inlining
  // Fall back to NEXT_PUBLIC vars for backwards compatibility
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { success: false, error: 'Authentication is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create admin client (use service key if available, otherwise anon key)
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Step 2: Create household
    // Note: households table has RLS disabled as a workaround, so this should work
    const householdName = `${displayName || email.split('@')[0]}'s Household`;
    const { data: household, error: householdError } = await adminClient
      .from('households')
      .insert({ name: householdName })
      .select()
      .single();

    if (householdError) {
      console.error('Failed to create household:', householdError);
      // Return error since household is needed for profile
      return NextResponse.json(
        {
          success: false,
          error: `Household creation failed: ${householdError.message}`,
        },
        { status: 500 }
      );
    }

    // Step 3: Create profile linked to household
    // Note: profiles has RLS policy allowing users to insert their own profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authData.user.id,
      household_id: household.id,
      display_name: displayName || email.split('@')[0],
    });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: `Profile creation failed: ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(
      `Successfully created user ${authData.user.id} with household ${household.id}`
    );

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      },
      { status: 500 }
    );
  }
}
