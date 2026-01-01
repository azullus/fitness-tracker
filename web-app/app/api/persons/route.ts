import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getAllPersons, createPerson, updatePerson, deletePerson } from '@/lib/database';
import { DEMO_PERSONS } from '@/lib/demo-data';
import { authenticateRequest, authorizeHouseholdAccess, authorizePersonAccess } from '@/lib/api-auth';
import { validatePersonData, formatValidationErrors } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { Person } from '@/lib/types';

/**
 * GET /api/persons
 * Returns list of persons
 * Falls back to demo data if no database is configured
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting - 100 requests per minute for reads
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.READ);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { auth } = authResult;

    // Authorize household access (persons belong to a household)
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }
    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const persons = getAllPersons();
      return NextResponse.json({
        success: true,
        data: persons,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()
        .from('persons')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        // Fall back to demo data on error
        return NextResponse.json({
          success: true,
          data: DEMO_PERSONS,
          source: 'demo',
        });
      }

      return NextResponse.json({
        success: true,
        data: data as Person[],
        source: 'supabase',
      });
    }

    // No database configured, use demo data
    return NextResponse.json({
      success: true,
      data: DEMO_PERSONS,
      source: 'demo',
    });
  } catch {
    // Fall back to demo data on any error
    return NextResponse.json({
      success: true,
      data: DEMO_PERSONS,
      source: 'demo',
    });
  }
}

/**
 * POST /api/persons
 * Create a new person
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 30 requests per minute for writes
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.WRITE);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate CSRF token
    const csrfResult = withCSRFProtection(request);
    if (csrfResult.response) {
      return csrfResult.response;
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { auth } = authResult;

    // Authorize household access
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }

    const body = await request.json();
    const { name, gender, age, height, weight, bmi, dailyCalorieTarget, training_focus, workoutDaysPerWeek, householdId } = body;

    // Validate required fields
    if (!name || !gender || age === undefined || height === undefined || weight === undefined || !training_focus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, gender, age, height, weight, training_focus' },
        { status: 400 }
      );
    }

    // Validate person data (age range, height range, weight range, etc.)
    const validationErrors = validatePersonData({
      name,
      gender,
      age,
      height,
      weight,
      dailyCalorieTarget,
      training_focus,
      workoutDaysPerWeek,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const person = createPerson({
        name,
        gender,
        age,
        height,
        weight,
        bmi: bmi || (weight / Math.pow(height / 100, 2)),
        dailyCalorieTarget: dailyCalorieTarget || 2000,
        training_focus,
        workoutDaysPerWeek: workoutDaysPerWeek || 4,
        householdId: householdId || '',
      });

      return NextResponse.json({
        success: true,
        data: person,
        source: 'sqlite',
      }, { status: 201 });
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Running in demo mode.' },
        { status: 503 }
      );
    }

    const { data, error } = await getSupabase()
      .from('persons')
      .insert([{
        name,
        gender,
        age,
        height,
        weight,
        bmi: bmi || (weight / Math.pow(height / 100, 2)),
        daily_calorie_target: dailyCalorieTarget || 2000,
        training_focus,
        workout_days_per_week: workoutDaysPerWeek || 4,
        household_id: householdId || null,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create person' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Person,
      source: 'supabase',
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/persons
 * Update a person
 */
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting - 30 requests per minute for writes
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.WRITE);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate CSRF token
    const csrfResult = withCSRFProtection(request);
    if (csrfResult.response) {
      return csrfResult.response;
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    // Authorize access to this specific person
    const personAuth = await authorizePersonAccess(auth, id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    const body = await request.json();

    // Validate person data if any validatable fields are being updated
    const validationErrors = validatePersonData({
      gender: body.gender,
      age: body.age,
      height: body.height,
      weight: body.weight,
      dailyCalorieTarget: body.dailyCalorieTarget,
      training_focus: body.training_focus,
      workoutDaysPerWeek: body.workoutDaysPerWeek,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const person = updatePerson(id, body);
      if (!person) {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: person,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Running in demo mode.' },
        { status: 503 }
      );
    }

    const { data, error } = await getSupabase()
      .from('persons')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update person' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Person,
      source: 'supabase',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/persons
 * Delete a person
 */
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting - 20 requests per minute for deletes
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.DELETE);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate CSRF token
    const csrfResult = withCSRFProtection(request);
    if (csrfResult.response) {
      return csrfResult.response;
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    // Authorize access to this specific person
    const personAuth = await authorizePersonAccess(auth, id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const success = deletePerson(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Person deleted successfully',
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Running in demo mode.' },
        { status: 503 }
      );
    }

    const { error } = await getSupabase()
      .from('persons')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete person' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Person deleted successfully',
      source: 'supabase',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
