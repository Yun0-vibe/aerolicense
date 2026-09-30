# AeroVibe License Server

Next.js-based license server for all AeroVibe Studio products. Deployed on Vercel with Postgres.

## Features

- **Admin Dashboard** — Manage customers, licenses, products, subscriptions, and orders
- **Public API** — License validation, activation, deactivation, heartbeat
- **Stripe Integration** — Automatic license generation on payment
- **Email Notifications** — License keys sent via Resend
- **Analytics** — Revenue and usage tracking

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values.

### 3. Set up the database

```bash
# Push schema to your Vercel Postgres database
npm run db:push

# Seed with initial data
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Default Admin Credentials

After running the seed script:

- **Email:** admin@aerovibestudio.com
- **Password:** admin123

**Change these immediately in production!**

## API Endpoints

### Public API (called by products)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/validate` | POST | Validate a license key |
| `/api/v1/activate` | POST | Activate a license on a machine |
| `/api/v1/deactivate` | POST | Deactivate a license |
| `/api/v1/heartbeat` | POST | Periodic check-in |

### Admin API (dashboard only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/customers` | GET, POST | List/create customers |
| `/api/admin/licenses` | GET, POST, PATCH | Manage licenses |
| `/api/admin/products` | GET, POST | Manage products |
| `/api/admin/tiers` | GET, POST | Manage tiers |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/stripe` | POST | Stripe events |
| `/api/checkout` | POST | Create checkout session |

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Admin dashboard pages
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── lib/                  # Server-side utilities
│   ├── db.ts            # Database queries
│   ├── auth.ts          # NextAuth config
│   ├── stripe.ts        # Stripe client
│   ├── resend.ts         # Email client
│   ├── license.ts       # License generation
│   └── helpers.ts       # Utilities
├── prisma/
│   └── schema.prisma    # Database schema
└── scripts/
    └── seed.ts          # Database seeder
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Vercel Postgres connection string |
| `NEXTAUTH_URL` | Your app's URL |
| `NEXTAUTH_SECRET` | Random secret for JWT |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender email address |
