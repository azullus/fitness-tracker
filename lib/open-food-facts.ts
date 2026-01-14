/**
 * Open Food Facts API client
 * Provides nutrition data lookup by barcode
 */

// ============================================================================
// Types
// ============================================================================

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize: string;
  servingSizeGrams: number;
  nutritionPer100g: NutritionData;
  nutritionPerServing: NutritionData;
}

export interface FoodLookupResult {
  success: boolean;
  product?: OpenFoodFactsProduct;
  error?: string;
}

// ============================================================================
// API Response Types (from Open Food Facts)
// ============================================================================

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'energy_100g'?: number; // In kJ, needs conversion
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
}

interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OFFNutriments;
}

interface OFFResponse {
  status: number;
  status_verbose: string;
  product?: OFFProduct;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse serving size string to extract grams
 * Examples: "30g", "1 cup (240ml)", "100 g", "2 pieces (50g)"
 */
export function parseServingSizeGrams(servingSize: string | undefined): number {
  if (!servingSize) return 100; // Default to 100g if not specified

  // Try to find a gram value in the string
  const gramMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?/i);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }

  // Try to find ml (approximate 1ml = 1g for liquids)
  const mlMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (mlMatch) {
    return parseFloat(mlMatch[1]);
  }

  return 100; // Default fallback
}

/**
 * Calculate nutrition for a specific serving size from per-100g values
 */
export function calculateNutritionPerServing(
  nutritionPer100g: NutritionData,
  servingGrams: number
): NutritionData {
  const multiplier = servingGrams / 100;

  return {
    calories: Math.round(nutritionPer100g.calories * multiplier),
    protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
    carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
    fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
    fiber: Math.round(nutritionPer100g.fiber * multiplier * 10) / 10,
  };
}

/**
 * Extract nutrition per 100g from Open Food Facts nutriments
 */
function extractNutritionPer100g(nutriments: OFFNutriments | undefined): NutritionData {
  if (!nutriments) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  // Get calories - prefer kcal, but convert from kJ if needed
  let calories = nutriments['energy-kcal_100g'] || 0;
  if (!calories && nutriments['energy_100g']) {
    // Convert kJ to kcal (1 kcal = 4.184 kJ)
    calories = Math.round(nutriments['energy_100g'] / 4.184);
  }

  return {
    calories: Math.round(calories),
    protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
    fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
  };
}

/**
 * Parse Open Food Facts API response into our product format
 */
export function parseOFFResponse(response: OFFResponse, barcode: string): FoodLookupResult {
  if (response.status !== 1 || !response.product) {
    return {
      success: false,
      error: 'Product not found in database',
    };
  }

  const product = response.product;

  // Get product name (try multiple fields)
  const name = product.product_name || product.product_name_en || 'Unknown Product';

  // Get serving size
  const servingSizeRaw = product.serving_size || '100g';
  const servingSizeGrams = product.serving_quantity || parseServingSizeGrams(servingSizeRaw);

  // Get nutrition data
  const nutritionPer100g = extractNutritionPer100g(product.nutriments);
  const nutritionPerServing = calculateNutritionPerServing(nutritionPer100g, servingSizeGrams);

  return {
    success: true,
    product: {
      barcode,
      name,
      brand: product.brands || undefined,
      imageUrl: product.image_front_url || product.image_url || undefined,
      servingSize: servingSizeRaw,
      servingSizeGrams,
      nutritionPer100g,
      nutritionPerServing,
    },
  };
}

// ============================================================================
// API Client (for server-side use)
// ============================================================================

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * Fetch product data from Open Food Facts API
 * This should be called from a server-side API route to avoid CORS issues
 */
export async function fetchProductByBarcode(barcode: string): Promise<FoodLookupResult> {
  try {
    const url = `${OPEN_FOOD_FACTS_API}/${barcode}.json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FitnessTracker/1.0 (https://github.com/cosmicbytez/fitness-tracker)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Product not found in database',
        };
      }
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data: OFFResponse = await response.json();
    return parseOFFResponse(data, barcode);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product data',
    };
  }
}

// ============================================================================
// Barcode Validation
// ============================================================================

/**
 * Validate barcode format (UPC-A, UPC-E, EAN-8, EAN-13)
 */
export function isValidBarcode(barcode: string): boolean {
  // Remove any whitespace
  const cleaned = barcode.replace(/\s/g, '');

  // Check if it's all digits and valid length
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // Valid lengths: 8 (UPC-E/EAN-8), 12 (UPC-A), 13 (EAN-13)
  const validLengths = [8, 12, 13];
  return validLengths.includes(cleaned.length);
}

/**
 * Validate barcode with checksum verification
 */
export function validateBarcodeChecksum(barcode: string): boolean {
  const cleaned = barcode.replace(/\s/g, '');

  if (!isValidBarcode(cleaned)) {
    return false;
  }

  // EAN-13 and UPC-A checksum validation
  if (cleaned.length === 13 || cleaned.length === 12) {
    const digits = cleaned.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      // For EAN-13: odd positions (0,2,4...) multiply by 1, even by 3
      // For UPC-A (12 digits): similar pattern
      const multiplier = i % 2 === 0 ? 1 : 3;
      sum += digits[i] * multiplier;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  // EAN-8 checksum validation
  if (cleaned.length === 8) {
    const digits = cleaned.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      const multiplier = i % 2 === 0 ? 3 : 1;
      sum += digits[i] * multiplier;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  return true; // Unknown format, allow it
}
