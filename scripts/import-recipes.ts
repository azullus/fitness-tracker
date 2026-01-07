#!/usr/bin/env tsx
/**
 * Recipe Import Script
 *
 * Imports recipes from markdown files in the Obsidian vault
 * into the Supabase recipes table.
 *
 * Usage:
 *   npx tsx scripts/import-recipes.ts           # Import all recipes
 *   npx tsx scripts/import-recipes.ts --dry-run # Preview without importing
 *
 * Recipe files location: /mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER/Pantry/Recipes/
 * Subdirectories: Breakfast/, Lunch/, Dinner/, Snacks/
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Types from lib/types.ts
interface RecipeIngredient {
  item: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface NutritionInfo {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  notes?: string;
  tags?: string[];
  source_file?: string;
  created_at?: string;
}

interface ParsedRecipe {
  recipe: Recipe;
  errors: string[];
  warnings: string[];
}

// Configuration
const RECIPES_BASE_PATH = '/mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER/Pantry/Recipes';
const CATEGORY_FOLDERS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const CATEGORY_MAP: Record<string, Recipe['category']> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snacks: 'snack',
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-n');
const isVerbose = args.includes('--verbose') || args.includes('-v');
const helpRequested = args.includes('--help') || args.includes('-h');

if (helpRequested) {
  console.log(`
Recipe Import Script

Usage:
  npx tsx scripts/import-recipes.ts [options]

Options:
  --dry-run, -n    Preview changes without importing to database
  --verbose, -v    Show detailed parsing information
  --help, -h       Show this help message

Examples:
  npx tsx scripts/import-recipes.ts           # Import all recipes
  npx tsx scripts/import-recipes.ts --dry-run # Preview without importing
  npx tsx scripts/import-recipes.ts -n -v     # Verbose dry run
`);
  process.exit(0);
}

/**
 * Generate a consistent ID from a filename
 */
function generateIdFromFilename(filepath: string): string {
  const filename = path.basename(filepath, '.md');
  // Convert to lowercase, replace spaces with hyphens, remove special chars
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse time string to minutes
 * Handles formats like: "10 mins", "10 minutes", "1 hour", "1 hour 30 minutes"
 */
function parseTimeToMinutes(timeStr: string): number | undefined {
  if (!timeStr || timeStr.toLowerCase().includes('overnight')) {
    return undefined;
  }

  const cleanStr = timeStr.toLowerCase().trim();
  let totalMinutes = 0;

  // Match hours
  const hoursMatch = cleanStr.match(/(\d+)\s*(?:hour|hr)s?/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }

  // Match minutes
  const minutesMatch = cleanStr.match(/(\d+)\s*(?:minute|min)s?/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }

  // If no matches but has a number, assume minutes
  if (totalMinutes === 0) {
    const numMatch = cleanStr.match(/(\d+)/);
    if (numMatch) {
      totalMinutes = parseInt(numMatch[1], 10);
    }
  }

  return totalMinutes > 0 ? totalMinutes : undefined;
}

/**
 * Parse servings from string
 */
function parseServings(servingsStr: string): number {
  const match = servingsStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2; // Default to 2 servings
}

/**
 * Parse nutrition value from string
 * Handles: "450 kcal", "35g", "12 g", "500mg"
 */
function parseNutritionValue(value: string): number | undefined {
  if (!value || value.toLowerCase().includes('x')) {
    return undefined;
  }
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Parse ingredient string into structured format
 * Example: "1 cup oats" -> { quantity: 1, unit: "cup", item: "oats" }
 */
function parseIngredient(line: string): RecipeIngredient {
  const cleanLine = line.replace(/^[-*]\s*/, '').trim();

  // Common units for matching
  const unitPattern =
    /^([\d.\/]+(?:\s*-\s*[\d.\/]+)?)\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lb|lbs?|pounds?|g|grams?|kg|ml|liters?|cloves?|slices?|pieces?|cans?|packages?|bunches?|heads?|stalks?|sprigs?|pinch(?:es)?|dash(?:es)?|handfuls?|large|medium|small)?\s*(.+)/i;

  const match = cleanLine.match(unitPattern);

  if (match) {
    const [, quantityStr, unit, item] = match;
    let quantity = 1;

    // Handle fractions
    if (quantityStr.includes('/')) {
      const [whole, fraction] = quantityStr.split(/\s+/);
      if (fraction) {
        const [num, den] = fraction.split('/');
        quantity = parseFloat(whole) + parseInt(num, 10) / parseInt(den, 10);
      } else {
        const [num, den] = quantityStr.split('/');
        quantity = parseInt(num, 10) / parseInt(den, 10);
      }
    } else if (quantityStr.includes('-')) {
      // Handle ranges like "1-2", take the average
      const [min, max] = quantityStr.split('-').map((s) => parseFloat(s));
      quantity = (min + max) / 2;
    } else {
      quantity = parseFloat(quantityStr) || 1;
    }

    // Extract notes from parentheses
    const notesMatch = item.match(/\(([^)]+)\)/);
    const notes = notesMatch ? notesMatch[1] : undefined;
    const cleanItem = item.replace(/\([^)]+\)/g, '').trim();

    return {
      item: cleanItem,
      quantity,
      unit: unit?.toLowerCase() || 'unit',
      ...(notes && { notes }),
    };
  }

  // If no pattern match, return as-is
  return {
    item: cleanLine,
    quantity: 1,
    unit: 'unit',
  };
}

/**
 * Parse tags from markdown
 * Handles: `tag1` `tag2` or tag1, tag2 or #tag1 #tag2
 */
function parseTags(tagLine: string): string[] {
  if (!tagLine) return [];

  // Remove markdown backticks and hash symbols
  const cleaned = tagLine.replace(/[`#]/g, '').trim();

  // Split by commas, spaces, or both
  return cleaned
    .split(/[,\s]+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag !== 'x');
}

/**
 * Extract section content between headers
 */
function extractSection(content: string, sectionName: string): string[] {
  const lines = content.split('\n');
  const sectionLines: string[] = [];
  let inSection = false;
  let sectionLevel = 0;

  // Escape special regex characters in section name
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionPatterns = [
    new RegExp(`^##\\s*${escapedName}`, 'i'),
    new RegExp(`^###\\s*${escapedName}`, 'i'),
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're entering the target section
    let foundSection = false;
    for (const pattern of sectionPatterns) {
      if (pattern.test(line)) {
        inSection = true;
        sectionLevel = line.startsWith('###') ? 3 : 2;
        foundSection = true;
        break;
      }
    }

    // Skip the header line itself
    if (foundSection) {
      continue;
    }

    if (inSection) {
      // Check if we've hit another section of same or higher level
      const headerMatch = line.match(/^(#{2,})\s+/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        if (level <= sectionLevel) {
          break; // End of our section
        }
      }

      sectionLines.push(line);
    }
  }

  return sectionLines;
}

/**
 * Parse nutrition table from markdown
 */
function parseNutritionTable(lines: string[]): NutritionInfo {
  const nutrition: NutritionInfo = {};

  for (const line of lines) {
    if (!line.includes('|')) continue;

    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);

    if (cells.length < 2) continue;

    const [nutrient, amount] = cells;
    const nutrientLower = nutrient.toLowerCase();

    if (nutrientLower.includes('calorie')) {
      nutrition.calories = parseNutritionValue(amount);
    } else if (nutrientLower.includes('protein')) {
      nutrition.protein_g = parseNutritionValue(amount);
    } else if (nutrientLower.includes('carb')) {
      nutrition.carbs_g = parseNutritionValue(amount);
    } else if (nutrientLower.includes('fat')) {
      nutrition.fat_g = parseNutritionValue(amount);
    } else if (nutrientLower.includes('fiber')) {
      nutrition.fiber_g = parseNutritionValue(amount);
    } else if (nutrientLower.includes('sodium')) {
      nutrition.sodium_mg = parseNutritionValue(amount);
    }
  }

  return nutrition;
}

/**
 * Parse a single recipe markdown file
 */
function parseRecipeFile(filepath: string, category: Recipe['category']): ParsedRecipe {
  const errors: string[] = [];
  const warnings: string[] = [];

  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  // Generate ID from filename
  const id = generateIdFromFilename(filepath);

  // Parse title (first # heading)
  let name = '';
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    name = titleMatch[1].trim();
  } else {
    errors.push('No title found (expected # heading)');
    name = path.basename(filepath, '.md').replace(/-/g, ' ');
  }

  // Parse metadata from bold fields
  let servings = 2;
  let prepTime: number | undefined;
  let cookTime: number | undefined;

  // Look for **Field:** patterns
  const servingsMatch = content.match(/\*\*Servings?:\*\*\s*(.+)/i);
  if (servingsMatch) {
    servings = parseServings(servingsMatch[1]);
  }

  const prepMatch = content.match(/\*\*Prep\s*Time:\*\*\s*(.+)/i);
  if (prepMatch) {
    prepTime = parseTimeToMinutes(prepMatch[1]);
  }

  const cookMatch = content.match(/\*\*Cook\s*Time:\*\*\s*(.+)/i);
  if (cookMatch) {
    cookTime = parseTimeToMinutes(cookMatch[1]);
  }

  // Parse nutrition
  const nutritionLines = extractSection(content, 'Nutrition Facts');
  const nutrition = parseNutritionTable(nutritionLines);

  if (Object.keys(nutrition).length === 0) {
    warnings.push('No nutrition information found');
  }

  // Parse ingredients
  const ingredientLines = extractSection(content, 'Ingredients');
  const ingredients: RecipeIngredient[] = [];

  for (const line of ingredientLines) {
    const trimmed = line.trim();
    // Skip empty lines, headers, and table separators
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|')) {
      continue;
    }
    // Check if it's a list item
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      ingredients.push(parseIngredient(trimmed));
    }
  }

  if (ingredients.length === 0) {
    errors.push('No ingredients found');
  }

  // Parse instructions
  const instructionLines = extractSection(content, 'Instructions');
  const instructions: string[] = [];

  for (const line of instructionLines) {
    const trimmed = line.trim();
    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    // Check if it's a numbered list item
    const numMatch = trimmed.match(/^\d+\.\s*(.+)/);
    if (numMatch) {
      instructions.push(numMatch[1].trim());
    }
  }

  if (instructions.length === 0) {
    errors.push('No instructions found');
  }

  // Parse notes
  const notesLines = extractSection(content, 'Notes');
  let notes: string | undefined;

  const noteText = notesLines
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter((l) => l)
    .join('\n');

  if (noteText) {
    notes = noteText;
  }

  // Parse tags
  const tagsLines = extractSection(content, 'Tags');
  const tagsText = tagsLines.join(' ').trim();
  const tags = parseTags(tagsText);

  // Build recipe object
  const recipe: Recipe = {
    id,
    name,
    category,
    servings,
    ingredients,
    instructions,
    source_file: filepath,
    ...(prepTime && { prep_time_minutes: prepTime }),
    ...(cookTime && { cook_time_minutes: cookTime }),
    ...(Object.keys(nutrition).length > 0 && { nutrition }),
    ...(notes && { notes }),
    ...(tags.length > 0 && { tags }),
  };

  return { recipe, errors, warnings };
}

/**
 * Find all recipe markdown files
 */
function findRecipeFiles(): Array<{ filepath: string; category: Recipe['category'] }> {
  const recipes: Array<{ filepath: string; category: Recipe['category'] }> = [];

  for (const folder of CATEGORY_FOLDERS) {
    const folderPath = path.join(RECIPES_BASE_PATH, folder);

    if (!fs.existsSync(folderPath)) {
      console.warn(`Warning: Folder not found: ${folderPath}`);
      continue;
    }

    const category = CATEGORY_MAP[folder.toLowerCase()];
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (file.endsWith('.md') && !file.startsWith('_')) {
        recipes.push({
          filepath: path.join(folderPath, file),
          category,
        });
      }
    }
  }

  return recipes;
}

/**
 * Initialize Supabase client
 */
function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Upsert recipes to Supabase
 */
async function upsertRecipes(
  supabase: SupabaseClient,
  recipes: Recipe[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const result = { success: 0, failed: 0, errors: [] as string[] };

  for (const recipe of recipes) {
    try {
      const { error } = await supabase.from('recipes').upsert(
        {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrition: recipe.nutrition,
          notes: recipe.notes,
          tags: recipe.tags,
          source_file: recipe.source_file,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        result.failed++;
        result.errors.push(`${recipe.name}: ${error.message}`);
      } else {
        result.success++;
      }
    } catch (err) {
      result.failed++;
      result.errors.push(`${recipe.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  console.log('========================================');
  console.log('Recipe Import Script');
  console.log('========================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'IMPORT'}`);
  console.log(`Recipe Path: ${RECIPES_BASE_PATH}`);
  console.log('');

  // Find all recipe files
  const recipeFiles = findRecipeFiles();
  console.log(`Found ${recipeFiles.length} recipe files`);
  console.log('');

  // Parse all recipes
  const parsedRecipes: ParsedRecipe[] = [];
  const parseErrors: Array<{ file: string; errors: string[] }> = [];

  for (const { filepath, category } of recipeFiles) {
    try {
      const parsed = parseRecipeFile(filepath, category);
      parsedRecipes.push(parsed);

      if (isVerbose) {
        console.log(`Parsed: ${parsed.recipe.name}`);
        if (parsed.warnings.length > 0) {
          console.log(`  Warnings: ${parsed.warnings.join(', ')}`);
        }
      }

      if (parsed.errors.length > 0) {
        parseErrors.push({ file: filepath, errors: parsed.errors });
      }
    } catch (err) {
      console.error(`Error parsing ${filepath}: ${err instanceof Error ? err.message : String(err)}`);
      parseErrors.push({
        file: filepath,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  // Summary by category
  const categoryCounts: Record<string, number> = {};
  for (const { recipe } of parsedRecipes) {
    categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
  }

  console.log('Recipes by category:');
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log('');

  // Report parse errors
  if (parseErrors.length > 0) {
    console.log('Parse Errors (these recipes will be skipped):');
    for (const { file, errors } of parseErrors) {
      console.log(`  ${path.basename(file)}:`);
      for (const error of errors) {
        console.log(`    - ${error}`);
      }
    }
    console.log('');
  }

  // Filter to only valid recipes
  const validRecipes = parsedRecipes
    .filter((p) => p.errors.length === 0)
    .map((p) => p.recipe);

  console.log(`Valid recipes for import: ${validRecipes.length}`);
  console.log('');

  // Dry run - show what would be imported
  if (isDryRun) {
    console.log('DRY RUN - Would import the following recipes:');
    console.log('');

    for (const recipe of validRecipes) {
      console.log(`  [${recipe.category.toUpperCase()}] ${recipe.name}`);
      console.log(`    ID: ${recipe.id}`);
      console.log(`    Servings: ${recipe.servings}`);
      if (recipe.prep_time_minutes) {
        console.log(`    Prep: ${recipe.prep_time_minutes} min`);
      }
      if (recipe.cook_time_minutes) {
        console.log(`    Cook: ${recipe.cook_time_minutes} min`);
      }
      console.log(`    Ingredients: ${recipe.ingredients.length}`);
      console.log(`    Instructions: ${recipe.instructions.length} steps`);
      if (recipe.nutrition) {
        const n = recipe.nutrition;
        console.log(
          `    Nutrition: ${n.calories || '?'} cal, ${n.protein_g || '?'}g protein`
        );
      }
      if (recipe.tags && recipe.tags.length > 0) {
        console.log(`    Tags: ${recipe.tags.join(', ')}`);
      }
      console.log('');
    }

    console.log('========================================');
    console.log('DRY RUN COMPLETE - No changes made');
    console.log(`Would import ${validRecipes.length} recipes`);
    console.log('========================================');
    return;
  }

  // Actual import
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Error: Supabase not configured');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('Or use SUPABASE_SERVICE_ROLE_KEY for service-level access');
    console.error('');
    console.error('Run with --dry-run to preview without database connection');
    process.exit(1);
  }

  console.log('Importing recipes to Supabase...');
  const result = await upsertRecipes(supabase, validRecipes);

  console.log('');
  console.log('========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');
  console.log(`Successfully imported: ${result.success}`);
  console.log(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('');
    console.log('Import Errors:');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  console.log('');

  // Exit with error code if there were failures
  if (result.failed > 0 || parseErrors.length > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
