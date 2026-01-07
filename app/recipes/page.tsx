'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChefHat, Plus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Header from '@/components/navigation/Header';
import { RecipeCard } from '@/components/cards/RecipeCard';
import {
  ALL_RECIPES,
  FULL_RECIPE_COUNTS,
  fetchAllRecipes,
} from '@/lib/recipes';
import { getUserRecipes } from '@/lib/user-recipes';
import { usePerson } from '@/components/providers/PersonProvider';
import type { Recipe } from '@/lib/types';

type CategoryFilter = 'all' | Recipe['category'];

const categories: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

export default function RecipesPage() {
  const router = useRouter();
  const { householdMembers } = usePerson();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

  // State for lazy-loaded recipes
  const [loadedRecipes, setLoadedRecipes] = useState<Recipe[]>(ALL_RECIPES);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  // Load user recipes from localStorage on mount
  useEffect(() => {
    setUserRecipes(getUserRecipes());
  }, []);

  // Lazy load full recipe collection on mount
  useEffect(() => {
    const loadFullRecipes = async () => {
      // Only load if we haven't already and we're in browser
      if (hasLoadedAll || typeof window === 'undefined') return;

      setIsLoading(true);
      try {
        const allRecipes = await fetchAllRecipes();
        if (allRecipes.length > 0) {
          setLoadedRecipes(allRecipes);
          setHasLoadedAll(true);
        }
      } catch {
        // Keep using initial recipes on error
      } finally {
        setIsLoading(false);
      }
    };

    loadFullRecipes();
  }, [hasLoadedAll]);

  // Combine all recipes (loaded + user-created)
  const allRecipes = useMemo(() => {
    return [...loadedRecipes, ...userRecipes];
  }, [loadedRecipes, userRecipes]);

  // Get recipe statistics including user recipes
  const recipeStats = useMemo(() => {
    // Use full counts for display (even before loading completes)
    const baseStats = hasLoadedAll
      ? {
          total: loadedRecipes.length,
          breakfast: loadedRecipes.filter((r) => r.category === 'breakfast').length,
          lunch: loadedRecipes.filter((r) => r.category === 'lunch').length,
          dinner: loadedRecipes.filter((r) => r.category === 'dinner').length,
          snack: loadedRecipes.filter((r) => r.category === 'snack').length,
        }
      : FULL_RECIPE_COUNTS;

    const userBreakfast = userRecipes.filter((r) => r.category === 'breakfast').length;
    const userLunch = userRecipes.filter((r) => r.category === 'lunch').length;
    const userDinner = userRecipes.filter((r) => r.category === 'dinner').length;
    const userSnack = userRecipes.filter((r) => r.category === 'snack').length;

    return {
      total: baseStats.total + userRecipes.length,
      breakfast: baseStats.breakfast + userBreakfast,
      lunch: baseStats.lunch + userLunch,
      dinner: baseStats.dinner + userDinner,
      snack: baseStats.snack + userSnack,
    };
  }, [loadedRecipes, userRecipes, hasLoadedAll]);

  // Filter recipes based on category and search query
  const filteredRecipes = useMemo(() => {
    // If there's a search query, search through all recipes (including user recipes)
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.trim().toLowerCase();
      const searchResults = allRecipes.filter((r) => {
        return (
          r.name.toLowerCase().includes(lowerQuery) ||
          r.description?.toLowerCase().includes(lowerQuery) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          r.ingredients.some((ing) => ing.item.toLowerCase().includes(lowerQuery))
        );
      });
      // Further filter by category if not 'all'
      if (activeCategory !== 'all') {
        return searchResults.filter((r) => r.category === activeCategory);
      }
      return searchResults;
    }

    // No search query - just filter by category
    if (activeCategory === 'all') {
      return allRecipes;
    }
    return allRecipes.filter((r) => r.category === activeCategory);
  }, [activeCategory, searchQuery, allRecipes]);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Recipes" showPersonToggle={true} />

      <main className="px-4 py-4">
        {/* Header with Add Recipe Button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mr-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">{recipeStats.total}</span> total recipes
                {userRecipes.length > 0 && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    ({userRecipes.length} custom)
                  </span>
                )}
                {isLoading && (
                  <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin text-emerald-500" />
                )}
              </span>
              <div className="hidden sm:flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{recipeStats.breakfast} breakfast</span>
                <span>{recipeStats.lunch} lunch</span>
                <span>{recipeStats.dinner} dinner</span>
                <span>{recipeStats.snack} snacks</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/recipes/new')}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-3 rounded-xl',
              'bg-emerald-600 dark:bg-emerald-600 text-white font-medium',
              'hover:bg-emerald-700 dark:hover:bg-emerald-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
              'dark:focus:ring-emerald-400 dark:focus:ring-offset-gray-900',
              'transition-all duration-200',
              'shadow-md hover:shadow-lg'
            )}
            aria-label="Add new recipe"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add Recipe</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search recipes by name, ingredients, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
              'dark:focus:ring-emerald-400 dark:focus:border-emerald-400',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  activeCategory === category.value
                    ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Count */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ChefHat className="h-4 w-4" aria-hidden="true" />
          <span>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
            {activeCategory !== 'all' && ` in ${categories.find(c => c.value === activeCategory)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && loadedRecipes.length <= 12 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading recipes...</span>
          </div>
        )}

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleRecipeClick(recipe.id)}
                showScaling={true}
                householdSize={householdMembers.length || 2}
                showLogButton={true}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <ChefHat className="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No recipes found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
              {searchQuery
                ? `No recipes match "${searchQuery}". Try a different search term or search by ingredient.`
                : `No recipes in this category yet. Try selecting a different category.`}
            </p>
            <button
              onClick={() => router.push('/recipes/new')}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-emerald-600 dark:bg-emerald-600 text-white font-medium',
                'hover:bg-emerald-700 dark:hover:bg-emerald-500',
                'transition-all duration-200 shadow-md hover:shadow-lg'
              )}
            >
              <Plus className="h-4 w-4" />
              Create Your Own Recipe
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
