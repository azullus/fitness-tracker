'use client';

import Link from 'next/link';
import { Clock, Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealPlan } from '@/lib/types';

type Props = {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  meal?: MealPlan;
};

const mealTypeColors: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-green-100 text-green-700',
  Dinner: 'bg-blue-100 text-blue-700',
  Snack: 'bg-pink-100 text-pink-700',
};

const mealTypeIcons: Record<string, string> = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎',
};

export default function MealCard({ mealType, meal }: Props) {
  const recipe = meal?.recipe;

  if (!meal || !recipe) {
    return (
      <div className="card opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mealTypeIcons[mealType]}</span>
          <div>
            <span className={cn('badge', mealTypeColors[mealType])}>{mealType}</span>
            <p className="text-sm text-gray-500 mt-1">No meal planned</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="card block cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{mealTypeIcons[mealType]}</span>
          <div className="flex-1 min-w-0">
            <span className={cn('badge', mealTypeColors[mealType])}>{mealType}</span>
            <p className="font-semibold text-gray-900 mt-1 truncate">{recipe.name}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.prep_time_min + recipe.cook_time_min}m
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {recipe.calories} cal
              </span>
              <span>{recipe.protein_g}g protein</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>

      {/* Macro bar */}
      <div className="mt-3 flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-blue-500 rounded-full"
          style={{ width: `${(recipe.protein_g * 4 / recipe.calories) * 100}%` }}
          title={`Protein: ${recipe.protein_g}g`}
        />
        <div
          className="bg-amber-500 rounded-full"
          style={{ width: `${(recipe.carbs_g * 4 / recipe.calories) * 100}%` }}
          title={`Carbs: ${recipe.carbs_g}g`}
        />
        <div
          className="bg-red-400 rounded-full"
          style={{ width: `${(recipe.fat_g * 9 / recipe.calories) * 100}%` }}
          title={`Fat: ${recipe.fat_g}g`}
        />
      </div>
    </Link>
  );
}
