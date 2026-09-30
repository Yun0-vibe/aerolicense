import { NextRequest, NextResponse } from 'next/server';
import { getTiersByProduct, createTier } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const tiers = await getTiersByProduct(productId);
    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Admin tiers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, name, slug, price_monthly, price_yearly, max_ips, max_activations, features } = body;

    if (!product_id || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tier = await createTier({
      productId: product_id,
      name,
      slug,
      priceMonthly: price_monthly || 0,
      priceYearly: price_yearly || 0,
      maxIps: max_ips || 1,
      maxActivations: max_activations || 1,
      features: features || {},
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error) {
    console.error('Admin tiers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
