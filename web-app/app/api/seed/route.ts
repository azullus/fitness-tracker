import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/api-auth';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { withCSRFProtection } from '@/lib/csrf';
import {
  DEMO_PERSONS,
  DEMO_WEIGHT_ENTRIES,
  DEMO_WORKOUTS,
  DEMO_MEALS,
  DEMO_PANTRY_ITEMS,
  DEMO_RECIPES,
} from '@/lib/demo-data';

/**
 * POST /api/seed
 * Seed the database with demo data for initial setup
 * Requires authentication - only authenticated users can seed data
 * Only works if Supabase is configured
 * Rate limited to 5 requests per hour (SEED preset)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfResult = withCSRFProtection(request);
    if (csrfResult.response) {
      return csrfResult.response;
    }

    // Apply strict rate limiting - 5 requests per hour
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.SEED);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate request - seeding requires authentication
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    // Note: In a production app, you'd want to also verify admin role here
    // For now, any authenticated user can seed data

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Cannot seed demo data.' },
        { status: 503 }
      );
    }

    const results = {
      persons: { success: false, count: 0, error: null as string | null },
      weight_entries: { success: false, count: 0, error: null as string | null },
      workouts: { success: false, count: 0, error: null as string | null },
      meals: { success: false, count: 0, error: null as string | null },
      pantry_items: { success: false, count: 0, error: null as string | null },
      recipes: { success: false, count: 0, error: null as string | null },
    };

    // Seed Persons
    try {
      const { error } = await getSupabase()
        .from('persons')
        .upsert(DEMO_PERSONS, { onConflict: 'id' });

      if (error) {
        results.persons.error = error.message;
      } else {
        results.persons.success = true;
        results.persons.count = DEMO_PERSONS.length;
      }
    } catch (err) {
      results.persons.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Seed Weight Entries
    try {
      const { error } = await getSupabase()
        .from('weight_entries')
        .upsert(DEMO_WEIGHT_ENTRIES, { onConflict: 'id' });

      if (error) {
        results.weight_entries.error = error.message;
      } else {
        results.weight_entries.success = true;
        results.weight_entries.count = DEMO_WEIGHT_ENTRIES.length;
      }
    } catch (err) {
      results.weight_entries.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Seed Workouts
    try {
      const { error } = await getSupabase()
        .from('workouts')
        .upsert(DEMO_WORKOUTS, { onConflict: 'id' });

      if (error) {
        results.workouts.error = error.message;
      } else {
        results.workouts.success = true;
        results.workouts.count = DEMO_WORKOUTS.length;
      }
    } catch (err) {
      results.workouts.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Seed Meals
    try {
      const { error } = await getSupabase()
        .from('meals')
        .upsert(DEMO_MEALS, { onConflict: 'id' });

      if (error) {
        results.meals.error = error.message;
      } else {
        results.meals.success = true;
        results.meals.count = DEMO_MEALS.length;
      }
    } catch (err) {
      results.meals.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Seed Pantry Items
    try {
      const { error } = await getSupabase()
        .from('pantry_items')
        .upsert(DEMO_PANTRY_ITEMS, { onConflict: 'id' });

      if (error) {
        results.pantry_items.error = error.message;
      } else {
        results.pantry_items.success = true;
        results.pantry_items.count = DEMO_PANTRY_ITEMS.length;
      }
    } catch (err) {
      results.pantry_items.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Seed Recipes
    try {
      const { error } = await getSupabase()
        .from('recipes')
        .upsert(DEMO_RECIPES, { onConflict: 'id' });

      if (error) {
        results.recipes.error = error.message;
      } else {
        results.recipes.success = true;
        results.recipes.count = DEMO_RECIPES.length;
      }
    } catch (err) {
      results.recipes.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check if all succeeded
    const allSucceeded = Object.values(results).every((r) => r.success);
    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.count, 0);

    if (allSucceeded) {
      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully',
        data: {
          total_records: totalRecords,
          details: results,
        },
      });
    } else {
      // Partial success
      const failedTables = Object.entries(results)
        .filter(([, r]) => !r.success)
        .map(([table]) => table);

      return NextResponse.json({
        success: false,
        message: `Partial seed completed. Failed tables: ${failedTables.join(', ')}`,
        data: {
          total_records: totalRecords,
          details: results,
        },
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
