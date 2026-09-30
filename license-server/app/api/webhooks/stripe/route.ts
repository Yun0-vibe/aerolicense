import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import {
  getCustomerByEmail,
  createCustomer,
  createSubscription,
  createLicense,
  createOrder,
  getProductById,
  getTiersByProduct,
} from '@/lib/db';
import { generateLicenseKey, calculateExpiryDate } from '@/lib/license';
import { sendLicenseEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    const event = constructWebhookEvent(payload, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email!;
        const tierId = session.metadata?.tier_id;
        const productId = session.metadata?.product_id;

        // Get or create customer
        let customer = await getCustomerByEmail(customerEmail);
        if (!customer) {
          customer = await createCustomer({ email: customerEmail });
        }

        // Get product and tier info
        const product = await getProductById(productId);
        const tiers = await getTiersByProduct(productId);
        const tier = tiers.find((t: any) => t.id === tierId);

        if (!product || !tier) {
          console.error('Product or tier not found for checkout session');
          break;
        }

        // Create subscription
        const expiresAt = calculateExpiryDate('monthly');
        const subscription = await createSubscription({
          customerId: customer.id,
          tierId: tier.id,
          stripeSubscriptionId: session.subscription as string,
          expiresAt,
        });

        // Create license
        const licenseKey = generateLicenseKey(product.slug);
        const license = await createLicense({
          subscriptionId: subscription.id,
          licenseKey,
          productId: product.id,
          tierId: tier.id,
          maxIps: tier.max_ips,
          features: tier.features,
          tierName: tier.name,
        });

        // Create order
        await createOrder({
          customerId: customer.id,
          tierId: tier.id,
          amount: tier.price_monthly,
          stripeSessionId: session.id,
        });

        // Send license email
        await sendLicenseEmail({
          to: customerEmail,
          customerName: customer.name || customerEmail,
          productName: product.name,
          tierName: tier.name,
          licenseKey,
          expiresAt: expiresAt.toLocaleDateString(),
        });

        break;
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object;
        // Update subscription status in database
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
