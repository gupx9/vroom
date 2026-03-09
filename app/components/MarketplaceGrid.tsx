'use client';

import { useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import AddSellPostModal from './AddSellPostModal';

interface MarketplaceCar {
  id: string;
  imageData: string;
  brand: string;
  carModel: string;
  size: string;
  condition: string;
  sellingPrice: number;
  userId: string;
  user: { username: string };
}

interface MarketplaceDiorama {
  id: string;
  imageData: string | null;
  description: string;
  sellingPrice: number;
  userId: string;
  user: { username: string };
}

interface MarketplaceGridProps {
  cars: MarketplaceCar[];
  dioramas: MarketplaceDiorama[];
  bannedUntil?: string | null;
}

export default function MarketplaceGrid({ cars, dioramas, bannedUntil }: MarketplaceGridProps) {
  const [showSellModal, setShowSellModal] = useState(false);
  const totalListings = cars.length + dioramas.length;

  const isBanned = bannedUntil ? new Date(bannedUntil) > new Date() : false;
  const daysLeft = isBanned
    ? Math.max(1, Math.ceil((new Date(bannedUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div>
      {/* Ban notice */}
      {isBanned && (
        <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <div>
            <p className="text-red-400 font-semibold text-sm">Account Restricted</p>
            <p className="text-red-300/70 text-xs mt-0.5">
              Your account is banned for{' '}
              <span className="font-semibold text-red-400">{daysLeft} more {daysLeft === 1 ? 'day' : 'days'}</span>.
              You cannot post sell listings during this period, but you can still browse and buy.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">
          {totalListings > 0 ? `${totalListings} listing${totalListings !== 1 ? 's' : ''} available` : 'No listings yet'}
        </p>
        {!isBanned && (
          <button
            onClick={() => setShowSellModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Sell Post
          </button>
        )}
      </div>

      {/* Empty state */}
      {totalListings === 0 && (
        <div className="pt-16 text-center text-zinc-600 py-24">
          <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p className="text-lg font-medium text-zinc-500">No listings yet</p>
          <p className="text-sm mt-1 text-zinc-600">Be the first to list an item — click &ldquo;Add Sell Post&rdquo;</p>
        </div>
      )}

      {/* Cars section */}
      {cars.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Cars <span className="text-zinc-700">({cars.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cars.map((car) => (
              <MarketplaceCard
                key={car.id}
                id={car.id}
                type="car"
                imageData={car.imageData}
                title={car.brand}
                subtitle={car.carModel}
                condition={car.condition}
                sellingPrice={car.sellingPrice}
                sellerUsername={car.user.username}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dioramas section */}
      {dioramas.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Dioramas <span className="text-zinc-700">({dioramas.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {dioramas.map((d) => (
              <MarketplaceCard
                key={d.id}
                id={d.id}
                type="diorama"
                imageData={d.imageData}
                title={d.description}
                sellingPrice={d.sellingPrice}
                sellerUsername={d.user.username}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Sell Post Modal */}
      {showSellModal && <AddSellPostModal onClose={() => setShowSellModal(false)} />}
    </div>
  );
}
