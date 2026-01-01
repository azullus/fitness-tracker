'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import Header from '@/components/navigation/Header';
import { RecipeForm } from '@/components/forms/RecipeForm';
import { saveUserRecipe } from '@/lib/user-recipes';
import type { Recipe } from '@/lib/types';

export default function NewRecipePage() {
  const router = useRouter();

  const handleSubmit = async (recipe: Omit<Recipe, 'id' | 'created_at'>) => {
    try {
      saveUserRecipe(recipe);
      router.push('/recipes');
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/recipes');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="New Recipe" showPersonToggle={false} />

      <main className="px-4 py-4">
        {/* Back button */}
        <button
          onClick={handleCancel}
          className={clsx(
            'inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-lg',
            'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-colors duration-200'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recipes</span>
        </button>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Recipe
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Add your own custom recipe to your collection
              </p>
            </div>

            <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />
          </div>
        </div>
      </main>
    </div>
  );
}
