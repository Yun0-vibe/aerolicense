import { NextResponse } from 'next/server';

// GET /api/health — reports which env vars are present (never their values).
// Use this to verify the deployment picked up your Vercel env variables.
export async function GET() {
  const check = (name: string) => ({
    set: !!process.env[name],
  });

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: check('DATABASE_URL'),
      NEXTAUTH_URL: check('NEXTAUTH_URL'),
      NEXTAUTH_SECRET: check('NEXTAUTH_SECRET'),
      STRIPE_SECRET_KEY: check('STRIPE_SECRET_KEY'),
      STRIPE_WEBHOOK_SECRET: check('STRIPE_WEBHOOK_SECRET'),
      STRIPE_PUBLISHABLE_KEY: check('STRIPE_PUBLISHABLE_KEY'),
      RESEND_API_KEY: check('RESEND_API_KEY'),
      EMAIL_FROM: check('EMAIL_FROM'),
      NEXT_PUBLIC_APP_URL: check('NEXT_PUBLIC_APP_URL'),
      SEED_SUPERADMIN_PASSWORD: check('SEED_SUPERADMIN_PASSWORD'),
    },
  });
}
