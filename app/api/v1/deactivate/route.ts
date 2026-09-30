import { NextRequest, NextResponse } from 'next/server';
import {
  getProductBySlug,
  getLicenseByKey,
  getActivation,
  deactivateActivation,
} from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, product_slug, ip_address } = body;
    const apiKey = req.headers.get('x-product-api-key');

    // Validate product
    const product = await getProductBySlug(product_slug);
    if (!product || product.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid product' },
        { status: 401 }
      );
    }

    // Validate license
    const license = await getLicenseByKey(license_key);
    if (!license || license.product_id !== product.id) {
      return NextResponse.json(
        { error: 'LICENSE_INVALID', message: 'Invalid license' },
        { status: 403 }
      );
    }

    // Find and deactivate activation
    const activation = await getActivation(license.id, ip_address);
    if (!activation) {
      return NextResponse.json(
        { error: 'NOT_ACTIVATED', message: 'No activation found for this IP' },
        { status: 404 }
      );
    }

    await deactivateActivation(activation.id);

    return NextResponse.json({
      success: true,
      message: 'License deactivated successfully',
    });

  } catch (error) {
    console.error('Deactivation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
