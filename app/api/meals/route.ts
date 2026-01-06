import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { format, startOfWeek, addDays } from 'date-fns';

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
    const dateParam = searchParams.get('date');

    // Get the week's meals
    const referenceDate = dateParam ? new Date(dateParam) : new Date();
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 });
    const weekEnd = addDays(weekStart, 6);

    const startDate = format(weekStart, 'yyyy-MM-dd');
    const endDate = format(weekEnd, 'yyyy-MM-dd');

    const { data: mealPlans, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('meal_type');

    if (error) throw error;

    // Group meals by date
    const mealsByDate: Record<string, any> = {};

    for (let i = 0; i < 7; i++) {
      const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
      mealsByDate[date] = {
        date,
        breakfast: null,
        lunch: null,
        dinner: null,
        snacks: [],
      };
    }

    for (const plan of mealPlans || []) {
      const date = plan.date;
      if (!mealsByDate[date]) continue;

      if (plan.meal_type === 'Breakfast') {
        mealsByDate[date].breakfast = plan;
      } else if (plan.meal_type === 'Lunch') {
        mealsByDate[date].lunch = plan;
      } else if (plan.meal_type === 'Dinner') {
        mealsByDate[date].dinner = plan;
      } else if (plan.meal_type === 'Snack') {
        mealsByDate[date].snacks.push(plan);
      }
    }

    return NextResponse.json(Object.values(mealsByDate));
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meals' },
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
    const { date, meal_type, recipe_id, notes } = body;

    if (!date || !meal_type || !recipe_id) {
      return NextResponse.json(
        { success: false, error: 'date, meal_type, and recipe_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .upsert({
        created_by: user.id,
        date,
        meal_type,
        recipe_id,
        notes,
      }, { onConflict: 'date,meal_type' })
      .select(`
        *,
        recipe:recipes(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
