import { NextRequest, NextResponse } from 'next/server';
import {
  getProductBySlug,
  getLicenseByKey,
  getActivation,
  countActivations,
  createActivation,
} from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, product_slug, ip_address, hostname, machine_fingerprint } = body;
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

    // Check existing activation
    const existing = await getActivation(license.id, ip_address);
    if (existing) {
      const count = await countActivations(license.id);
      return NextResponse.json({
        success: true,
        message: 'Already activated',
        activations_remaining: license.max_ips - count,
      });
    }

    // Check limit
    const count = await countActivations(license.id);
    if (count >= license.max_ips) {
      return NextResponse.json(
        { error: 'ACTIVATION_LIMIT_REACHED', message: `Maximum activations (${license.max_ips}) reached` },
        { status: 403 }
      );
    }

    // Create activation
    const activation = await createActivation(license.id, ip_address, hostname, machine_fingerprint);

    return NextResponse.json({
      success: true,
      message: 'License activated successfully',
      activation: {
        id: activation.id,
        ip_address: activation.ip_address,
        hostname: activation.hostname,
        activated_at: activation.activated_at,
      },
      activations_remaining: license.max_ips - count - 1,
    });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
