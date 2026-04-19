'use client';

import Link from 'next/link';

interface MarketplaceCardProps {
  id: string;
  type: 'car' | 'diorama';
  imageData: string | null;
  title: string;
  subtitle?: string;
  condition?: string;
  sellingPrice: number;
  sellerUsername: string;
  onOpenDetails?: () => void;
}

export default function MarketplaceCard({
  imageData,
  title,
  subtitle,
  condition,
  sellingPrice,
  sellerUsername,
  onOpenDetails,
}: MarketplaceCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails?.();
        }
      }}
      className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-600 hover:shadow-red-900/10 transition-all duration-200 flex flex-col group"
    >
      {/* Image */}
      <div className="aspect-video overflow-hidden bg-zinc-950 relative">
        {imageData ? (
          <img
            src={imageData}
            alt={title}
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
        {/* For sale badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-900/80 text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-700/60">
          For Sale
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 space-y-1">
        <p className="text-white font-semibold text-sm leading-tight">{title}</p>
        {subtitle && <p className="text-zinc-400 text-sm">{subtitle}</p>}
        {condition && <p className="text-zinc-500 text-xs">{condition}</p>}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <p className="text-red-400 font-bold text-sm">৳{sellingPrice.toLocaleString()}</p>
        <Link
          href={`/profile/${sellerUsername}`}
          className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          by <span className="text-zinc-300 font-medium hover:text-red-400 transition-colors">@{sellerUsername}</span>
        </Link>
      </div>
    </div>
  );
}
