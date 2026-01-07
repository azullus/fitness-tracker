import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/recipes-data/[category]
 *
 * Serves recipe JSON files that aren't being served correctly
 * from /public/data/recipes/ in production standalone build.
 *
 * This is a workaround for Next.js standalone mode not serving
 * nested public directory files correctly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  const category = params.category;

  // Validate category to prevent path traversal
  const validCategories = ['index', 'breakfast', 'lunch', 'dinner', 'snack'];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: 'Invalid category' },
      { status: 400 }
    );
  }

  try {
    // Read the JSON file from public/data/recipes/
    const filePath = path.join(process.cwd(), 'public', 'data', 'recipes', `${category}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);

    // Return JSON with proper headers
    return NextResponse.json(jsonData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`Error reading recipe file ${category}:`, error);
    return NextResponse.json(
      { error: 'Recipe file not found', category },
      { status: 404 }
    );
  }
}
