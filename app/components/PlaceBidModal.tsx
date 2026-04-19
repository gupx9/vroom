'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placeBid } from '@/app/actions/auctions';

interface Props {
  auctionId: string;
  currentTopBid: number;
  myCurrentBid: number | null;
  startingBid: number;
  onClose: () => void;
}

export default function PlaceBidModal({ auctionId, currentTopBid, myCurrentBid, startingBid, onClose }: Props) {
  const router = useRouter();
  const minBid = Math.max(currentTopBid > 0 ? currentTopBid + 1 : startingBid, startingBid);
  const [amount, setAmount] = useState(String(minBid));
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (parsed <= currentTopBid) {
      setError(`Bid must be greater than ৳${currentTopBid.toLocaleString()}`);
      return;
    }
    if (currentTopBid === 0 && parsed < startingBid) {
      setError(`Bid must be at least the starting bid of ৳${startingBid.toLocaleString()}`);
      return;
    }
    setError('');
    startTransition(async () => {
      const res = await placeBid(auctionId, parsed);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-32">
      <div className="flex w-full max-w-sm max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <div>
            <h2 className="text-white text-lg font-bold">
              {myCurrentBid ? 'Raise Your Bid' : 'Place a Bid'}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {myCurrentBid
                ? `Your current bid: ৳${myCurrentBid.toLocaleString()}`
                : 'Enter your bid amount'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Current top bid info */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Current top bid</span>
            <span className="text-white font-bold text-sm">
              {currentTopBid > 0 ? `৳${currentTopBid.toLocaleString()}` : `৳${startingBid.toLocaleString()} (start)`}
            </span>
          </div>

          {/* Bid input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Your bid (৳) — minimum ৳{minBid.toLocaleString()}
            </label>
            <input
              type="number"
              min={minBid}
              step="any"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Placing…
                </>
              ) : myCurrentBid ? 'Raise Bid' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
