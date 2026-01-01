import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getRecipes as getSQLiteRecipes, createRecipe as createSQLiteRecipe, deleteRecipe as deleteSQLiteRecipe } from '@/lib/database';
import { DEMO_RECIPES } from '@/lib/demo-data';
import { authenticateRequest, authorizeHouseholdAccess } from '@/lib/api-auth';
import { validateRecipeData, formatValidationErrors } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { Recipe } from '@/lib/types';

/**
 * GET /api/recipes
 * List recipes with optional category and tags filters
 * Falls back to DEMO_RECIPES when Supabase is not configured
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

    // Authorize household access (recipes are shared across household)
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags'); // comma-separated list

    // Validate category if provided
    if (category) {
      const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const tagList = tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : undefined;
      const recipes = getSQLiteRecipes(category || undefined, tagList);
      return NextResponse.json({
        success: true,
        data: recipes,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      // Build Supabase query
      let query = getSupabase().from('recipes').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      // Order by name for consistent display
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      let recipes = data as Recipe[];

      // Filter by tags if provided (client-side filter since tags is JSONB)
      if (tags) {
        const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
        recipes = recipes.filter((recipe) => {
          if (!recipe.tags || recipe.tags.length === 0) return false;
          const recipeTags = recipe.tags.map((t) => t.toLowerCase());
          // Recipe must have at least one of the requested tags
          return tagList.some((tag) => recipeTags.includes(tag));
        });
      }

      return NextResponse.json({
        success: true,
        data: recipes,
        source: 'supabase',
      });
    }

    // No database configured, return demo data
    let filteredRecipes = [...DEMO_RECIPES];

    if (category) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.category === category);
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
      filteredRecipes = filteredRecipes.filter((recipe) => {
        if (!recipe.tags || recipe.tags.length === 0) return false;
        const recipeTags = recipe.tags.map((t) => t.toLowerCase());
        // Recipe must have at least one of the requested tags
        return tagList.some((tag) => recipeTags.includes(tag));
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredRecipes,
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
 * POST /api/recipes
 * Create a new recipe
 * Body: Full Recipe object
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

    // Validate required fields
    const { name, category, servings, ingredients, instructions } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: category' },
        { status: 400 }
      );
    }

    // Validate category value
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (!servings || servings < 1) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required field: servings (must be >= 1)' },
        { status: 400 }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required field: ingredients (must be non-empty array)' },
        { status: 400 }
      );
    }

    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required field: instructions (must be non-empty array)' },
        { status: 400 }
      );
    }

    // Validate ingredient structure
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      if (!ing.item || ing.quantity === undefined || !ing.unit) {
        return NextResponse.json(
          { success: false, error: `Invalid ingredient at index ${i}: must have item, quantity, and unit` },
          { status: 400 }
        );
      }
    }

    // Validate recipe data (servings, prep time, cook time, ingredients, nutrition)
    const validationErrors = validateRecipeData({
      category,
      prep_time_minutes: body.prep_time_minutes,
      cook_time_minutes: body.cook_time_minutes,
      servings,
      ingredients,
      nutrition: body.nutrition,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const recipe = createSQLiteRecipe({
        name,
        description: body.description,
        category,
        prep_time_minutes: body.prep_time_minutes,
        cook_time_minutes: body.cook_time_minutes,
        servings,
        baseServings: body.baseServings || servings,
        ingredients,
        instructions,
        nutrition: body.nutrition,
        macrosPerServing: body.macrosPerServing,
        difficulty: body.difficulty,
        tags: body.tags,
      });

      return NextResponse.json({
        success: true,
        data: recipe,
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

    // Prepare recipe data
    const recipeData: Partial<Recipe> = {
      name,
      description: body.description,
      category,
      prep_time_minutes: body.prep_time_minutes,
      cook_time_minutes: body.cook_time_minutes,
      servings,
      ingredients,
      instructions,
      nutrition: body.nutrition,
      tags: body.tags,
    };

    // Insert into database
    const { data, error } = await getSupabase()
      .from('recipes')
      .insert(recipeData)
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
      data: data as Recipe,
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
 * DELETE /api/recipes
 * Delete a recipe
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

    // Authorize household access
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }

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
      const success = deleteSQLiteRecipe(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Recipe not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Recipe deleted successfully',
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
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
      source: 'supabase',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
