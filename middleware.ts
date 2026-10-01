import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;

    // Superadmin-only routes: user management UI + API
    if (
      pathname.startsWith('/dashboard/admins') ||
      pathname.startsWith('/api/admin/users')
    ) {
      if (role !== 'superadmin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
