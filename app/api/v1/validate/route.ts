import { NextRequest, NextResponse } from 'next/server';
import {
  getProductBySlug,
  getLicenseByKey,
  getSubscription,
  getActivation,
  countActivations,
  createActivation,
  updateActivationLastSeen,
} from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, product_slug, ip_address, hostname, machine_fingerprint, version } = body;
    const apiKey = req.headers.get('x-product-api-key');

    // Step 1: Check if product exists
    const product = await getProductBySlug(product_slug);
    if (!product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: `Product '${product_slug}' is not registered` },
        { status: 404 }
      );
    }

    // Step 2: Check if API key is valid
    if (product.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid product API key' },
        { status: 401 }
      );
    }

    // Step 3: Check if license exists
    const license = await getLicenseByKey(license_key);
    if (!license) {
      return NextResponse.json(
        { error: 'LICENSE_INVALID', message: 'License key is invalid or expired' },
        { status: 403 }
      );
    }

    // Step 4: Check if license is for THIS product
    if (license.product_id !== product.id) {
      return NextResponse.json(
        { error: 'LICENSE_PRODUCT_MISMATCH', message: `License is not valid for product '${product_slug}'. This license is for a different product.` },
        { status: 403 }
      );
    }

    // Step 5: Check if license is active
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: 'LICENSE_REVOKED', message: 'License has been revoked' },
        { status: 403 }
      );
    }

    // Step 6: Check subscription
    const subscription = await getSubscription(license.subscription_id);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'SUBSCRIPTION_EXPIRED', message: 'Subscription is not active' },
        { status: 402 }
      );
    }

    // Step 7: Check expiry
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'SUBSCRIPTION_EXPIRED', message: `Subscription expired on ${subscription.expires_at}` },
        { status: 402 }
      );
    }

    // Step 8: Check existing activation
    const existingActivation = await getActivation(license.id, ip_address);
    if (existingActivation) {
      await updateActivationLastSeen(existingActivation.id);

      return NextResponse.json({
        valid: true,
        license_key: license.license_key,
        product: { id: product.id, name: product.name, slug: product.slug },
        tier: { id: license.tier_id, name: license.tier_name },
        features: license.features,
        subscription: {
          status: subscription.status,
          expires_at: subscription.expires_at,
          auto_renew: subscription.auto_renew,
        },
        activation: {
          ip_address: existingActivation.ip_address,
          hostname: existingActivation.hostname,
          activated_at: existingActivation.activated_at,
          last_seen_at: new Date().toISOString(),
        },
      });
    }

    // Step 9: Check activation limit
    const activationCount = await countActivations(license.id);
    if (activationCount >= license.max_ips) {
      return NextResponse.json(
        { error: 'ACTIVATION_LIMIT_REACHED', message: `Maximum activations (${license.max_ips}) reached` },
        { status: 403 }
      );
    }

    // Step 10: Create new activation
    const activation = await createActivation(license.id, ip_address, hostname, machine_fingerprint);

    // Step 11: Return success
    return NextResponse.json({
      valid: true,
      license_key: license.license_key,
      product: { id: product.id, name: product.name, slug: product.slug },
      tier: { id: license.tier_id, name: license.tier_name },
      features: license.features,
      subscription: {
        status: subscription.status,
        expires_at: subscription.expires_at,
        auto_renew: subscription.auto_renew,
      },
      activation: {
        ip_address: activation.ip_address,
        hostname: activation.hostname,
        activated_at: activation.activated_at,
        last_seen_at: activation.last_seen_at,
      },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
