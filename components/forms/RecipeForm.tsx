'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Recipe, RecipeIngredient, MacrosPerServing } from '@/lib/types';

type RecipeCategory = Recipe['category'];
type RecipeDifficulty = NonNullable<Recipe['difficulty']>;

interface PrefillRecipeData {
  name?: string;
  macrosPerServing?: Partial<MacrosPerServing>;
  category?: RecipeCategory;
}

interface RecipeFormData {
  name: string;
  description: string;
  category: RecipeCategory;
  prep_time_minutes: number | '';
  cook_time_minutes: number | '';
  servings: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  instructions: string[];
  macrosPerServing: MacrosPerServing;
  tags: string;
}

const initialIngredient: RecipeIngredient = {
  item: '',
  quantity: 1,
  unit: '',
  notes: '',
};

const initialMacros: MacrosPerServing = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

const initialFormData: RecipeFormData = {
  name: '',
  description: '',
  category: 'dinner',
  prep_time_minutes: '',
  cook_time_minutes: '',
  servings: 2,
  difficulty: 'medium',
  ingredients: [{ ...initialIngredient }],
  instructions: [''],
  macrosPerServing: { ...initialMacros },
  tags: '',
};

const CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const DIFFICULTIES: { value: RecipeDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const COMMON_UNITS = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'ml', 'each', 'cloves', 'slices'];

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  onSubmit: (recipe: Omit<Recipe, 'id' | 'created_at'>) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function RecipeForm({ initialData, onSubmit, onCancel, isEditing = false }: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'dinner',
        prep_time_minutes: initialData.prep_time_minutes || '',
        cook_time_minutes: initialData.cook_time_minutes || '',
        servings: initialData.servings || 2,
        difficulty: initialData.difficulty || 'medium',
        ingredients: initialData.ingredients?.length
          ? initialData.ingredients
          : [{ ...initialIngredient }],
        instructions: initialData.instructions?.length
          ? initialData.instructions
          : [''],
        macrosPerServing: initialData.macrosPerServing || { ...initialMacros },
        tags: initialData.tags?.join(', ') || '',
      };
    }
    return { ...initialFormData };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for prefill data from QuickAddFood "Save as Recipe" flow
  useEffect(() => {
    if (typeof window === 'undefined' || isEditing || initialData) {
      return;
    }

    try {
      const prefillData = sessionStorage.getItem('prefill-recipe');
      if (prefillData) {
        const parsed: PrefillRecipeData = JSON.parse(prefillData);

        setFormData((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          category: parsed.category || prev.category,
          macrosPerServing: {
            calories: parsed.macrosPerServing?.calories ?? prev.macrosPerServing.calories,
            protein: parsed.macrosPerServing?.protein ?? prev.macrosPerServing.protein,
            carbs: parsed.macrosPerServing?.carbs ?? prev.macrosPerServing.carbs,
            fat: parsed.macrosPerServing?.fat ?? prev.macrosPerServing.fat,
            fiber: parsed.macrosPerServing?.fiber ?? prev.macrosPerServing.fiber,
          },
        }));

        // Clear the prefill data to avoid re-populating on subsequent renders
        sessionStorage.removeItem('prefill-recipe');
      }
    } catch {
      // Clear invalid data
      sessionStorage.removeItem('prefill-recipe');
    }
  }, [isEditing, initialData]);

  const updateField = <K extends keyof RecipeFormData>(
    field: K,
    value: RecipeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Ingredient management
  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...initialIngredient }],
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData((prev) => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  // Instruction management
  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData((prev) => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index),
      }));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) =>
        i === index ? value : inst
      ),
    }));
  };

  // Macros management
  const updateMacro = (field: keyof MacrosPerServing, value: number) => {
    setFormData((prev) => ({
      ...prev,
      macrosPerServing: { ...prev.macrosPerServing, [field]: value },
    }));
  };

  // Validation - wrapped in useCallback to satisfy dependency rules
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required';
    }

    if (formData.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    // Check that at least one ingredient has an item name
    const hasValidIngredient = formData.ingredients.some((ing) => ing.item.trim());
    if (!hasValidIngredient) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    // Check that at least one instruction has content
    const hasValidInstruction = formData.instructions.some((inst) => inst.trim());
    if (!hasValidInstruction) {
      newErrors.instructions = 'At least one instruction is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.servings, formData.ingredients, formData.instructions]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Filter out empty ingredients and instructions
        const cleanedIngredients = formData.ingredients.filter(
          (ing) => ing.item.trim()
        );
        const cleanedInstructions = formData.instructions.filter(
          (inst) => inst.trim()
        );

        // Parse tags
        const tags = formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag);

        const recipe: Omit<Recipe, 'id' | 'created_at'> = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          prep_time_minutes:
            typeof formData.prep_time_minutes === 'number'
              ? formData.prep_time_minutes
              : undefined,
          cook_time_minutes:
            typeof formData.cook_time_minutes === 'number'
              ? formData.cook_time_minutes
              : undefined,
          servings: formData.servings,
          baseServings: formData.servings,
          difficulty: formData.difficulty,
          ingredients: cleanedIngredients,
          instructions: cleanedInstructions,
          macrosPerServing: formData.macrosPerServing,
          tags: tags.length > 0 ? tags : undefined,
        };

        await onSubmit(recipe);
      } catch (error) {
        setErrors({
          submit:
            error instanceof Error ? error.message : 'Failed to save recipe',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, validateForm]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Error */}
      {errors.submit && (
        <div
          className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          role="alert"
        >
          {errors.submit}
        </div>
      )}

      {/* Basic Info Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Basic Information
        </h3>

        <Input
          label="Recipe Name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Grilled Chicken Salad"
          error={errors.name}
          disabled={isSubmitting}
          className="dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
        />

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="A brief description of the recipe..."
            rows={3}
            disabled={isSubmitting}
            className={clsx(
              'block w-full rounded-lg border px-3 py-2 shadow-sm',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'dark:focus:ring-blue-400 dark:focus:border-blue-400',
              'transition-colors duration-200',
              'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400'
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                updateField('category', e.target.value as RecipeCategory)
              }
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'transition-colors duration-200',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400'
              )}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                updateField('difficulty', e.target.value as RecipeDifficulty)
              }
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'transition-colors duration-200',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400'
              )}
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="prep_time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Prep Time (min)
            </label>
            <input
              id="prep_time"
              type="number"
              value={formData.prep_time_minutes}
              onChange={(e) =>
                updateField(
                  'prep_time_minutes',
                  e.target.value ? parseInt(e.target.value) : ''
                )
              }
              min={0}
              placeholder="15"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'transition-colors duration-200',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'disabled:bg-gray-100 dark:disabled:bg-gray-900'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="cook_time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cook Time (min)
            </label>
            <input
              id="cook_time"
              type="number"
              value={formData.cook_time_minutes}
              onChange={(e) =>
                updateField(
                  'cook_time_minutes',
                  e.target.value ? parseInt(e.target.value) : ''
                )
              }
              min={0}
              placeholder="30"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'transition-colors duration-200',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'disabled:bg-gray-100 dark:disabled:bg-gray-900'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="servings"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Servings
            </label>
            <input
              id="servings"
              type="number"
              value={formData.servings}
              onChange={(e) =>
                updateField('servings', parseInt(e.target.value) || 1)
              }
              min={1}
              placeholder="2"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'transition-colors duration-200',
                errors.servings
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'disabled:bg-gray-100 dark:disabled:bg-gray-900'
              )}
            />
            {errors.servings && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.servings}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ingredients Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ingredients
          </h3>
          <button
            type="button"
            onClick={addIngredient}
            disabled={isSubmitting}
            className={clsx(
              'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg',
              'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              'hover:bg-blue-100 dark:hover:bg-blue-900/50',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Ingredient
          </button>
        </div>

        {errors.ingredients && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.ingredients}
          </p>
        )}

        <div className="space-y-3">
          {formData.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className={clsx(
                'flex items-start gap-2 p-3 rounded-lg',
                'bg-gray-50 dark:bg-gray-800/50',
                'border border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center text-gray-400 dark:text-gray-500 pt-2">
                <GripVertical className="h-4 w-4" />
              </div>

              <div className="flex-1 grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={ingredient.item}
                    onChange={(e) =>
                      updateIngredient(index, 'item', e.target.value)
                    }
                    placeholder="Ingredient name"
                    disabled={isSubmitting}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                      'border-gray-300 dark:border-gray-600',
                      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    )}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      updateIngredient(
                        index,
                        'quantity',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Qty"
                    min={0}
                    step={0.25}
                    disabled={isSubmitting}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                      'border-gray-300 dark:border-gray-600',
                      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    )}
                  />
                </div>

                <div className="col-span-2">
                  <select
                    value={ingredient.unit}
                    onChange={(e) =>
                      updateIngredient(index, 'unit', e.target.value)
                    }
                    disabled={isSubmitting}
                    className={clsx(
                      'block w-full rounded-lg border px-2 py-2 text-sm shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                      'border-gray-300 dark:border-gray-600',
                      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    )}
                  >
                    <option value="">Unit</option>
                    {COMMON_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <input
                    type="text"
                    value={ingredient.notes || ''}
                    onChange={(e) =>
                      updateIngredient(index, 'notes', e.target.value)
                    }
                    placeholder="Notes (optional)"
                    disabled={isSubmitting}
                    className={clsx(
                      'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                      'border-gray-300 dark:border-gray-600',
                      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    )}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={isSubmitting || formData.ingredients.length === 1}
                className={clsx(
                  'p-2 rounded-lg text-gray-400 dark:text-gray-500',
                  'hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
                  'transition-colors duration-200',
                  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent'
                )}
                aria-label="Remove ingredient"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Instructions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Instructions
          </h3>
          <button
            type="button"
            onClick={addInstruction}
            disabled={isSubmitting}
            className={clsx(
              'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg',
              'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              'hover:bg-blue-100 dark:hover:bg-blue-900/50',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Step
          </button>
        </div>

        {errors.instructions && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.instructions}
          </p>
        )}

        <div className="space-y-3">
          {formData.instructions.map((instruction, index) => (
            <div
              key={index}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-lg',
                'bg-gray-50 dark:bg-gray-800/50',
                'border border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-medium">
                {index + 1}
              </div>

              <div className="flex-1">
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={`Step ${index + 1}: Describe what to do...`}
                  rows={2}
                  disabled={isSubmitting}
                  className={clsx(
                    'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                    'border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                    'resize-none'
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() => removeInstruction(index)}
                disabled={isSubmitting || formData.instructions.length === 1}
                className={clsx(
                  'p-2 rounded-lg text-gray-400 dark:text-gray-500',
                  'hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
                  'transition-colors duration-200',
                  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent'
                )}
                aria-label="Remove step"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Nutrition Per Serving
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="calories"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Calories
            </label>
            <input
              id="calories"
              type="number"
              value={formData.macrosPerServing.calories || ''}
              onChange={(e) =>
                updateMacro('calories', parseInt(e.target.value) || 0)
              }
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="protein"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Protein (g)
            </label>
            <input
              id="protein"
              type="number"
              value={formData.macrosPerServing.protein || ''}
              onChange={(e) =>
                updateMacro('protein', parseInt(e.target.value) || 0)
              }
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="carbs"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="number"
              value={formData.macrosPerServing.carbs || ''}
              onChange={(e) =>
                updateMacro('carbs', parseInt(e.target.value) || 0)
              }
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fat"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Fat (g)
            </label>
            <input
              id="fat"
              type="number"
              value={formData.macrosPerServing.fat || ''}
              onChange={(e) =>
                updateMacro('fat', parseInt(e.target.value) || 0)
              }
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fiber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Fiber (g)
            </label>
            <input
              id="fiber"
              type="number"
              value={formData.macrosPerServing.fiber || ''}
              onChange={(e) =>
                updateMacro('fiber', parseInt(e.target.value) || 0)
              }
              min={0}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              )}
            />
          </div>
        </div>
      </section>

      {/* Tags Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Tags
        </h3>

        <div className="space-y-2">
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            placeholder="e.g., high-protein, quick, meal-prep (comma separated)"
            disabled={isSubmitting}
            className={clsx(
              'block w-full rounded-lg border px-3 py-2 shadow-sm',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'dark:focus:ring-blue-400 dark:focus:border-blue-400',
              'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            )}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Preview tags as chips */}
        {formData.tags.trim() && (
          <div className="flex flex-wrap gap-2">
            {formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag)
              .map((tag, index) => (
                <span
                  key={index}
                  className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm',
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </section>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="flex-1"
        >
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </div>
    </form>
  );
}

export default RecipeForm;
