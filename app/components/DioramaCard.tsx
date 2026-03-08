'use client';

import { useState } from 'react';
import { deleteDiorama, toggleDioramaStatus } from '@/app/actions/garage';

interface DioramaCardProps {
  id: string;
  imageData: string | null;
  description: string;
  price: number;
  forSale: boolean;
  forTrade: boolean;
}

export default function DioramaCard({
  id,
  imageData,
  description,
  price,
  forSale: initialForSale,
  forTrade: initialForTrade,
}: DioramaCardProps) {
  const [forSale, setForSale] = useState(initialForSale);
  const [forTrade, setForTrade] = useState(initialForTrade);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async (field: 'forSale' | 'forTrade') => {
    if (field === 'forSale') setForSale((prev) => !prev);
    else setForTrade((prev) => !prev);
    await toggleDioramaStatus(id, field);
  };

  const handleDelete = async () => {
    if (!confirm('Remove this diorama from your garage?')) return;
    setDeleting(true);
    await deleteDiorama(id);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-700 transition-colors flex flex-col group">
      {/* Image or placeholder */}
      <div className="aspect-video overflow-hidden bg-zinc-950 relative">
        {imageData ? (
          <img
            src={imageData}
            alt="Diorama"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
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
        {/* Diorama badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-700/80 text-white text-[10px] font-bold uppercase tracking-wider">
          Diorama
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 space-y-2">
        <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">{description}</p>
        {price > 0 && (
          <p className="text-zinc-500 text-xs font-medium">৳{price.toLocaleString()}</p>
        )}
      </div>

      {/* Action buttons */}
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
