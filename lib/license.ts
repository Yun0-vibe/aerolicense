import crypto from 'crypto';

/**
 * Generate a new license key in the format: AERO-PRODUCT-XXXX
 * where XXXX is a random alphanumeric string.
 */
export function generateLicenseKey(productSlug: string): string {
  const slug = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `AERO-${slug}-${randomPart}`;
}

/**
 * Generate a new product API key.
 */
export function generateAPIKey(): string {
  return `prod_key_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Validate a license key format.
 */
export function isValidKeyFormat(key: string): boolean {
  const pattern = /^AERO-[A-Z0-9]+-[A-Z0-9]{8}$/;
  return pattern.test(key);
}

/**
 * Generate a machine fingerprint from hostname + MAC.
 * This is a server-side version for verification.
 */
export function generateFingerprint(hostname: string, mac: string): string {
  const data = `${hostname}|${mac}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calculate subscription end date based on billing cycle.
 */
export function calculateExpiryDate(billingCycle: 'monthly' | 'yearly', fromDate = new Date()): Date {
  const date = new Date(fromDate);
  if (billingCycle === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
}

/**
 * Mask a license key for display (show only last 4 chars).
 */
export function maskLicenseKey(key: string): string {
  if (key.length <= 4) return '****';
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}
