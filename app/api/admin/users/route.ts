import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import {
  getAllAdmins,
  getAdminByEmail,
  createAdmin,
  deleteAdminUser,
  updateAdminRole,
  countSuperadmins,
} from '@/lib/db';

async function requireSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'superadmin') {
    return null;
  }
  return session;
}

// GET /api/admin/users — list all admin users (password hashes excluded)
export async function GET() {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
  }

  try {
    const admins = await getAllAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users — create a new admin user
// Body: { email, password, name?, role? }
export async function POST(req: NextRequest) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (role && role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Role must be admin or superadmin' }, { status: 400 });
    }

    const existing = await getAdminByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await createAdmin({
      email,
      passwordHash,
      name,
      role: role || 'admin',
    });

    // Strip the hash before returning
    const { password_hash, ...safe } = admin;
    return NextResponse.json({ admin: safe }, { status: 201 });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users — change a user's role
// Body: { id, role }
export async function PATCH(req: NextRequest) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'id and role are required' }, { status: 400 });
    }
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Role must be admin or superadmin' }, { status: 400 });
    }
    if (id === session.user?.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    // Never demote the last superadmin
    if (role === 'admin') {
      const superadminCount = await countSuperadmins();
      if (superadminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last superadmin' }, { status: 400 });
      }
    }

    const admin = await updateAdminRole(id, role);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=... — remove an admin user
export async function DELETE(req: NextRequest) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (id === session.user?.id) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    // Never delete the last superadmin
    const superadminCount = await countSuperadmins();
    const target = (await getAllAdmins()).find((a: any) => a.id === id);
    if (target?.role === 'superadmin' && superadminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last superadmin' }, { status: 400 });
    }
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await deleteAdminUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
