'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PlaceBidModal from './PlaceBidModal';
import type { AuctionDetail } from '@/app/actions/auctions';

function Countdown({ endsAt, onExpired }: { endsAt: string; onExpired?: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setRemaining(r);
      if (r === 0 && onExpired) onExpired();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpired]);

  const totalSeconds = Math.floor(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = remaining < 60 * 60 * 1000;
  const ended = remaining === 0;

  return (
    <div className={`text-center ${isUrgent && !ended ? 'animate-pulse' : ''}`}>
      {ended ? (
        <p className="text-2xl font-black font-mono text-zinc-500">ENDED</p>
      ) : (
        <p className={`text-3xl font-black font-mono tracking-widest ${isUrgent ? 'text-red-400' : 'text-white'}`}>
          {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
        </p>
      )}
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">{ended ? 'Auction over' : 'Time remaining'}</p>
    </div>
  );
}

interface CarInfoProps {
  car: AuctionDetail['car'];
  seller: AuctionDetail['seller'];
}

function CarInfoPanel({ car, seller }: CarInfoProps) {
  return (
    <div className="space-y-5">
      {/* Car image */}
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
        {car.imageData ? (
          <img src={car.imageData} alt={`${car.brand} ${car.carModel}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Car details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{car.brand} <span className="text-zinc-300">{car.carModel}</span></h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Listed by{' '}
            <Link href={`/profile/${seller.username}`} className="text-zinc-300 hover:text-red-400 transition-colors font-medium">
              @{seller.username}
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Scale" value={car.size} />
          <InfoField label="Condition" value={car.condition} />
          {car.price > 0 && <InfoField label="Estimated Value" value={`৳${car.price.toLocaleString()}`} />}
        </div>

        {car.description && (
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Description</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{car.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

interface Props {
  auction: AuctionDetail;
  currentUserId: string;
}

export default function AuctionDetailView({ auction, currentUserId }: Props) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [timerExpired, setTimerExpired] = useState(() => new Date() >= new Date(auction.endsAt));

  const isOwner = currentUserId === auction.sellerId;
  const isFinalized = auction.finalized;
  const topBid = auction.bids[0];
  const myBid = auction.myBid;

  // ─── Finalized / winner view ───────────────────────────────────────────────
  if (isFinalized) {
    return (
      <div className="space-y-6">
        {/* Winner banner */}
        {auction.winner ? (
          <div className="bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-amber-700/50 rounded-2xl p-6 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-amber-400">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p className="text-amber-300 font-bold text-xl">Auction Ended</p>
            </div>
            <p className="text-zinc-300 text-sm">
              <Link href={`/profile/${auction.winner.username}`} className="text-amber-400 font-bold hover:underline">
                @{auction.winner.username}
              </Link>
              {' '}won this auction
              {topBid && <span className="text-amber-300/80"> with a bid of <span className="font-bold">৳{topBid.amount.toLocaleString()}</span></span>}
            </p>
            {currentUserId === auction.winnerId && (
              <p className="text-green-400 text-xs font-semibold mt-2 pt-2 border-t border-amber-800/50">
                🎉 Congratulations! This car has been added to your garage.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-400 font-semibold">Auction ended with no bids</p>
            <p className="text-zinc-600 text-sm mt-1">The car was returned to the owner's garage.</p>
          </div>
        )}

        {/* Car info */}
        <CarInfoPanel car={auction.car} seller={auction.seller} />

        {/* Final leaderboard */}
        {auction.bids.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Final Bids</p>
            </div>
            <BidLeaderboard bids={auction.bids} winnerId={auction.winnerId} />
          </div>
        )}
      </div>
    );
  }

  // ─── Active auction layout ─────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Left — Car info (70%) */}
      <div>
        <CarInfoPanel car={auction.car} seller={auction.seller} />
      </div>

      {/* Right — Auction panel (30%) */}
      <div className="space-y-4">
        {/* Countdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
          <Countdown endsAt={auction.endsAt} onExpired={() => setTimerExpired(true)} />
          {timerExpired && !isFinalized && (
            <p className="text-xs text-zinc-600 mt-2">Refresh the page to see the result</p>
          )}
        </div>

        {/* Top bidder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Top Bidder</p>
          {topBid ? (
            <div className="flex items-center justify-between">
              <Link href={`/profile/${topBid.bidder.username}`} className="text-white font-bold text-sm hover:text-red-400 transition-colors">
                @{topBid.bidder.username}
              </Link>
              <span className="text-red-400 font-black text-lg">৳{topBid.amount.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-zinc-500 text-sm">No bids yet</p>
              <p className="text-zinc-600 text-xs mt-0.5">Starting at ৳{auction.startingBid.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Your bid card */}
        {!isOwner && !timerExpired && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Your Bid</p>
            {myBid ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Current amount</span>
                  <span className="text-white font-bold text-lg">৳{myBid.toLocaleString()}</span>
                </div>
                {topBid && myBid === topBid.amount && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    You&apos;re the top bidder!
                  </div>
                )}
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Raise Bid
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-500 text-sm text-center py-1">You haven&apos;t placed a bid yet</p>
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Place Bid
                </button>
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-xs italic">This is your auction — you can&apos;t bid on it</p>
          </div>
        )}

        {/* Bid leaderboard */}
        {auction.bids.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bid Leaderboard</p>
            </div>
            <BidLeaderboard bids={auction.bids} currentUserId={currentUserId} />
          </div>
        )}
      </div>

      {/* Place bid modal */}
      {showBidModal && (
        <PlaceBidModal
          auctionId={auction.id}
          currentTopBid={topBid?.amount ?? 0}
          myCurrentBid={myBid}
          startingBid={auction.startingBid}
          onClose={() => setShowBidModal(false)}
        />
      )}
    </div>
  );
}

// ─── Shared bid leaderboard ───────────────────────────────────────────────────

function BidLeaderboard({
  bids,
  currentUserId,
  winnerId,
}: {
  bids: AuctionDetail['bids'];
  currentUserId?: string;
  winnerId?: string | null;
}) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="divide-y divide-zinc-800/60">
      {bids.map((bid, i) => {
        const isMe = currentUserId && bid.bidderId === currentUserId;
        const isWinner = winnerId && bid.bidderId === winnerId;
        return (
          <div
            key={bid.id}
            className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-red-950/20' : ''} ${isWinner ? 'bg-amber-950/20' : ''}`}
          >
            <span className="w-5 text-center text-sm shrink-0">
              {i < 3 ? medals[i] : <span className="text-zinc-600 text-xs font-bold">{i + 1}</span>}
            </span>
            <Link
              href={`/profile/${bid.bidder.username}`}
              className={`flex-1 text-sm font-medium hover:text-red-400 transition-colors truncate ${isMe ? 'text-red-300' : 'text-zinc-300'}`}
            >
              @{bid.bidder.username}
              {isMe && <span className="ml-1.5 text-[10px] text-red-400/70 font-normal">(you)</span>}
            </Link>
            <span className={`text-sm font-bold shrink-0 ${isWinner ? 'text-amber-400' : 'text-zinc-300'}`}>
              ৳{bid.amount.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
