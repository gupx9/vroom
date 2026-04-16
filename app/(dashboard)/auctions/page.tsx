import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getActiveAuctions } from '@/app/actions/auctions';
import AuctionsGrid from '@/app/components/AuctionsGrid';

export default async function AuctionsPage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const [{ auctions }, currentUser] = await Promise.all([
    getActiveAuctions(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { bannedUntil: true },
    }),
  ]);

  const bannedUntil = currentUser?.bannedUntil ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Auctions</h1>
        <p className="text-zinc-400 mt-1 text-sm">Live timed auctions — bid to win</p>
      </div>
      <div className="pt-4">
        <AuctionsGrid
          auctions={auctions}
          bannedUntil={bannedUntil ? bannedUntil.toISOString() : null}
        />
      </div>
    </div>
  );
}
