'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AuctionListItem } from '@/app/actions/auctions';

function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const isUrgent = remaining < 60 * 60 * 1000; // < 1 hour

  if (remaining === 0) {
    return <span className="text-zinc-500 text-xs font-mono">Ended</span>;
  }

  return (
    <span className={`text-xs font-mono font-bold tracking-widest ${isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </span>
  );
}

interface AuctionCardProps {
  auction: AuctionListItem;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const currentPrice = auction.topBid > 0 ? auction.topBid : auction.startingBid;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-600 hover:shadow-red-900/10 transition-all duration-200 flex flex-col group"
    >
      {/* Image */}
      <div className="aspect-video overflow-hidden bg-zinc-950 relative">
        {auction.car.imageData ? (
          <img
            src={auction.car.imageData}
            alt={`${auction.car.brand} ${auction.car.carModel}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Live badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-900/80 text-red-300 text-[10px] font-bold uppercase tracking-wider border border-red-700/60 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          Live
        </span>

        {/* Countdown top-right */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 border border-zinc-700/60 backdrop-blur-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <Countdown endsAt={auction.endsAt} />
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 space-y-1">
        <p className="text-white font-semibold text-sm leading-tight">{auction.car.brand}</p>
        <p className="text-zinc-400 text-sm">{auction.car.carModel}</p>
        <p className="text-zinc-500 text-xs">{auction.car.size} · {auction.car.condition}</p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">
            {auction.topBid > 0 ? `Top bid · ${auction.bidCount} bid${auction.bidCount !== 1 ? 's' : ''}` : 'Starting bid'}
          </p>
          <p className="text-red-400 font-bold text-sm">৳{currentPrice.toLocaleString()}</p>
        </div>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/profile/${auction.seller.username}`;
          }}
          className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors cursor-pointer"
        >
          by <span className="text-zinc-300 font-medium hover:text-red-400 transition-colors">@{auction.seller.username}</span>
        </span>
      </div>
    </Link>
  );
}
