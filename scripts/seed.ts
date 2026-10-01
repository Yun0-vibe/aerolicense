import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAPIKey } from '../lib/license';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@aerovibestudio.com' },
    update: {},
    create: {
      email: 'admin@aerovibestudio.com',
      passwordHash: adminPassword,
      name: 'Admin',
      role: 'admin',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create superadmin user (can manage other admin users)
  // Set SEED_SUPERADMIN_PASSWORD in your environment to override the default.
  // Change this password immediately after first login!
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'SuperAdmin123!';
  const superadminHash = await bcrypt.hash(superadminPassword, 10);
  const superadmin = await prisma.adminUser.upsert({
    where: { email: 'superadmin@aerovibestudio.com' },
    update: {},
    create: {
      email: 'superadmin@aerovibestudio.com',
      passwordHash: superadminHash,
      name: 'Super Admin',
      role: 'superadmin',
    },
  });
  console.log('Created superadmin user:', superadmin.email);

  // Create sample product
  const product = await prisma.product.upsert({
    where: { slug: 'aeroddos-protection' },
    update: {},
    create: {
      name: 'AeroDDoS Protection',
      slug: 'aeroddos-protection',
      description: 'Advanced DDoS protection for your infrastructure',
      version: '1.0.0',
      apiKey: generateAPIKey(),
    },
  });
  console.log('Created product:', product.name);

  // Create tiers
  const basicTier = await prisma.tier.upsert({
    where: { productId_slug: { productId: product.id, slug: 'basic' } },
    update: {},
    create: {
      productId: product.id,
      name: 'Basic',
      slug: 'basic',
      priceMonthly: 2900,
      priceYearly: 29000,
      maxIps: 5,
      maxActivations: 1,
      features: {
        max_ips: 5,
        max_activations: 1,
        basic_detection: true,
        advanced_detection: false,
        l7_signatures: false,
        behavior_engine: false,
        metrics_api: false,
        geo_blocking: false,
        alerts: ['email'],
        support: 'community',
        white_label: false,
      },
    },
  });
  console.log('Created tier:', basicTier.name);

  const proTier = await prisma.tier.upsert({
    where: { productId_slug: { productId: product.id, slug: 'professional' } },
    update: {},
    create: {
      productId: product.id,
      name: 'Professional',
      slug: 'professional',
      priceMonthly: 9900,
      priceYearly: 99000,
      maxIps: 50,
      maxActivations: 3,
      features: {
        max_ips: 50,
        max_activations: 3,
        basic_detection: true,
        advanced_detection: true,
        l7_signatures: true,
        behavior_engine: true,
        metrics_api: true,
        geo_blocking: true,
        alerts: ['email', 'slack', 'webhook'],
        support: 'priority',
        white_label: false,
      },
    },
  });
  console.log('Created tier:', proTier.name);

  const enterpriseTier = await prisma.tier.upsert({
    where: { productId_slug: { productId: product.id, slug: 'enterprise' } },
    update: {},
    create: {
      productId: product.id,
      name: 'Enterprise',
      slug: 'enterprise',
      priceMonthly: 29900,
      priceYearly: 299000,
      maxIps: 500,
      maxActivations: 10,
      features: {
        max_ips: 500,
        max_activations: 10,
        basic_detection: true,
        advanced_detection: true,
        l7_signatures: true,
        behavior_engine: true,
        metrics_api: true,
        geo_blocking: true,
        alerts: ['email', 'slack', 'webhook', 'sms'],
        support: 'dedicated',
        white_label: true,
      },
    },
  });
  console.log('Created tier:', enterpriseTier.name);

  console.log('Seeding complete!');
  console.log('');
  console.log('Admin login:');
  console.log('  Email: admin@aerovibestudio.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Superadmin login (can manage users at /dashboard/admins):');
  console.log('  Email: superadmin@aerovibestudio.com');
  console.log('  Password: ' + superadminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
