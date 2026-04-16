import { notFound, redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getAuctionDetail } from '@/app/actions/auctions';
import AuctionDetailView from '@/app/components/AuctionDetailView';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuctionDetailPage({ params }: Props) {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const { id } = await params;
  const result = await getAuctionDetail(id);

  if ('error' in result) {
    if (result.error === 'Auction not found') notFound();
    return null;
  }

  const { auction, currentUserId } = result;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/auctions" className="hover:text-zinc-300 transition-colors">Auctions</Link>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="text-zinc-300 font-medium truncate max-w-[200px]">
          {auction.car.brand} {auction.car.carModel}
        </span>
        {auction.finalized && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest font-bold border border-zinc-700">
            Ended
          </span>
        )}
      </div>

      <AuctionDetailView auction={auction} currentUserId={currentUserId} />
    </div>
  );
}
