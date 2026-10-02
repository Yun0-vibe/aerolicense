import crypto from 'crypto';

// Candidate env var names in priority order. Unprefixed names are the
// standard ones; aerolicense_-prefixed names are auto-created when the
// Neon/Vercel integration is connected with a prefix.
const DATABASE_URL_CANDIDATES = [
  'POSTGRES_URL',
  'aerolicense_POSTGRES_URL',
  'DATABASE_URL',
  'aerolicense_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'aerolicense_POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'aerolicense_POSTGRES_URL_NON_POOLING',
];

export function firstEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

export function resolveDatabaseUrl(): string | undefined {
  return firstEnv(DATABASE_URL_CANDIDATES);
}

// NextAuth requires a secret in production. Prefer NEXTAUTH_SECRET; fall
// back to a value derived from the database URL (itself secret, never
// committed) so the app boots even if NEXTAUTH_SECRET was never added.
// Set a real NEXTAUTH_SECRET when you can — this is a convenience fallback.
export function getAuthSecret(): string | undefined {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) return undefined;
  console.warn(
    '[auth] NEXTAUTH_SECRET is not set — using a derived fallback. ' +
      'Set NEXTAUTH_SECRET in your environment for production use.'
  );
  return crypto.createHash('sha256').update(`aerovibe-auth:${dbUrl}`).digest('hex');
}
