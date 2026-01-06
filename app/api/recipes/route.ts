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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');

    if (id) {
      // Get single recipe by ID
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Recipe not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json(data);
    }

    // Get all recipes, optionally filtered by category
    let query = supabase
      .from('recipes')
      .select('*')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
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

    const {
      name,
      category,
      prep_time_min,
      cook_time_min,
      servings,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      ingredients,
      instructions,
      notes,
      tags,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'name and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        created_by: user.id,
        name,
        category,
        prep_time_min: prep_time_min || 0,
        cook_time_min: cook_time_min || 0,
        servings: servings || 2,
        calories: calories || 0,
        protein_g: protein_g || 0,
        carbs_g: carbs_g || 0,
        fat_g: fat_g || 0,
        fiber_g: fiber_g || 0,
        ingredients: ingredients || [],
        instructions: instructions || [],
        notes,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
