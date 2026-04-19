"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TradeOfferComposerModal, {
  ComposerItem,
} from "./TradeOfferComposerModal";

// ── Types ────────────────────────────────────────────────────────────────────

type ListingCar = {
  id: string;
  type: "car";
  brand: string;
  carModel: string;
  size: string;
  condition: string;
  price: number;
  description?: string;
  imageData: string;
  createdAt: string;
  user: { id: string; username: string; reputation: number };
};

type ListingDiorama = {
  id: string;
  type: "diorama";
  description: string;
  price: number;
  imageData: string | null;
  createdAt: string;
  user: { id: string; username: string; reputation: number };
};

type ListingItem = ListingCar | ListingDiorama;

type ItemMapEntry =
  | {
      type: "car";
      id: string;
      brand: string;
      carModel: string;
      size: string;
      imageData: string;
    }
  | {
      type: "diorama";
      id: string;
      description: string;
      imageData: string | null;
    };

type TradeOffer = {
  id: string;
  offeredCarIds: string[];
  requestedCarIds: string[];
  wantDescription: string | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt: string;
  offerer: { id: string; username: string; reputation: number };
  receiver: { id: string; username: string; reputation: number } | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getListingName(item: ListingItem) {
  if (item.type === "car") return `${item.brand} ${item.carModel}`;
  return item.description.length > 40
    ? item.description.slice(0, 40) + "…"
    : item.description;
}

function getMapItemName(entry: ItemMapEntry) {
  if (entry.type === "car") return `${entry.brand} ${entry.carModel}`;
  const d = entry.description;
  return d.length > 30 ? d.slice(0, 30) + "…" : d;
}

function statusBadge(status: TradeOffer["status"]) {
  const map: Record<TradeOffer["status"], { label: string; cls: string }> = {
    pending: {
      label: "Pending",
      cls: "bg-yellow-900/40 text-yellow-400 border-yellow-700/50",
    },
    accepted: {
      label: "Accepted",
      cls: "bg-green-900/40 text-green-400 border-green-700/50",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-zinc-800 text-zinc-500 border-zinc-700",
    },
    cancelled: {
      label: "Cancelled",
      cls: "bg-zinc-800 text-zinc-500 border-zinc-700",
    },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {label}
    </span>
  );
}

// ── Small item thumbs row ────────────────────────────────────────────────────

function ItemThumbs({
  ids,
  itemMap,
}: {
  ids: string[];
  itemMap: Record<string, ItemMapEntry>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const entry = itemMap[id];
        if (!entry) {
          return (
            <div
              key={id}
              className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center"
              title="Item no longer available"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#52525b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          );
        }
        return (
          <div key={id} className="relative group/thumb">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-700">
              {entry.imageData ? (
                <img
                  src={entry.imageData}
                  alt={getMapItemName(entry)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none z-10">
              {getMapItemName(entry)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Listing Card (browse tab) ────────────────────────────────────────────────

function ListingCard({
  item,
  onMakeOffer,
}: {
  item: ListingItem;
  onMakeOffer: (item: ListingItem) => void;
}) {
  const name = getListingName(item);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-200 flex flex-col group shadow-lg">
      <div className="aspect-video overflow-hidden bg-zinc-950 relative">
        {item.imageData ? (
          <img
            src={item.imageData}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
          {item.type === "car" ? (item as ListingCar).size : "Diorama"}
        </span>
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-700/60">
          For Trade
        </span>
      </div>

      <div className="p-4 flex-1 space-y-1">
        <p className="text-white font-semibold text-sm leading-tight">{name}</p>
        {item.type === "car" && (
          <p className="text-zinc-500 text-xs">
            {(item as ListingCar).condition}
          </p>
        )}
        {item.type === "diorama" && item.description.length > 40 && (
          <p className="text-zinc-500 text-xs line-clamp-2">
            {item.description}
          </p>
        )}
        {item.price > 0 && (
          <p className="text-zinc-500 text-xs font-medium">
            Est. ৳{item.price.toLocaleString()}
          </p>
        )}
        <Link
          href={`/profile/${item.user.username}`}
          className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors block"
        >
          by{" "}
          <span className="text-zinc-300 font-medium hover:text-red-400 transition-colors">
            @{item.user.username}
          </span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => onMakeOffer(item)}
          className="w-full py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold border border-red-500 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3 4 7l4 4" />
            <path d="M4 7h16" />
            <path d="m16 21 4-4-4-4" />
            <path d="M20 17H4" />
          </svg>
          Make Offer
        </button>
      </div>
    </div>
  );
}

// ── Offer Row ────────────────────────────────────────────────────────────────

function OfferRow({
  offer,
  itemMap,
  perspective, // 'sent' | 'received'
  onAccept,
  onReject,
  onDelete,
}: {
  offer: TradeOffer;
  itemMap: Record<string, ItemMapEntry>;
  perspective: "sent" | "received";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const isPending = offer.status === "pending";
  const otherUser = perspective === "sent" ? offer.receiver : offer.offerer;
  const date = new Date(offer.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
      {/* Top row: who + status + date */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">
            {perspective === "sent" ? "To:" : "From:"}
          </span>
          {otherUser ? (
            <Link
              href={`/profile/${otherUser.username}`}
              className="text-white font-medium hover:text-red-400 transition-colors"
            >
              @{otherUser.username}
            </Link>
          ) : (
            <span className="text-zinc-500 italic">Open offer</span>
          )}
          {otherUser && (
            <span className="text-zinc-600 text-xs">
              · ⭐ {otherUser.reputation}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(offer.status)}
          <span className="text-zinc-600 text-xs">{date}</span>
        </div>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            {perspective === "sent" ? "You offered" : "They offered"}
          </p>
          <ItemThumbs ids={offer.offeredCarIds} itemMap={itemMap} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            {perspective === "sent" ? "You want" : "They want"}
          </p>
          {offer.requestedCarIds.length > 0 ? (
            <ItemThumbs ids={offer.requestedCarIds} itemMap={itemMap} />
          ) : offer.wantDescription ? (
            <p className="text-zinc-300 text-xs bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2">
              {offer.wantDescription}
            </p>
          ) : null}
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <p className="text-zinc-400 text-xs bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 italic">
          &ldquo;{offer.message}&rdquo;
        </p>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2 pt-1">
          {perspective === "received" && (
            <>
              <button
                onClick={() => onReject?.(offer.id)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept?.(offer.id)}
                className="flex-1 py-2 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-semibold hover:bg-green-600/30 transition-colors"
              >
                Accept
              </button>
            </>
          )}
          {perspective === "sent" && (
            <button
              onClick={() => onDelete?.(offer.id)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-500 text-xs hover:text-red-400 hover:border-red-800/60 hover:bg-red-950/20 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface TradingClientProps {
  userId: string;
  initialTab?: "browse" | "offers";
  initialOffersSubTab?: "received" | "sent" | "accepted";
}

export default function TradingClient({
  userId,
  initialTab = "browse",
  initialOffersSubTab = "received",
}: TradingClientProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "offers">(initialTab);
  const [offersSubTab, setOffersSubTab] = useState<
    "received" | "sent" | "accepted"
  >(initialOffersSubTab);

  // Browse state
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsTypeFilter, setListingsTypeFilter] = useState<
    "all" | "car" | "diorama"
  >("all");

  // Offers state
  const [sentOffers, setSentOffers] = useState<TradeOffer[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<TradeOffer[]>([]);
  const [itemMap, setItemMap] = useState<Record<string, ItemMapEntry>>({});
  const [offersLoading, setOffersLoading] = useState(false);

  // Modal
  const [composerModal, setComposerModal] = useState<{
    open: boolean;
    requestedItem?: ComposerItem;
    offeredItem?: ComposerItem;
  }>({ open: false });

  const [actionLoading, setActionLoading] = useState<string | null>(null); // offer id

  // ── Fetch listings ──
  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const res = await fetch("/api/trading/listings?limit=50");
      const data = await res.json();
      if (data.success) {
        const cars = (data.cars as ListingCar[]).map((c) => ({
          ...c,
          type: "car" as const,
        }));
        const dioramas = (data.dioramas as ListingDiorama[]).map((d) => ({
          ...d,
          type: "diorama" as const,
        }));
        setListings([...cars, ...dioramas]);
      }
    } finally {
      setListingsLoading(false);
    }
  }, []);

  // ── Fetch offers ──
  const fetchOffers = useCallback(async () => {
    setOffersLoading(true);
    try {
      const res = await fetch("/api/trading/offers");
      const data = await res.json();
      if (data.success) {
        setSentOffers(data.sent as TradeOffer[]);
        setReceivedOffers(data.received as TradeOffer[]);
        setItemMap(data.itemMap as Record<string, ItemMapEntry>);
      }
    } finally {
      setOffersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "browse") fetchListings();
    if (activeTab === "offers") fetchOffers();
  }, [activeTab, fetchListings, fetchOffers]);

  // ── Actions ──
  const patchOffer = async (
    id: string,
    action: "accept" | "reject" | "cancel",
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/trading/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchOffers();
        window.dispatchEvent(new CustomEvent("vroom:notifications:refresh"));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = (id: string) => patchOffer(id, "accept");
  const handleReject = (id: string) => patchOffer(id, "reject");
  const handleDelete = (id: string) => patchOffer(id, "cancel");

  const handleMakeOffer = (item: ListingItem) => {
    const composerItem: ComposerItem = {
      id: item.id,
      type: item.type,
      imageData: item.imageData,
      user: item.user,
      ...(item.type === "car"
        ? {
            brand: (item as ListingCar).brand,
            carModel: (item as ListingCar).carModel,
            size: (item as ListingCar).size,
            condition: (item as ListingCar).condition,
          }
        : { description: (item as ListingDiorama).description }),
    };
    setComposerModal({ open: true, requestedItem: composerItem });
  };

  // ── Derived ──
  const displayedListings =
    listingsTypeFilter === "all"
      ? listings
      : listings.filter((l) => l.type === listingsTypeFilter);

  const pendingReceived = receivedOffers.filter((o) => o.status === "pending");
  const pendingSent = sentOffers.filter((o) => o.status === "pending");
  const acceptedAll = [
    ...sentOffers.filter((o) => o.status === "accepted"),
    ...receivedOffers.filter((o) => o.status === "accepted"),
  ].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const offersSubData = {
    received: pendingReceived,
    sent: pendingSent,
    accepted: acceptedAll,
  };

  const currentSubOffers = offersSubData[offersSubTab];

  // ── Suppressed userId warning ──
  void userId;

  return (
    <div className="space-y-6">
      {/* Top bar: tabs + Post Offer button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(["browse", "offers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab === "browse" ? "Browse Listings" : "My Offers"}
              {tab === "offers" && pendingReceived.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {pendingReceived.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setComposerModal({ open: true })}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl border border-red-500 transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post Trade Offer
        </button>
      </div>

      {/* ── Browse Tab ── */}
      {activeTab === "browse" && (
        <div className="space-y-4">
          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-xs">Filter:</span>
            {(["all", "car", "diorama"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setListingsTypeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  listingsTypeFilter === f
                    ? "bg-zinc-800 text-white border border-zinc-600"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800 border border-transparent"
                }`}
              >
                {f === "all" ? "All" : f === "car" ? "Cars" : "Dioramas"}
              </button>
            ))}
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-zinc-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-8 bg-zinc-800 rounded-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <svg
                className="mx-auto opacity-30"
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3 4 7l4 4" />
                <path d="M4 7h16" />
                <path d="m16 21 4-4-4-4" />
                <path d="M20 17H4" />
              </svg>
              <p className="text-zinc-500 text-lg font-medium">
                No trade listings yet
              </p>
              <p className="text-zinc-600 text-sm">
                Be the first — mark items as &ldquo;For Trade&rdquo; in your
                garage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedListings.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  onMakeOffer={handleMakeOffer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Offers Tab ── */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-zinc-800">
            {(
              [
                {
                  key: "received",
                  label: "Received",
                  count: pendingReceived.length,
                },
                { key: "sent", label: "Sent", count: pendingSent.length },
                {
                  key: "accepted",
                  label: "Accepted",
                  count: acceptedAll.length,
                },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setOffersSubTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 ${
                  offersSubTab === key
                    ? "border-red-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      offersSubTab === key
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {offersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse space-y-3"
                >
                  <div className="flex justify-between">
                    <div className="h-4 bg-zinc-800 rounded w-1/4" />
                    <div className="h-4 bg-zinc-800 rounded w-16" />
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <div
                        key={j}
                        className="w-10 h-10 bg-zinc-800 rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : currentSubOffers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <svg
                className="mx-auto opacity-30 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3 4 7l4 4" />
                <path d="M4 7h16" />
                <path d="m16 21 4-4-4-4" />
                <path d="M20 17H4" />
              </svg>
              <p className="text-zinc-500 font-medium">
                {offersSubTab === "received" && "No pending offers received"}
                {offersSubTab === "sent" && "No pending offers sent"}
                {offersSubTab === "accepted" && "No accepted trades yet"}
              </p>
              {offersSubTab === "received" && (
                <p className="text-zinc-600 text-sm">
                  When someone makes an offer on your items, it&apos;ll appear
                  here.
                </p>
              )}
              {offersSubTab === "sent" && (
                <p className="text-zinc-600 text-sm">
                  Browse listings and click &ldquo;Make Offer&rdquo; to send a
                  trade proposal.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentSubOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  itemMap={itemMap}
                  perspective={
                    offersSubTab === "received" ? "received" : "sent"
                  }
                  onAccept={actionLoading ? undefined : handleAccept}
                  onReject={actionLoading ? undefined : handleReject}
                  onDelete={actionLoading ? undefined : handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Composer Modal */}
      {composerModal.open && (
        <TradeOfferComposerModal
          prefilledRequestedItem={composerModal.requestedItem}
          prefilledOfferedItem={composerModal.offeredItem}
          onClose={() => setComposerModal({ open: false })}
          onSuccess={() => {
            setComposerModal({ open: false });
            setActiveTab("offers");
            setOffersSubTab("sent");
            fetchOffers();
            window.dispatchEvent(
              new CustomEvent("vroom:notifications:refresh"),
            );
          }}
        />
      )}
    </div>
  );
}
