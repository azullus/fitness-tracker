import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getWorkouts as getSQLiteWorkouts, createWorkout as createSQLiteWorkout, updateWorkout as updateSQLiteWorkout, deleteWorkout as deleteSQLiteWorkout, getWorkoutById } from '@/lib/database';
import { getWorkoutsByPerson } from '@/lib/demo-data';
import { authenticateRequest, authorizePersonAccess } from '@/lib/api-auth';
import { validateDateRange, validateWorkoutData, validatePersonExists, formatValidationErrors } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { Workout, Exercise } from '@/lib/types';

/**
 * GET /api/workouts
 * Query workouts by person_id (required query param)
 * Optional date filter
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

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('person_id');
    const date = searchParams.get('date');

    if (!personId) {
      return NextResponse.json(
        { success: false, error: 'person_id query parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format if provided
    if (date) {
      const dateValidation = validateDateRange(date);
      if (!dateValidation.valid) {
        return NextResponse.json(
          { success: false, error: dateValidation.error },
          { status: 400 }
        );
      }
    }

    // Authorize access to this person's data
    const personAuth = await authorizePersonAccess(auth, personId);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const workouts = getSQLiteWorkouts(personId, date || undefined);
      return NextResponse.json({
        success: true,
        data: workouts,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      let query = getSupabase()
        .from('workouts')
        .select('*')
        .eq('person_id', personId)
        .order('date', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) {
        // Fall back to demo data on error
        return getFilteredDemoData(personId, date);
      }

      return NextResponse.json({
        success: true,
        data: data as Workout[],
        source: 'supabase',
      });
    }

    // No database configured, use demo data
    return getFilteredDemoData(personId, date);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts
 * Create a new workout
 * Required body: { person_id, date, type, exercises }
 * Optional body: { duration_minutes, intensity, notes }
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

    const body = await request.json();
    const { person_id, date, type, exercises, duration_minutes, intensity, notes } = body;

    // Validate required fields
    if (!person_id) {
      return NextResponse.json(
        { success: false, error: 'person_id is required' },
        { status: 400 }
      );
    }
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'date is required' },
        { status: 400 }
      );
    }
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'type is required' },
        { status: 400 }
      );
    }
    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json(
        { success: false, error: 'exercises must be an array' },
        { status: 400 }
      );
    }

    // Validate workout data (date, duration, intensity, exercises)
    const validationErrors = validateWorkoutData({
      date,
      exercises,
      duration_minutes,
      intensity,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Validate person exists (foreign key validation)
    const personValidation = await validatePersonExists(person_id);
    if (!personValidation.valid) {
      return NextResponse.json(
        { success: false, error: personValidation.error },
        { status: 400 }
      );
    }

    // Authorize access to this person's data
    const personAuth = await authorizePersonAccess(auth, person_id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const workout = createSQLiteWorkout({
        person_id,
        date,
        type,
        exercises: exercises as Exercise[],
        duration_minutes: duration_minutes || undefined,
        intensity: intensity || undefined,
        notes: notes || undefined,
        completed: false,
      });

      return NextResponse.json({
        success: true,
        data: workout,
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

    const newWorkout: Partial<Workout> = {
      person_id,
      date,
      type,
      exercises: exercises as Exercise[],
      duration_minutes: duration_minutes || null,
      intensity: intensity || null,
      notes: notes || null,
      completed: false,
    };

    const { data, error } = await getSupabase()
      .from('workouts')
      .insert([newWorkout])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Workout,
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
 * PATCH /api/workouts
 * Update a workout (e.g., marking as complete)
 * Query param: id (workout ID)
 * Body: fields to update (e.g., { completed: true })
 */
export async function PATCH(request: NextRequest) {
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
    const workoutId = searchParams.get('id');

    if (!workoutId) {
      return NextResponse.json(
        { success: false, error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate workout data if relevant fields are being updated
    const validationErrors = validateWorkoutData({
      exercises: body.exercises,
      duration_minutes: body.duration_minutes,
      intensity: body.intensity,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedFields = ['completed', 'exercises', 'duration_minutes', 'intensity', 'notes'];
    const updateData: Partial<Workout> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      // Verify ownership: fetch workout first
      const existingWorkout = getWorkoutById(workoutId);
      if (!existingWorkout) {
        return NextResponse.json(
          { success: false, error: 'Workout not found' },
          { status: 404 }
        );
      }

      // Authorize access to this person's data
      const personAuth = await authorizePersonAccess(auth, existingWorkout.person_id);
      if ('error' in personAuth) {
        return personAuth.error;
      }

      const workout = updateSQLiteWorkout(workoutId, updateData);
      if (!workout) {
        return NextResponse.json(
          { success: false, error: 'Failed to update workout' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: workout,
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

    // Verify ownership: fetch workout first from Supabase
    const { data: existingWorkout, error: fetchError } = await getSupabase()
      .from('workouts')
      .select('person_id')
      .eq('id', workoutId)
      .single();

    if (fetchError || !existingWorkout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Authorize access to this person's data
    const personAuth = await authorizePersonAccess(auth, existingWorkout.person_id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    const { data, error } = await getSupabase()
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update workout' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Workout,
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
 * DELETE /api/workouts
 * Delete a workout
 * Verifies the workout belongs to a person the user has access to
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

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      // Verify ownership: fetch workout first
      const workout = getWorkoutById(id);
      if (!workout) {
        return NextResponse.json(
          { success: false, error: 'Workout not found' },
          { status: 404 }
        );
      }

      // Authorize access to this person's data
      const personAuth = await authorizePersonAccess(auth, workout.person_id);
      if ('error' in personAuth) {
        return personAuth.error;
      }

      const success = deleteSQLiteWorkout(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete workout' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Workout deleted successfully',
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

    // Verify ownership: fetch workout first from Supabase
    const { data: workout, error: fetchError } = await getSupabase()
      .from('workouts')
      .select('person_id')
      .eq('id', id)
      .single();

    if (fetchError || !workout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Authorize access to this person's data
    const personAuth = await authorizePersonAccess(auth, workout.person_id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    const { error } = await getSupabase()
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete workout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully',
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
 * Helper function to filter demo workouts
 */
function getFilteredDemoData(personId: string, date: string | null) {
  let workouts = getWorkoutsByPerson(personId);

  if (date) {
    workouts = workouts.filter((w) => w.date === date);
  }

  // Sort by date descending
  workouts.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    success: true,
    data: workouts,
    source: 'demo',
  });
}
