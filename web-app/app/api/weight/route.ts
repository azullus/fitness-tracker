import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getWeightEntries, createWeightEntry, deleteWeightEntry, upsertWeightEntry, getWeightEntryById } from '@/lib/database';
import { DEMO_WEIGHT_ENTRIES, getWeightEntriesByPerson } from '@/lib/demo-data';
import { authenticateRequest, authorizePersonAccess } from '@/lib/api-auth';
import { validateDateRange, validateWeightEntryData, validatePersonExists, formatValidationErrors, NumericValidators } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { WeightEntry } from '@/lib/types';

/**
 * GET /api/weight
 * Query weight entries by person_id (required query param)
 * Optional date range filtering with start_date and end_date
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!personId) {
      return NextResponse.json(
        { success: false, error: 'person_id query parameter is required' },
        { status: 400 }
      );
    }

    // Validate date formats if provided
    if (startDate) {
      const startDateValidation = validateDateRange(startDate);
      if (!startDateValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid start_date: ${startDateValidation.error}` },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      const endDateValidation = validateDateRange(endDate);
      if (!endDateValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid end_date: ${endDateValidation.error}` },
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
      const entries = getWeightEntries(personId, startDate || undefined, endDate || undefined);
      return NextResponse.json({
        success: true,
        data: entries,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      let query = getSupabase()
        .from('weight_entries')
        .select('*')
        .eq('person_id', personId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        // Fall back to demo data on error
        return getFilteredDemoData(personId, startDate, endDate);
      }

      return NextResponse.json({
        success: true,
        data: data as WeightEntry[],
        source: 'supabase',
      });
    }

    // No database configured, use demo data
    return getFilteredDemoData(personId, startDate, endDate);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weight
 * Create a new weight entry
 * Required body: { person_id, date, weight_lbs }
 * Optional body: { notes }
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
    const { person_id, date, weight_lbs, notes } = body;

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

    if (weight_lbs === undefined || weight_lbs === null) {
      return NextResponse.json(
        { success: false, error: 'weight_lbs is required' },
        { status: 400 }
      );
    }

    // Validate weight entry data (date format, weight range)
    const validationErrors = validateWeightEntryData({ date, weight_lbs });
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
      const entry = createWeightEntry({
        person_id,
        date,
        weight_lbs,
        notes: notes || undefined,
      });

      return NextResponse.json({
        success: true,
        data: entry,
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

    const newEntry: Partial<WeightEntry> = {
      person_id,
      date,
      weight_lbs,
      notes: notes || null,
    };

    const { data, error } = await getSupabase()
      .from('weight_entries')
      .insert([newEntry])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create weight entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as WeightEntry,
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
 * PUT /api/weight
 * Upsert a weight entry (create or update based on person_id + date)
 * This is atomic and prevents race conditions when multiple requests
 * try to log weight for the same person on the same date.
 *
 * Required body: { person_id, date, weight_lbs }
 * Optional body: { notes }
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

    const body = await request.json();
    const { person_id, date, weight_lbs, notes } = body;

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

    if (weight_lbs === undefined || weight_lbs === null) {
      return NextResponse.json(
        { success: false, error: 'weight_lbs is required' },
        { status: 400 }
      );
    }

    // Validate weight entry data (date format, weight range)
    const validationErrors = validateWeightEntryData({ date, weight_lbs });
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
      // Use atomic upsert - INSERT ... ON CONFLICT DO UPDATE
      const entry = upsertWeightEntry({
        person_id,
        date,
        weight_lbs,
        notes: notes || undefined,
      });

      return NextResponse.json({
        success: true,
        data: entry,
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

    // Try to use atomic RPC function for upsert
    const { data: rpcResult, error: rpcError } = await getSupabase()
      .rpc('upsert_weight_entry', {
        p_person_id: person_id,
        p_date: date,
        p_weight_lbs: weight_lbs,
        p_notes: notes || null,
      });

    if (rpcError) {
      // If RPC function doesn't exist, fall back to Supabase upsert
      if (rpcError.code === 'PGRST202' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {

        // Fallback: use Supabase's built-in upsert
        // Note: This requires a unique constraint on (person_id, date)
        const { data, error } = await getSupabase()
          .from('weight_entries')
          .upsert(
            {
              person_id,
              date,
              weight_lbs,
              notes: notes || null,
            },
            {
              onConflict: 'person_id,date',
            }
          )
          .select()
          .single();

        if (error) {
          // If the unique constraint doesn't exist, the upsert might fail
          // In that case, try a simple insert (which may create duplicates)
          if (error.message?.includes('constraint') || error.message?.includes('unique')) {

            const { data: insertData, error: insertError } = await getSupabase()
              .from('weight_entries')
              .insert({
                person_id,
                date,
                weight_lbs,
                notes: notes || null,
              })
              .select()
              .single();

            if (insertError) {
              return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 }
              );
            }

            return NextResponse.json({
              success: true,
              data: insertData as WeightEntry,
              source: 'supabase',
              warning: 'Created new entry. Run migration to enable upsert.',
            });
          }

          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data as WeightEntry,
          source: 'supabase',
        });
      }

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rpcResult as WeightEntry,
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
 * DELETE /api/weight
 * Delete a weight entry
 * Verifies the entry belongs to a person the user has access to
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
      // Verify ownership: fetch entry first
      const entry = getWeightEntryById(id);
      if (!entry) {
        return NextResponse.json(
          { success: false, error: 'Weight entry not found' },
          { status: 404 }
        );
      }

      // Authorize access to this person's data
      const personAuth = await authorizePersonAccess(auth, entry.person_id);
      if ('error' in personAuth) {
        return personAuth.error;
      }

      const success = deleteWeightEntry(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete weight entry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Weight entry deleted successfully',
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

    // Verify ownership: fetch entry first from Supabase
    const { data: entry, error: fetchError } = await getSupabase()
      .from('weight_entries')
      .select('person_id')
      .eq('id', id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json(
        { success: false, error: 'Weight entry not found' },
        { status: 404 }
      );
    }

    // Authorize access to this person's data
    const personAuth = await authorizePersonAccess(auth, entry.person_id);
    if ('error' in personAuth) {
      return personAuth.error;
    }

    const { error } = await getSupabase()
      .from('weight_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete weight entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Weight entry deleted successfully',
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
 * Helper function to filter demo weight entries
 */
function getFilteredDemoData(
  personId: string,
  startDate: string | null,
  endDate: string | null
) {
  let entries = getWeightEntriesByPerson(personId);

  if (startDate) {
    entries = entries.filter((e) => e.date >= startDate);
  }
  if (endDate) {
    entries = entries.filter((e) => e.date <= endDate);
  }

  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    success: true,
    data: entries,
    source: 'demo',
  });
}
