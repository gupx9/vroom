'use client';

import { useState } from 'react';
import { toggleCarStatus } from '@/app/actions/garage';

interface GarageCardProps {
  id: string;
  imageData: string;
  description: string;
  forSale: boolean;
  forTrade: boolean;
}

export default function GarageCard({
  id,
  imageData,
  description,
  forSale: initialForSale,
  forTrade: initialForTrade,
}: GarageCardProps) {
  const [forSale, setForSale] = useState(initialForSale);
  const [forTrade, setForTrade] = useState(initialForTrade);

  const handleToggle = async (field: 'forSale' | 'forTrade') => {
    if (field === 'forSale') {
      setForSale((prev) => !prev);
    } else {
      setForTrade((prev) => !prev);
    }
    await toggleCarStatus(id, field);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-700 transition-colors flex flex-col group">
      {/* Car image */}
      <div className="aspect-video overflow-hidden bg-zinc-950">
        <img
          src={imageData}
          alt="Car"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Description */}
      <div className="p-4 flex-1">
        <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">{description}</p>
      </div>

      {/* Action buttons — pill shaped */}
      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={() => handleToggle('forSale')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
            forSale
              ? 'bg-green-600 border-green-500 text-white shadow-[0_0_14px_rgba(34,197,94,0.35)]'
              : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => handleToggle('forTrade')}
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
  );
}
