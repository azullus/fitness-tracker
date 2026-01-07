// Script to extract recipe data from TypeScript files to JSON for lazy loading
// Run: npx tsx scripts/extract-recipes-to-json.ts

import * as fs from 'fs';
import * as path from 'path';
import { BREAKFAST_RECIPES } from '../lib/recipes/breakfast-recipes';
import { LUNCH_RECIPES } from '../lib/recipes/lunch-recipes';
import { DINNER_RECIPES } from '../lib/recipes/dinner-recipes';
import { SNACK_RECIPES } from '../lib/recipes/snack-recipes';

const OUTPUT_DIR = path.join(__dirname, '../public/data/recipes');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write each category to a separate JSON file
const categories = [
  { name: 'breakfast', recipes: BREAKFAST_RECIPES },
  { name: 'lunch', recipes: LUNCH_RECIPES },
  { name: 'dinner', recipes: DINNER_RECIPES },
  { name: 'snack', recipes: SNACK_RECIPES },
];

let totalRecipes = 0;

for (const { name, recipes } of categories) {
  const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));
  console.log(`Wrote ${recipes.length} ${name} recipes to ${outputPath}`);
  totalRecipes += recipes.length;
}

// Create an index file with recipe metadata (id, name, category) for quick lookups
const allRecipes = [
  ...BREAKFAST_RECIPES,
  ...LUNCH_RECIPES,
  ...DINNER_RECIPES,
  ...SNACK_RECIPES,
];

const recipeIndex = allRecipes.map((r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  tags: r.tags || [],
  difficulty: r.difficulty,
  totalTime: (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0),
  proteinPerServing: r.macrosPerServing?.protein || 0,
}));

const indexPath = path.join(OUTPUT_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(recipeIndex, null, 2));
console.log(`\nWrote recipe index with ${recipeIndex.length} entries to ${indexPath}`);

console.log(`\nTotal: ${totalRecipes} recipes extracted to JSON`);
