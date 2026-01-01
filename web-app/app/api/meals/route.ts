import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getMeals as getSQLiteMeals, createMeal as createSQLiteMeal, deleteMeal as deleteSQLiteMeal, getMealById } from '@/lib/database';
import { DEMO_MEALS } from '@/lib/demo-data';
import { authenticateRequest, authorizePersonAccess } from '@/lib/api-auth';
import { validateDateRange, validateMealData, validatePersonExists, formatValidationErrors } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { Meal } from '@/lib/types';

/**
 * GET /api/meals
 * Query meals by date (required), optional meal_type filter
 * Falls back to DEMO_MEALS when Supabase is not configured
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
    const date = searchParams.get('date');
    const mealType = searchParams.get('meal_type');
    const personId = searchParams.get('person_id');

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

    // Validate meal_type if provided
    if (mealType) {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return NextResponse.json(
          { success: false, error: `Invalid meal_type. Must be one of: ${validMealTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // If person_id provided, authorize access
    if (personId) {
      const personAuth = await authorizePersonAccess(auth, personId);
      if ('error' in personAuth) {
        return personAuth.error;
      }
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const meals = getSQLiteMeals(date || undefined, mealType || undefined, personId || undefined);
      return NextResponse.json({
        success: true,
        data: meals,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      // Build Supabase query
      let query = getSupabase().from('meals').select('*');

      if (date) {
        query = query.eq('date', date);
      }

      if (mealType) {
        query = query.eq('meal_type', mealType);
      }

      // Order by created_at to maintain meal order
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data as Meal[],
        source: 'supabase',
      });
    }

    // No database configured, return demo data
    let filteredMeals = DEMO_MEALS;

    if (date) {
      filteredMeals = filteredMeals.filter((meal) => meal.date === date);
    }

    if (mealType) {
      filteredMeals = filteredMeals.filter((meal) => meal.meal_type === mealType);
    }

    return NextResponse.json({
      success: true,
      data: filteredMeals,
      source: 'demo',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meals
 * Create a new meal
 * Body: { date, meal_type, name, description?, calories?, protein_g?, carbs_g?, fat_g?, fiber_g? }
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

    // Validate required fields
    const { date, meal_type, name } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: date' },
        { status: 400 }
      );
    }

    if (!meal_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: meal_type' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Validate meal data (date, meal_type, and macros)
    const validationErrors = validateMealData({
      date,
      meal_type,
      calories: body.calories,
      protein_g: body.protein_g,
      carbs_g: body.carbs_g,
      fat_g: body.fat_g,
      fiber_g: body.fiber_g,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // If person_id provided, validate it exists and authorize access
    if (body.person_id) {
      const personValidation = await validatePersonExists(body.person_id);
      if (!personValidation.valid) {
        return NextResponse.json(
          { success: false, error: personValidation.error },
          { status: 400 }
        );
      }

      const personAuth = await authorizePersonAccess(auth, body.person_id);
      if ('error' in personAuth) {
        return personAuth.error;
      }
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const meal = createSQLiteMeal({
        date,
        meal_type,
        name,
        description: body.description,
        calories: body.calories,
        protein_g: body.protein_g,
        carbs_g: body.carbs_g,
        fat_g: body.fat_g,
        fiber_g: body.fiber_g,
      });

      return NextResponse.json({
        success: true,
        data: meal,
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

    // Prepare meal data
    const mealData: Partial<Meal> = {
      date,
      meal_type,
      name,
      description: body.description,
      calories: body.calories,
      protein_g: body.protein_g,
      carbs_g: body.carbs_g,
      fat_g: body.fat_g,
      fiber_g: body.fiber_g,
    };

    // Insert into database
    const { data, error } = await getSupabase()
      .from('meals')
      .insert(mealData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Meal,
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
 * DELETE /api/meals
 * Delete a meal
 * Verifies the meal belongs to a person the user has access to (if person_id is set)
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
      // Verify ownership: fetch meal first
      const meal = getMealById(id);
      if (!meal) {
        return NextResponse.json(
          { success: false, error: 'Meal not found' },
          { status: 404 }
        );
      }

      // If meal has person_id, verify access
      if (meal.person_id) {
        const personAuth = await authorizePersonAccess(auth, meal.person_id);
        if ('error' in personAuth) {
          return personAuth.error;
        }
      }

      const success = deleteSQLiteMeal(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete meal' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Meal deleted successfully',
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

    // Verify ownership: fetch meal first from Supabase
    const { data: meal, error: fetchError } = await getSupabase()
      .from('meals')
      .select('person_id')
      .eq('id', id)
      .single();

    if (fetchError || !meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    // If meal has person_id, verify access
    if (meal.person_id) {
      const personAuth = await authorizePersonAccess(auth, meal.person_id);
      if ('error' in personAuth) {
        return personAuth.error;
      }
    }

    const { error } = await getSupabase()
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete meal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal deleted successfully',
      source: 'supabase',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
