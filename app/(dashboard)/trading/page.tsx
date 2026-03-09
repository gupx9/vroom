import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TradingPage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { bannedUntil: true },
  });

  const bannedUntil = currentUser?.bannedUntil;
  const isBanned = bannedUntil && bannedUntil > new Date();
  const daysLeft = isBanned
    ? Math.max(1, Math.ceil((bannedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Trading</h1>
        <p className="text-zinc-400 mt-1 text-sm">Propose and manage car trades</p>
      </div>
      {isBanned ? (
        <div className="pt-8">
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-6 flex items-start gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <div>
              <p className="text-red-400 font-bold text-lg">Account Restricted</p>
              <p className="text-red-300/70 text-sm mt-1">
                Your account is banned for{' '}
                <span className="font-semibold text-red-400">{daysLeft} more {daysLeft === 1 ? 'day' : 'days'}</span>.
                You cannot participate in trading during this period.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-8 text-center text-zinc-600 py-24">
          <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3 4 7l4 4" />
            <path d="M4 7h16" />
            <path d="m16 21 4-4-4-4" />
            <path d="M20 17H4" />
          </svg>
          <p className="text-lg font-medium text-zinc-500">Coming soon</p>
          <p className="text-sm mt-1 text-zinc-600">Trade offers for your garage cars will appear here</p>
        </div>
      )}
    </div>
  );
}
