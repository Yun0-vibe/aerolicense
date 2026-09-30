import { NextRequest, NextResponse } from 'next/server';
import {
  getProductBySlug,
  getLicenseByKey,
  getSubscription,
  getActivation,
  updateActivationLastSeen,
} from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, product_slug, ip_address } = body;
    const apiKey = req.headers.get('x-product-api-key');

    // Quick validation
    const product = await getProductBySlug(product_slug);
    if (!product || product.api_key !== apiKey) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const license = await getLicenseByKey(license_key);
    if (!license || license.product_id !== product.id) {
      return NextResponse.json({ valid: false }, { status: 403 });
    }

    const subscription = await getSubscription(license.subscription_id);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ valid: false }, { status: 402 });
    }

    // Update last seen
    const activation = await getActivation(license.id, ip_address);
    if (activation) {
      await updateActivationLastSeen(activation.id);
    }

    return NextResponse.json({
      valid: true,
      subscription_status: subscription.status,
      expires_at: subscription.expires_at,
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
