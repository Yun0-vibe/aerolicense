import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default stripe;

export async function createCheckoutSession(params: {
  customerEmail: string;
  tierName: string;
  productName: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: params.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: params.amount * 100, // Stripe uses cents
          product_data: {
            name: `${params.productName} — ${params.tierName}`,
            description: `License for ${params.productName}`,
          },
        },
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });

  return session;
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
