'use client';

import { useState, useEffect } from 'react';

export interface ComposerItem {
  id: string;
  type: 'car' | 'diorama';
  imageData: string | null;
  brand?: string;
  carModel?: string;
  description?: string;
  size?: string;
  condition?: string;
  user?: { id: string; username: string };
}

interface MyItem {
  id: string;
  type: 'car' | 'diorama';
  imageData: string | null;
  brand?: string;
  carModel?: string;
  description?: string;
  size?: string;
}

interface TradeOfferComposerModalProps {
  /** The listing item you clicked "Make Offer" on — sets receiver automatically */
  prefilledRequestedItem?: ComposerItem;
  /** Your item that triggered the modal from the garage card */
  prefilledOfferedItem?: ComposerItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function getItemName(item: ComposerItem | MyItem): string {
  if (item.type === 'car') return `${item.brand ?? ''} ${item.carModel ?? ''}`.trim();
  const desc = item.description ?? 'Diorama';
  return desc.length > 40 ? desc.slice(0, 40) + '…' : desc;
}

function ItemChip({
  item,
  selected,
  onClick,
}: {
  item: MyItem;
  selected: boolean;
  onClick?: () => void;
}) {
  const name = getItemName(item);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center w-[88px] shrink-0 ${
        selected
          ? 'border-red-500 bg-red-950/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-500'
      }`}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
        {item.imageData ? (
          <img src={item.imageData} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[10px] leading-tight text-zinc-300 break-words w-full line-clamp-2">{name}</span>
      {selected && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function TradeOfferComposerModal({
  prefilledRequestedItem,
  prefilledOfferedItem,
  onClose,
  onSuccess,
}: TradeOfferComposerModalProps) {
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [fetchingMyItems, setFetchingMyItems] = useState(true);
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>(
    prefilledOfferedItem ? [prefilledOfferedItem.id] : []
  );
  const [wantDescription, setWantDescription] = useState(
    prefilledRequestedItem ? getItemName(prefilledRequestedItem) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch my forTrade items
  useEffect(() => {
    setFetchingMyItems(true);
    fetch('/api/garage/trade-items')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const cars = (data.cars as MyItem[]).map((c) => ({ ...c, type: 'car' as const }));
          const dioramas = (data.dioramas as MyItem[]).map((d) => ({ ...d, type: 'diorama' as const }));
          setMyItems([...cars, ...dioramas]);
        }
      })
      .finally(() => setFetchingMyItems(false));
  }, []);

  const toggleOfferedItem = (id: string) => {
    setSelectedOfferedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError('');
    if (!wantDescription.trim()) {
      setError('Please describe what you want in exchange.');
      return;
    }
    if (selectedOfferedIds.length === 0) {
      setError("Please select at least one item you're offering.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        offeredCarIds: selectedOfferedIds,
        wantDescription: wantDescription.trim(),
      };

      // If coming from a specific listing — include receiver and requestedCarIds
      if (prefilledRequestedItem?.user?.id) {
        body.receiverId = prefilledRequestedItem.user.id;
        body.requestedCarIds = [prefilledRequestedItem.id];
      }

      const res = await fetch('/api/trading/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send trade offer.');
        return;
      }
      onSuccess?.();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isTargeted = !!prefilledRequestedItem?.user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white text-lg font-bold">Propose a Trade</h2>
            {isTargeted ? (
              <p className="text-zinc-500 text-xs mt-0.5">
                To <span className="text-zinc-300 font-medium">@{prefilledRequestedItem!.user!.username}</span>
              </p>
            ) : (
              <p className="text-zinc-500 text-xs mt-0.5">Post an open trade offer</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* What you want — targeted listing preview or free text */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {isTargeted ? 'You want' : 'What do you want in exchange?'}
            </p>

            {isTargeted && (
              /* Show the target item as a compact card */
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl p-3 mb-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  {prefilledRequestedItem!.imageData ? (
                    <img
                      src={prefilledRequestedItem!.imageData}
                      alt={getItemName(prefilledRequestedItem!)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{getItemName(prefilledRequestedItem!)}</p>
                  {prefilledRequestedItem!.size && <p className="text-zinc-500 text-xs">{prefilledRequestedItem!.size}</p>}
                  {prefilledRequestedItem!.condition && <p className="text-zinc-500 text-xs">{prefilledRequestedItem!.condition}</p>}
                </div>
                <span className="ml-auto shrink-0 w-6 h-6 bg-green-600/20 border border-green-600/40 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
            )}

            <textarea
              value={wantDescription}
              onChange={(e) => { setWantDescription(e.target.value); setError(''); }}
              rows={isTargeted ? 2 : 3}
              maxLength={300}
              placeholder={
                isTargeted
                  ? 'Add any extra notes about what you want…'
                  : 'e.g. "Looking for a 1:64 BMW M3 in mint condition, or any rare JDM model"'
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              autoFocus={!isTargeted}
            />
          </div>

          {/* What you're offering */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              You&apos;re offering <span className="normal-case font-normal text-zinc-600">(pick one or more of your forTrade items)</span>
            </p>

            <div className="min-h-[100px] max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
              {fetchingMyItems ? (
                <div className="flex items-center justify-center h-20 text-zinc-600 text-sm">Loading your items…</div>
              ) : myItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-1 text-center px-4">
                  <p className="text-zinc-600 text-sm">No items marked for trade.</p>
                  <p className="text-zinc-700 text-xs">Toggle &quot;For Trade&quot; on items in your garage first.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myItems.map((item) => (
                    <ItemChip
                      key={item.id}
                      item={item}
                      selected={selectedOfferedIds.includes(item.id)}
                      onClick={() => toggleOfferedItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedOfferedIds.length > 0 && (
              <p className="text-xs text-green-400">
                ✓ {selectedOfferedIds.length} item{selectedOfferedIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !wantDescription.trim() || selectedOfferedIds.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending…
                </>
              ) : (
                'Send Offer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}