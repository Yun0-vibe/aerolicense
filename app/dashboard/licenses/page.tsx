import { getAllLicenses } from '@/lib/db';
import { formatDate, getStatusColor } from '@/lib/helpers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LicensesPage() {
  const licenses = await getAllLicenses();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Licenses</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {licenses.map((license) => (
              <tr key={license.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/dashboard/licenses/${license.id}`} className="text-blue-600 hover:underline font-mono text-sm">
                    {license.license_key}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.product_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.tier_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(license.status)}`}>
                    {license.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(license.created_at)}
                </td>
              </tr>
            ))}
            {licenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No licenses yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
