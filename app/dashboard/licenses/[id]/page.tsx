import { getLicenseById } from '@/lib/db';
import { formatDate, getStatusColor } from '@/lib/helpers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LicenseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const license = await getLicenseById(params.id);
  if (!license) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 font-mono">{license.license_key}</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">License Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Product</dt>
            <dd className="font-medium">{license.product_id}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Tier</dt>
            <dd className="font-medium">{license.tier_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(license.status)}`}>
                {license.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Max IPs</dt>
            <dd className="font-medium">{license.max_ips}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Created</dt>
            <dd className="font-medium">{formatDate(license.created_at)}</dd>
          </div>
          {license.revoked_at && (
            <div>
              <dt className="text-sm text-gray-500">Revoked</dt>
              <dd className="font-medium text-red-600">{formatDate(license.revoked_at)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Features</h2>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(license.features, null, 2)}
        </pre>
      </div>
    </div>
  );
}
