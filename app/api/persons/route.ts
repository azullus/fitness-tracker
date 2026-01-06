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

    // Users can only view their own person record
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch person' },
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

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Users can only create/update their own person record
    const { data, error } = await supabase
      .from('persons')
      .upsert({
        id: user.id,
        name: body.name,
        training_focus: body.training_focus || '',
        allergies: body.allergies || '',
        supplements: body.supplements || '',
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update person' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    // Users can only update their own person record
    const { data, error } = await supabase
      .from('persons')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.training_focus !== undefined && { training_focus: body.training_focus }),
        ...(body.allergies !== undefined && { allergies: body.allergies }),
        ...(body.supplements !== undefined && { supplements: body.supplements }),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update person' },
      { status: 500 }
    );
  }
}
