import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAuthenticatedClient(request);

    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .order('category')
      .order('item');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pantry items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAuthenticatedClient(request);
    const body = await request.json();
    const { item, quantity, unit, category, location, restock_when_low, notes } = body;

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'item is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pantry_items')
      .insert({
        created_by: user.id,
        item,
        quantity: quantity || 1,
        unit: unit || 'each',
        category: category || 'General',
        location,
        restock_when_low: restock_when_low || false,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating pantry item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create pantry item' },
      { status: 500 }
    );
  }
}
