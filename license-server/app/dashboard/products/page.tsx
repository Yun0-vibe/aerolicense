import { getAllProducts } from '@/lib/db';
import { formatDate } from '@/lib/helpers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/dashboard/products/${product.id}`}>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{product.slug}</p>
              {product.description && (
                <p className="text-sm text-gray-600 mt-2">{product.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-4">Created {formatDate(product.created_at)}</p>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="text-gray-500 col-span-3">No products yet</p>
        )}
      </div>
    </div>
  );
}
