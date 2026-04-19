"use client";

import { useState } from "react";
import AuctionCard from "./AuctionCard";
import CreateAuctionModal from "./CreateAuctionModal";
import type { AuctionListItem } from "@/app/actions/auctions";

interface AuctionsGridProps {
  auctions: AuctionListItem[];
  bannedUntil?: string | null;
}

export default function AuctionsGrid({
  auctions,
  bannedUntil,
}: AuctionsGridProps) {
  const [showModal, setShowModal] = useState(false);

  const isBanned = bannedUntil ? new Date(bannedUntil) > new Date() : false;
  const daysLeft = isBanned
    ? Math.max(
        1,
        Math.ceil(
          (new Date(bannedUntil!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div>
      {/* Ban notice */}
      {isBanned && (
        <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500 shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <div>
            <p className="text-red-400 font-semibold text-sm">
              Account Restricted
            </p>
            <p className="text-red-300/70 text-xs mt-0.5">
              Your account is banned for{" "}
              <span className="font-semibold text-red-400">
                {daysLeft} more {daysLeft === 1 ? "day" : "days"}
              </span>
              . You cannot start or participate in auctions during this period.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">
          {auctions.length > 0
            ? `${auctions.length} active auction${auctions.length !== 1 ? "s" : ""}`
            : "No active auctions"}
        </p>
        {!isBanned && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m14.5 12.5-8 8a2.119 2.119 0 0 1-3-3l8-8" />
              <path d="m16 16 6-6" />
              <path d="m8 8 6-6" />
              <path d="m9 7 8 8" />
              <path d="m21 11-8-8" />
            </svg>
            Start Auction
          </button>
        )}
      </div>

      {/* Empty state */}
      {auctions.length === 0 && (
        <div className="pt-16 text-center text-zinc-600 py-24">
          <svg
            className="mx-auto mb-4 opacity-40"
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m14.5 12.5-8 8a2.119 2.119 0 0 1-3-3l8-8" />
            <path d="m16 16 6-6" />
            <path d="m8 8 6-6" />
            <path d="m9 7 8 8" />
            <path d="m21 11-8-8" />
          </svg>
          <p className="text-lg font-medium text-zinc-500">No live auctions</p>
          <p className="text-sm mt-1 text-zinc-600">
            Be the first — click &ldquo;Start Auction&rdquo; to list a car
          </p>
        </div>
      )}

      {/* Grid */}
      {auctions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}

      {showModal && <CreateAuctionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
