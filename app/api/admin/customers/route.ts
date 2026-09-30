import { NextRequest, NextResponse } from 'next/server';
import { getAllCustomers, createCustomer } from '@/lib/db';

export async function GET() {
  try {
    const customers = await getAllCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Admin customers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, company } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const customer = await createCustomer({ email, name, company });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Admin customers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
