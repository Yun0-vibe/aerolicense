import { getProductById, getTiersByProduct } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  const tiers = await getTiersByProduct(params.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-500 mb-6">{product.slug}</p>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Product Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Version</dt>
            <dd className="font-medium">{product.version || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Created</dt>
            <dd className="font-medium">{formatDate(product.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tiers</h2>
        {tiers.length === 0 ? (
          <p className="text-gray-500">No tiers configured</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold">{tier.name}</h3>
                <p className="text-sm text-gray-500">{tier.slug}</p>
                <div className="mt-4 space-y-1">
                  <p className="text-sm">Monthly: {formatCurrency(tier.price_monthly)}</p>
                  <p className="text-sm">Yearly: {formatCurrency(tier.price_yearly)}</p>
                  <p className="text-sm">Max IPs: {tier.max_ips}</p>
                  <p className="text-sm">Max Activations: {tier.max_activations}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
