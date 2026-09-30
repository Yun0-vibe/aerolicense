import { getDashboardStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Customers</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Licenses</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalLicenses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Subscriptions</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalSubscriptions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue Chart</h2>
        <p className="text-gray-500">Revenue analytics will appear here once you have orders.</p>
      </div>
    </div>
  );
}
