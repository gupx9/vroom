'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleCarStatus, deleteCar } from '@/app/actions/garage';
import { listItemForSale, unlistItemFromSale } from '@/app/actions/marketplace';
import SetPriceModal from './SetPriceModal';
import QuickTradeIntentModal from './QuickTradeIntentModal';

interface GarageCardProps {
  id: string;
  imageData: string;
  brand: string;
  carModel: string;
  size: string;
  condition: string;
  price: number;
  sellingPrice: number;
  forSale: boolean;
  forTrade: boolean;
}

export default function GarageCard({
  id,
  imageData,
  brand,
  carModel,
  size,
  condition,
  price,
  sellingPrice: initialSellingPrice,
  forSale: initialForSale,
  forTrade: initialForTrade,
}: GarageCardProps) {
  const router = useRouter();
  const [forSale, setForSale] = useState(initialForSale);
  const [forTrade, setForTrade] = useState(initialForTrade);
  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice);
  const [deleting, setDeleting] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);
  const [showQuickTradeModal, setShowQuickTradeModal] = useState(false);

  const handleForSaleClick = async () => {
    if (forSale) {
      // Turn off — unlist from marketplace
      setForSale(false);
      setSellingPrice(0);
      await unlistItemFromSale(id, 'car');
    } else {
      // Turn on — open modal to set price first
      setShowPriceModal(true);
    }
  };

  const handleConfirmPrice = async (price: number) => {
    setListingLoading(true);
    const res = await listItemForSale(id, 'car', price);
    if (!res?.error) {
      setForSale(true);
      setSellingPrice(price);
    }
    setListingLoading(false);
    setShowPriceModal(false);
  };

  const handleDelete = async () => {
    if (!confirm('Remove this car from your garage?')) return;
    setDeleting(true);
    await deleteCar(id);
  };

  const handleToggleTrade = async () => {
    if (forTrade) {
      setForTrade(false);
      await toggleCarStatus(id, 'forTrade');
      return;
    }

    setForTrade(true);
    await toggleCarStatus(id, 'forTrade');
    setShowQuickTradeModal(true);
  };

  const handleQuickTradeSubmit = async (wantDescription: string) => {
    const res = await fetch('/api/trading/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offeredCarIds: [id],
        wantDescription,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? 'Failed to post trade offer');
    }

    setShowQuickTradeModal(false);
    router.push('/trading?tab=offers&sub=sent');
  };

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-700 transition-colors flex flex-col group">
        {/* Car image */}
        <div className="aspect-video overflow-hidden bg-zinc-950 relative">
          <img
            src={imageData}
            alt={`${brand} ${carModel}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-zinc-400 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
          {/* Scale badge */}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
            {size}
          </span>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 space-y-1.5">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{brand}</p>
            <p className="text-zinc-400 text-sm">{carModel}</p>
          </div>
          <p className="text-zinc-500 text-xs">{condition}</p>
          {price > 0 && (
            <p className="text-zinc-500 text-xs font-medium">Bought at ৳{price.toLocaleString()}</p>
          )}
          {forSale && sellingPrice > 0 && (
            <p className="text-green-400 text-xs font-semibold">Listed at ৳{sellingPrice.toLocaleString()}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-3">
            <button
              onClick={handleForSaleClick}
              disabled={listingLoading}
              className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-all duration-200 disabled:opacity-60 ${
                forSale
                  ? 'bg-green-600 border-green-500 text-white shadow-[0_0_14px_rgba(34,197,94,0.35)]'
                  : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
              }`}
            >
              For Sale
            </button>
            <button
              onClick={handleToggleTrade}
              className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                forTrade
                  ? 'bg-green-600 border-green-500 text-white shadow-[0_0_14px_rgba(34,197,94,0.35)]'
                  : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
              }`}
            >
              For Trade
            </button>
          </div>
        </div>
      </div>

      {showPriceModal && (
        <SetPriceModal
          itemName={`${brand} ${carModel}`}
          onConfirm={handleConfirmPrice}
          onClose={() => setShowPriceModal(false)}
          loading={listingLoading}
        />
      )}

      {showQuickTradeModal && (
        <QuickTradeIntentModal
          onClose={() => setShowQuickTradeModal(false)}
          onSubmit={handleQuickTradeSubmit}
        />
      )}
    </>
  );
}
