import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getProductById, getTiersByProduct } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, tier_id, customer_email, success_url, cancel_url } = body;

    if (!product_id || !tier_id || !customer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await getProductById(product_id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const tiers = await getTiersByProduct(product_id);
    const tier = tiers.find((t: any) => t.id === tier_id);
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    const session = await createCheckoutSession({
      customerEmail: customer_email,
      tierName: tier.name,
      productName: product.name,
      amount: tier.price_monthly,
      successUrl: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancelUrl: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: {
        product_id,
        tier_id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
