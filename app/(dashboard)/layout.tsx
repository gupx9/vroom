import { logout } from '@/app/actions/auth';
import { verifySession } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session?.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
          VROOM<span className="text-red-600">.IO</span>
        </Link>
        <div className="flex items-center space-x-6">
          <div className="text-sm text-zinc-400">
            Welcome, <span className="text-white font-medium">{user?.username}</span>
          </div>
          <form action={logout}>
            <button 
              type="submit"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[128px] opacity-[0.15] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
