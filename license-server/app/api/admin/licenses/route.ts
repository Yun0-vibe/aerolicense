import { NextRequest, NextResponse } from 'next/server';
import { getAllLicenses, createLicense, revokeLicense } from '@/lib/db';
import { generateLicenseKey } from '@/lib/license';

export async function GET() {
  try {
    const licenses = await getAllLicenses();
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Admin licenses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription_id, product_id, tier_id, max_ips, features, tier_name, product_slug } = body;

    if (!subscription_id || !product_id || !tier_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const licenseKey = generateLicenseKey(product_slug || 'product');

    const license = await createLicense({
      subscriptionId: subscription_id,
      licenseKey,
      productId: product_id,
      tierId: tier_id,
      maxIps: max_ips || 1,
      features: features || {},
      tierName: tier_name || 'default',
    });

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    console.error('Admin licenses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'revoke') {
      const license = await revokeLicense(id, reason || 'Revoked by admin');
      return NextResponse.json({ license });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin licenses PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
