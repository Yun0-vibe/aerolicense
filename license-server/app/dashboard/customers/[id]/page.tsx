import { getCustomerById, getSubscriptionsByCustomer } from '@/lib/db';
import { formatDate } from '@/lib/helpers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomerById(params.id);
  if (!customer) notFound();

  const subscriptions = await getSubscriptionsByCustomer(params.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{customer.name || customer.email}</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="font-medium">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Company</dt>
            <dd className="font-medium">{customer.company || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Joined</dt>
            <dd className="font-medium">{formatDate(customer.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p className="text-gray-500">No subscriptions</p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Subscription #{sub.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">Status: {sub.status}</p>
                </div>
                <p className="text-sm text-gray-500">{formatDate(sub.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
