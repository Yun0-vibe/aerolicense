import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/db';
import { generateAPIKey } from '@/lib/license';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Admin products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, version } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const apiKey = generateAPIKey();

    const product = await createProduct({
      name,
      slug,
      description,
      version,
      apiKey,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Admin products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
