export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
        <p className="text-gray-500 mb-4">
          These settings are configured via environment variables in your Vercel project.
        </p>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-700">Database URL</dt>
            <dd className="text-sm text-gray-500 font-mono">DATABASE_URL</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">NextAuth Secret</dt>
            <dd className="text-sm text-gray-500 font-mono">NEXTAUTH_SECRET</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Stripe Secret Key</dt>
            <dd className="text-sm text-gray-500 font-mono">STRIPE_SECRET_KEY</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Stripe Webhook Secret</dt>
            <dd className="text-sm text-gray-500 font-mono">STRIPE_WEBHOOK_SECRET</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Resend API Key</dt>
            <dd className="text-sm text-gray-500 font-mono">RESEND_API_KEY</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Admin Users</h2>
        <p className="text-gray-500">
          Admin users are managed through the database. Use the seed script to create the first admin.
        </p>
      </div>
    </div>
  );
}
