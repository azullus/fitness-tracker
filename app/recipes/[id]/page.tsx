'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Flame, Check } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/lib/types';

const categoryColors: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700 border-amber-200',
  Lunch: 'bg-green-100 text-green-700 border-green-200',
  Dinner: 'bg-blue-100 text-blue-700 border-blue-200',
  Snack: 'bg-pink-100 text-pink-700 border-pink-200',
};

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (params.id) {
      fetch(`/api/recipes?id=${params.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Recipe not found');
          return res.json();
        })
        .then(data => {
          setRecipe(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading recipe:', err);
          setLoading(false);
        });
    }
  }, [params.id]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="px-4 py-6 max-w-lg mx-auto">
          <div className="text-center py-12 text-gray-500">Loading recipe...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!recipe) {
    return (
      <ProtectedRoute>
        <div className="px-4 py-6 max-w-lg mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Recipe not found</p>
            <button onClick={() => router.back()} className="btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className={cn('badge border', categoryColors[recipe.category])}>
          {recipe.category}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{recipe.name}</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card text-center py-3">
          <Clock className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-bold text-gray-900">{recipe.prep_time_min + recipe.cook_time_min}</p>
          <p className="text-xs text-gray-500">min</p>
        </div>
        <div className="card text-center py-3">
          <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-bold text-gray-900">{recipe.servings}</p>
          <p className="text-xs text-gray-500">servings</p>
        </div>
        <div className="card text-center py-3">
          <Flame className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-bold text-gray-900">{recipe.calories}</p>
          <p className="text-xs text-gray-500">cal</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-blue-600">{recipe.protein_g}g</p>
          <p className="text-xs text-gray-500">protein</p>
        </div>
      </div>

      {/* Macros breakdown */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Nutrition per serving</h2>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100 mb-3">
          <div
            className="bg-blue-500 rounded-full"
            style={{ width: `${(recipe.protein_g * 4 / recipe.calories) * 100}%` }}
          />
          <div
            className="bg-amber-500 rounded-full"
            style={{ width: `${(recipe.carbs_g * 4 / recipe.calories) * 100}%` }}
          />
          <div
            className="bg-red-400 rounded-full"
            style={{ width: `${(recipe.fat_g * 9 / recipe.calories) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <p className="font-bold text-blue-600">{recipe.protein_g}g</p>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <div>
            <p className="font-bold text-amber-600">{recipe.carbs_g}g</p>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <div>
            <p className="font-bold text-red-500">{recipe.fat_g}g</p>
            <p className="text-xs text-gray-500">Fat</p>
          </div>
          <div>
            <p className="font-bold text-green-600">{recipe.fiber_g}g</p>
            <p className="text-xs text-gray-500">Fiber</p>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">
          Ingredients
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({checkedIngredients.size}/{recipe.ingredients.length})
          </span>
        </h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, idx) => (
            <li
              key={idx}
              onClick={() => toggleIngredient(idx)}
              className={cn(
                'flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer transition-colors',
                checkedIngredients.has(idx) ? 'bg-green-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                checkedIngredients.has(idx)
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300'
              )}>
                {checkedIngredients.has(idx) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn(
                'flex-1',
                checkedIngredients.has(idx) && 'line-through text-gray-400'
              )}>
                <span className="font-medium">{ing.amount} {ing.unit}</span>{' '}
                {ing.item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">
          Instructions
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({checkedSteps.size}/{recipe.instructions.length})
          </span>
        </h2>
        <ol className="space-y-4">
          {recipe.instructions.map((step, idx) => (
            <li
              key={idx}
              onClick={() => toggleStep(idx)}
              className={cn(
                'flex gap-3 p-2 -mx-2 rounded-lg cursor-pointer transition-colors',
                checkedSteps.has(idx) ? 'bg-green-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors',
                checkedSteps.has(idx)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              )}>
                {checkedSteps.has(idx) ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={cn(
                'flex-1 pt-0.5',
                checkedSteps.has(idx) && 'line-through text-gray-400'
              )}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div className="card mt-6 bg-amber-50 border border-amber-200">
          <h2 className="font-semibold text-amber-800 mb-2">Notes</h2>
          <p className="text-amber-700 text-sm">{recipe.notes}</p>
        </div>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {recipe.tags.map((tag, idx) => (
            <span key={idx} className="badge bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
