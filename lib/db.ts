import { sql } from '@vercel/postgres';

export async function query(text: string, params?: any[]) {
  const result = await sql.query(text, params);
  return result;
}

// Product queries
export async function getProductBySlug(slug: string) {
  const result = await query('SELECT * FROM products WHERE slug = $1', [slug]);
  return result.rows[0];
}

export async function getProductById(id: string) {
  const result = await query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getAllProducts() {
  const result = await query('SELECT * FROM products ORDER BY name');
  return result.rows;
}

export async function createProduct(data: {
  name: string;
  slug: string;
  description?: string;
  version?: string;
  apiKey: string;
}) {
  const result = await query(
    'INSERT INTO products (name, slug, description, version, api_key) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.name, data.slug, data.description || null, data.version || null, data.apiKey]
  );
  return result.rows[0];
}

// Tier queries
export async function getTiersByProduct(productId: string) {
  const result = await query('SELECT * FROM tiers WHERE product_id = $1 ORDER BY price_monthly', [productId]);
  return result.rows;
}

export async function createTier(data: {
  productId: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  maxIps: number;
  maxActivations: number;
  features: any;
}) {
  const result = await query(
    'INSERT INTO tiers (product_id, name, slug, price_monthly, price_yearly, max_ips, max_activations, features) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [data.productId, data.name, data.slug, data.priceMonthly, data.priceYearly, data.maxIps, data.maxActivations, JSON.stringify(data.features)]
  );
  return result.rows[0];
}

// License queries
export async function getLicenseByKey(key: string) {
  const result = await query('SELECT * FROM licenses WHERE license_key = $1', [key]);
  return result.rows[0];
}

export async function getLicenseById(id: string) {
  const result = await query('SELECT * FROM licenses WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getLicensesBySubscription(subscriptionId: string) {
  const result = await query('SELECT * FROM licenses WHERE subscription_id = $1', [subscriptionId]);
  return result.rows;
}

export async function getAllLicenses(limit = 50, offset = 0) {
  const result = await query(
    'SELECT l.*, p.name as product_name, p.slug as product_slug FROM licenses l JOIN products p ON l.product_id = p.id ORDER BY l.created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

export async function createLicense(data: {
  subscriptionId: string;
  licenseKey: string;
  productId: string;
  tierId: string;
  maxIps: number;
  features: any;
  tierName: string;
}) {
  const result = await query(
    'INSERT INTO licenses (subscription_id, license_key, product_id, tier_id, max_ips, features, tier_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.subscriptionId, data.licenseKey, data.productId, data.tierId, data.maxIps, JSON.stringify(data.features), data.tierName]
  );
  return result.rows[0];
}

export async function revokeLicense(id: string, reason: string) {
  const result = await query(
    'UPDATE licenses SET status = $1, revoked_at = NOW(), revoke_reason = $2 WHERE id = $3 RETURNING *',
    ['revoked', reason, id]
  );
  return result.rows[0];
}

// Subscription queries
export async function getSubscription(id: string) {
  const result = await query('SELECT * FROM subscriptions WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getSubscriptionsByCustomer(customerId: string) {
  const result = await query('SELECT * FROM subscriptions WHERE customer_id = $1', [customerId]);
  return result.rows;
}

export async function getAllSubscriptions() {
  const result = await query(`
    SELECT s.*, c.name as customer_name, c.email as customer_email, t.name as tier_name, p.name as product_name
    FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    JOIN tiers t ON s.tier_id = t.id
    JOIN products p ON t.product_id = p.id
    ORDER BY s.created_at DESC
  `);
  return result.rows;
}

export async function createSubscription(data: {
  customerId: string;
  tierId: string;
  stripeSubscriptionId?: string;
  expiresAt?: Date;
}) {
  const result = await query(
    'INSERT INTO subscriptions (customer_id, tier_id, stripe_subscription_id, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.customerId, data.tierId, data.stripeSubscriptionId || null, data.expiresAt || null]
  );
  return result.rows[0];
}

// Customer queries
export async function getCustomerByEmail(email: string) {
  const result = await query('SELECT * FROM customers WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getCustomerById(id: string) {
  const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getAllCustomers() {
  const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
  return result.rows;
}

export async function createCustomer(data: { email: string; name?: string; company?: string }) {
  const result = await query(
    'INSERT INTO customers (email, name, company) VALUES ($1, $2, $3) RETURNING *',
    [data.email, data.name || null, data.company || null]
  );
  return result.rows[0];
}

// Activation queries
export async function getActivation(licenseId: string, ip: string) {
  const result = await query(
    'SELECT * FROM activations WHERE license_id = $1 AND ip_address = $2',
    [licenseId, ip]
  );
  return result.rows[0];
}

export async function countActivations(licenseId: string) {
  const result = await query(
    'SELECT COUNT(*) FROM activations WHERE license_id = $1 AND is_active = true',
    [licenseId]
  );
  return parseInt(result.rows[0].count);
}

export async function createActivation(licenseId: string, ip: string, hostname: string, fingerprint: string) {
  const result = await query(
    'INSERT INTO activations (license_id, ip_address, hostname, machine_fingerprint) VALUES ($1, $2, $3, $4) RETURNING *',
    [licenseId, ip, hostname, fingerprint]
  );
  return result.rows[0];
}

export async function updateActivationLastSeen(id: string) {
  await query('UPDATE activations SET last_seen_at = NOW() WHERE id = $1', [id]);
}

export async function deactivateActivation(id: string) {
  await query('UPDATE activations SET is_active = false WHERE id = $1', [id]);
}

// Order queries
export async function createOrder(data: { customerId: string; tierId: string; amount: number; stripeSessionId?: string }) {
  const result = await query(
    'INSERT INTO orders (customer_id, tier_id, amount, stripe_session_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.customerId, data.tierId, data.amount, data.stripeSessionId || null]
  );
  return result.rows[0];
}

export async function getAllOrders() {
  const result = await query(`
    SELECT o.*, c.name as customer_name, c.email as customer_email, t.name as tier_name, p.name as product_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN tiers t ON o.tier_id = t.id
    JOIN products p ON t.product_id = p.id
    ORDER BY o.created_at DESC
  `);
  return result.rows;
}

// Admin user queries
export async function getAdminByEmail(email: string) {
  const result = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function createAdmin(data: { email: string; passwordHash: string; name?: string }) {
  const result = await query(
    'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
    [data.email, data.passwordHash, data.name || null]
  );
  return result.rows[0];
}

// Dashboard stats
export async function getDashboardStats() {
  const [products, customers, licenses, subscriptions, orders] = await Promise.all([
    query('SELECT COUNT(*) FROM products'),
    query('SELECT COUNT(*) FROM customers'),
    query('SELECT COUNT(*) FROM licenses'),
    query('SELECT COUNT(*) FROM subscriptions'),
    query('SELECT COUNT(*) FROM orders'),
  ]);

  return {
    totalProducts: parseInt(products.rows[0].count),
    totalCustomers: parseInt(customers.rows[0].count),
    totalLicenses: parseInt(licenses.rows[0].count),
    totalSubscriptions: parseInt(subscriptions.rows[0].count),
    totalOrders: parseInt(orders.rows[0].count),
  };
}
