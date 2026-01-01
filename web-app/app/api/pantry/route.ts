import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSQLiteEnabled, getPantryItems as getSQLitePantryItems, getPantryItemById, createPantryItem as createSQLitePantryItem, updatePantryItem as updateSQLitePantryItem, deletePantryItem as deleteSQLitePantryItem, updatePantryQuantityDelta, setPantryQuantity } from '@/lib/database';
import { DEMO_PANTRY_ITEMS, isLowStock } from '@/lib/demo-data';
import { authenticateRequest, authorizeHouseholdAccess } from '@/lib/api-auth';
import { validatePantryItemData, formatValidationErrors, NumericValidators } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import type { PantryItem } from '@/lib/types';

/**
 * GET /api/pantry
 * List pantry items with optional category and low_stock filters
 * Falls back to DEMO_PANTRY_ITEMS when Supabase is not configured
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

    // Authorize household access (pantry is shared across household)
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('low_stock') === 'true';

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const items = getSQLitePantryItems(category || undefined, lowStockOnly);
      return NextResponse.json({
        success: true,
        data: items,
        source: 'sqlite',
      });
    }

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      // Build Supabase query
      let query = getSupabase().from('pantry_items').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      // Order by category and name for consistent display
      query = query.order('category', { ascending: true }).order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      let items = data as PantryItem[];

      // Filter for low stock items if requested
      if (lowStockOnly) {
        items = items.filter((item) => {
          if (item.low_stock_threshold === undefined || item.low_stock_threshold === null) {
            return false;
          }
          return item.quantity <= item.low_stock_threshold;
        });
      }

      return NextResponse.json({
        success: true,
        data: items,
        source: 'supabase',
      });
    }

    // No database configured, return demo data
    let filteredItems = [...DEMO_PANTRY_ITEMS];

    if (category) {
      filteredItems = filteredItems.filter((item) => item.category === category);
    }

    if (lowStockOnly) {
      filteredItems = filteredItems.filter(isLowStock);
    }

    return NextResponse.json({
      success: true,
      data: filteredItems,
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
 * POST /api/pantry
 * Add a new pantry item
 * Body: { name, category, quantity, unit, location?, expires_at?, low_stock_threshold?, notes? }
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
    const { name, category, quantity, unit } = body;

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

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: quantity' },
        { status: 400 }
      );
    }

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: unit' },
        { status: 400 }
      );
    }

    // Validate pantry item data (quantity, expires_at, low_stock_threshold)
    const validationErrors = validatePantryItemData({
      quantity,
      expires_at: body.expires_at,
      low_stock_threshold: body.low_stock_threshold,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: formatValidationErrors(validationErrors) },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const item = createSQLitePantryItem({
        name,
        category,
        quantity,
        unit,
        location: body.location,
        expires_at: body.expires_at,
        low_stock_threshold: body.low_stock_threshold,
        notes: body.notes,
      });

      return NextResponse.json({
        success: true,
        data: item,
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

    // Prepare pantry item data
    const itemData: Partial<PantryItem> = {
      name,
      category,
      quantity,
      unit,
      location: body.location,
      expires_at: body.expires_at,
      low_stock_threshold: body.low_stock_threshold,
      notes: body.notes,
    };

    // Insert into database
    const { data, error } = await getSupabase()
      .from('pantry_items')
      .insert(itemData)
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
      data: data as PantryItem,
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
 * PATCH /api/pantry
 * Update quantity of a pantry item
 * Body: { id, quantity } - set absolute quantity
 * OR:   { id, delta } - increment/decrement quantity
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

    // Authorize household access
    const householdAuth = await authorizeHouseholdAccess(auth, auth.householdId);
    if ('error' in householdAuth) {
      return householdAuth.error;
    }

    const body = await request.json();
    const { id, quantity, delta } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Must have either quantity or delta
    if (quantity === undefined && delta === undefined) {
      return NextResponse.json(
        { success: false, error: 'Must provide either quantity (absolute) or delta (relative change)' },
        { status: 400 }
      );
    }

    // Validate quantity if provided (must be non-negative)
    if (quantity !== undefined) {
      const qtyResult = NumericValidators.quantity(quantity);
      if (!qtyResult.valid) {
        return NextResponse.json(
          { success: false, error: qtyResult.error },
          { status: 400 }
        );
      }
    }

    // Validate delta if provided (must be a number within reasonable bounds)
    if (delta !== undefined) {
      if (typeof delta !== 'number' || isNaN(delta)) {
        return NextResponse.json(
          { success: false, error: 'delta must be a valid number' },
          { status: 400 }
        );
      }
      if (delta < -100000 || delta > 100000) {
        return NextResponse.json(
          { success: false, error: 'delta must be between -100000 and 100000' },
          { status: 400 }
        );
      }
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      let item: PantryItem | null;

      if (quantity !== undefined) {
        // Absolute quantity update - use atomic setPantryQuantity
        item = setPantryQuantity(id, quantity);
      } else {
        // Delta (relative) update - use atomic updatePantryQuantityDelta
        // This prevents read-modify-write race conditions by using a single
        // SQL statement: UPDATE ... SET quantity = MAX(0, quantity + delta)
        item = updatePantryQuantityDelta(id, delta);
      }

      if (!item) {
        return NextResponse.json(
          { success: false, error: 'Pantry item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: item,
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

    if (quantity !== undefined) {
      // Absolute quantity update - this is safe, just set the value
      const safeQuantity = Math.max(0, quantity);

      const { data, error } = await getSupabase()
        .from('pantry_items')
        .update({
          quantity: safeQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Pantry item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data as PantryItem,
        source: 'supabase',
      });
    }

    // Delta (relative) update - use RPC for atomic operation
    // This calls the update_pantry_quantity_delta PostgreSQL function
    // which performs the read-modify-write in a single atomic transaction.
    // See supabase/migrations/004_pantry_atomic_update.sql for the function definition.
    const { data: rpcResult, error: rpcError } = await getSupabase()
      .rpc('update_pantry_quantity_delta', {
        item_id: id,
        quantity_delta: delta,
      });

    if (rpcError) {
      // If RPC function doesn't exist, fall back to non-atomic update with warning
      if (rpcError.code === 'PGRST202' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {

        // Fallback: non-atomic update (original code with race condition)
        const { data: currentItem, error: fetchError } = await getSupabase()
          .from('pantry_items')
          .select('quantity')
          .eq('id', id)
          .single();

        if (fetchError) {
          return NextResponse.json(
            { success: false, error: fetchError.message },
            { status: 500 }
          );
        }

        if (!currentItem) {
          return NextResponse.json(
            { success: false, error: 'Pantry item not found' },
            { status: 404 }
          );
        }

        const newQuantity = Math.max(0, currentItem.quantity + delta);

        const { data, error } = await getSupabase()
          .from('pantry_items')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
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
          data: data as PantryItem,
          source: 'supabase',
          warning: 'Used non-atomic fallback. Install RPC function for race-condition safety.',
        });
      }

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 500 }
      );
    }

    if (!rpcResult) {
      return NextResponse.json(
        { success: false, error: 'Pantry item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rpcResult as PantryItem,
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
 * DELETE /api/pantry
 * Remove a pantry item by id (query param)
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
        { success: false, error: 'Missing required query parameter: id' },
        { status: 400 }
      );
    }

    // Check if SQLite is enabled
    if (isSQLiteEnabled()) {
      const success = deleteSQLitePantryItem(id);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Pantry item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Pantry item deleted successfully',
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

    // Delete the item
    const { error } = await getSupabase()
      .from('pantry_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pantry item deleted successfully',
      source: 'supabase',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
