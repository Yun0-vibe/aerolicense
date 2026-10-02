import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Auth misconfigured (e.g. missing NEXTAUTH_SECRET) — send to login
    // instead of crashing with a 500.
    redirect('/login');
  }

  redirect(session ? '/dashboard' : '/login');
}
