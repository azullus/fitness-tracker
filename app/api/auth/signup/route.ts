import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    // If signup successful, upsert a person record
    // (trigger may have already created it, so use upsert to avoid conflicts)
    if (authData.user) {
      const { error: personError } = await supabase
        .from('persons')
        .upsert({
          id: authData.user.id,
          name: name || email.split('@')[0],
          training_focus: '',
          allergies: '',
          supplements: '',
        }, { onConflict: 'id' });

      if (personError) {
        console.error('Error creating person record:', personError);
        // Don't fail the signup, person can be created later
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
      },
      message: authData.session
        ? 'Signup successful'
        : 'Please check your email to confirm your account',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign up' },
      { status: 500 }
    );
  }
}
