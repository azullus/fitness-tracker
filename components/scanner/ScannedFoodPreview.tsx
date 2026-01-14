'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, RotateCcw, X, Minus, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import type { OpenFoodFactsProduct, NutritionData } from '@/lib/open-food-facts';
import { calculateNutritionPerServing } from '@/lib/open-food-facts';

/**
 * ProductImage component with error handling fallback
 */
function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Package className="w-10 h-10 text-gray-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-24 h-24 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
      onError={() => setHasError(true)}
    />
  );
}

interface ScannedFoodPreviewProps {
  product: OpenFoodFactsProduct;
  onConfirm: (data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    servingSize: string;
  }) => void;
  onScanAgain: () => void;
  onCancel: () => void;
}

export function ScannedFoodPreview({
  product,
  onConfirm,
  onScanAgain,
  onCancel,
}: ScannedFoodPreviewProps) {
  // Ensure servingGrams is always a valid number (fallback to 100g if undefined)
  const [servingGrams, setServingGrams] = useState(product.servingSizeGrams || 100);
  const [servingCount, setServingCount] = useState(1);

  // Calculate nutrition based on current serving size
  const currentNutrition = useMemo((): NutritionData => {
    const totalGrams = servingGrams * servingCount;
    return calculateNutritionPerServing(product.nutritionPer100g, totalGrams);
  }, [product.nutritionPer100g, servingGrams, servingCount]);

  const handleServingChange = useCallback((delta: number) => {
    setServingCount((prev) => Math.max(0.5, Math.min(10, prev + delta)));
  }, []);

  const handleGramsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty input for typing, but validate on blur
    if (inputValue === '') {
      return;
    }
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0 && value <= 2000) {
      setServingGrams(value);
    }
  }, []);

  // Ensure valid value on blur
  const handleGramsBlur = useCallback(() => {
    if (servingGrams <= 0 || isNaN(servingGrams)) {
      setServingGrams(product.servingSizeGrams || 100);
    }
  }, [servingGrams, product.servingSizeGrams]);

  const handleConfirm = useCallback(() => {
    const totalGrams = servingGrams * servingCount;
    onConfirm({
      name: product.brand ? `${product.brand} ${product.name}` : product.name,
      calories: currentNutrition.calories,
      protein: currentNutrition.protein,
      carbs: currentNutrition.carbs,
      fat: currentNutrition.fat,
      fiber: currentNutrition.fiber,
      servingSize: `${Math.round(totalGrams)}g`,
    });
  }, [product, servingGrams, servingCount, currentNutrition, onConfirm]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cancel"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Product Found
        </h2>
        <button
          onClick={onScanAgain}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scan another"
        >
          <RotateCcw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Product Info */}
        <div className="flex gap-4">
          <ProductImage src={product.imageUrl} alt={product.name} />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.brand}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Barcode: {product.barcode}
            </p>
          </div>
        </div>

        {/* Serving Size Adjuster */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Serving Size
          </label>

          {/* Serving count buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleServingChange(-0.5)}
              className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={servingCount <= 0.5}
              aria-label="Decrease serving"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {servingCount}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
                serving{servingCount !== 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={() => handleServingChange(0.5)}
              className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={servingCount >= 10}
              aria-label="Increase serving"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Grams input */}
          <div className="flex items-center gap-2 justify-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              1 serving =
            </span>
            <input
              type="number"
              value={servingGrams}
              onChange={handleGramsChange}
              onBlur={handleGramsBlur}
              min="1"
              max="2000"
              aria-label="Serving size in grams"
              className={clsx(
                'w-20 px-2 py-1 text-center rounded-lg border',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 focus:outline-none'
              )}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">g</span>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Total: {Math.round(servingGrams * servingCount)}g
          </p>
        </div>

        {/* Nutrition Facts */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Nutrition ({Math.round(servingGrams * servingCount)}g)
          </h4>

          {/* Calories - Prominent */}
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {currentNutrition.calories}
            </span>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
              cal
            </span>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-4 gap-2">
            <MacroCard label="Protein" value={currentNutrition.protein} unit="g" color="blue" />
            <MacroCard label="Carbs" value={currentNutrition.carbs} unit="g" color="amber" />
            <MacroCard label="Fat" value={currentNutrition.fat} unit="g" color="red" />
            <MacroCard label="Fiber" value={currentNutrition.fiber} unit="g" color="green" />
          </div>
        </div>

        {/* Per 100g reference */}
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Per 100g: {product.nutritionPer100g.calories} cal |{' '}
          P: {product.nutritionPer100g.protein}g |{' '}
          C: {product.nutritionPer100g.carbs}g |{' '}
          F: {product.nutritionPer100g.fat}g
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Button
          onClick={handleConfirm}
          variant="primary"
          className="w-full py-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Food Log
        </Button>
        <Button
          onClick={onScanAgain}
          variant="secondary"
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Scan Different Product
        </Button>
      </div>
    </div>
  );
}

// Helper component for macro cards
function MacroCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: 'blue' | 'amber' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  };

  return (
    <div className={clsx('rounded-lg p-2 text-center', colorClasses[color])}>
      <div className="text-lg font-semibold">
        {value}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

export default ScannedFoodPreview;
