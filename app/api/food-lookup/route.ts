import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { validateBarcode } from '@/lib/validation';
import { fetchProductByBarcode } from '@/lib/open-food-facts';

/**
 * GET /api/food-lookup
 * Lookup food nutrition data by barcode
 * Query params: barcode (required)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting - 100 requests per minute for reads
    const rateLimitResponse = applyRateLimit(request, RateLimitPresets.READ);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    // Validate barcode is provided
    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'barcode query parameter is required' },
        { status: 400 }
      );
    }

    // Clean and validate barcode format
    const cleanedBarcode = barcode.replace(/\s/g, '');
    const barcodeValidation = validateBarcode(cleanedBarcode);
    if (!barcodeValidation.valid) {
      return NextResponse.json(
        { success: false, error: barcodeValidation.error },
        { status: 400 }
      );
    }

    // Fetch from Open Food Facts API
    const result = await fetchProductByBarcode(cleanedBarcode);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Product not found',
          barcode: cleanedBarcode,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.product,
      source: 'open-food-facts',
    });
  } catch (error) {
    console.error('Food lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
