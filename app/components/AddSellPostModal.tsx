'use client';

import { useEffect, useState } from 'react';
import { getMyUnlistedItems, listItemForSale } from '@/app/actions/marketplace';
import MarketplacePriceAdvisor from '@/app/components/MarketplacePriceAdvisor';

interface UnlistedCar {
  id: string;
  imageData: string;
  brand: string;
  carModel: string;
  condition: string;
  sellingPrice: number;
}

interface UnlistedDiorama {
  id: string;
  imageData: string | null;
  description: string;
  sellingPrice: number;
}

interface Props {
  onClose: () => void;
}

type ItemType = 'car' | 'diorama';

interface SelectedItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle?: string;
  condition?: string;
  imageData: string | null;
}

export default function AddSellPostModal({ onClose }: Props) {
  const [cars, setCars] = useState<UnlistedCar[]>([]);
  const [dioramas, setDioramas] = useState<UnlistedDiorama[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    getMyUnlistedItems().then((res) => {
      if ('error' in res && res.error) return;
      setCars((res.cars ?? []) as UnlistedCar[]);
      setDioramas((res.dioramas ?? []) as UnlistedDiorama[]);
      setLoading(false);
    });
  }, []);

  const handleSelect = (
    id: string,
    type: ItemType,
    title: string,
    subtitle: string | undefined,
    condition: string | undefined,
    imageData: string | null,
  ) => {
    setSelected({ id, type, title, subtitle, condition, imageData });
    setPrice('');
    setPriceError('');
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const parsed = parseFloat(price);
    if (!price || isNaN(parsed) || parsed <= 0) {
      setPriceError('Enter a valid price greater than 0');
      return;
    }
    setSubmitting(true);
    const res = await listItemForSale(selected.id, selected.type, parsed);
    if (res?.error) {
      setSubmitError(res.error);
      setSubmitting(false);
      return;
    }
    onClose();
  };

  const hasItems = cars.length > 0 || dioramas.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-32">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-8rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <div>
            <h2 className="text-white text-lg font-bold">Add Sell Post</h2>
            <p className="text-zinc-400 text-xs mt-0.5">Select an item from your garage to list</p>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-sm">Loading your garage…</div>
          ) : !hasItems ? (
            <div className="py-16 text-center">
              <p className="text-zinc-400 font-medium">No unlisted items</p>
              <p className="text-zinc-600 text-sm mt-1">All your garage items are already listed, or your garage is empty.</p>
            </div>
          ) : (
            <>
              {/* Cars */}
              {cars.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Cars</p>
                  <div className="space-y-2">
                    {cars.map((car) => (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => handleSelect(car.id, 'car', car.brand, car.carModel, car.condition, car.imageData)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected?.id === car.id
                            ? 'border-red-500 bg-red-950/30'
                            : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-600'
                        }`}
                      >
                        <img src={car.imageData} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{car.brand} {car.carModel}</p>
                          <p className="text-zinc-500 text-xs">{car.condition}</p>
                        </div>
                        {selected?.id === car.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dioramas */}
              {dioramas.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Dioramas</p>
                  <div className="space-y-2">
                    {dioramas.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelect(d.id, 'diorama', d.description, undefined, undefined, d.imageData)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected?.id === d.id
                            ? 'border-red-500 bg-red-950/30'
                            : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-600'
                        }`}
                      >
                        {d.imageData ? (
                          <img src={d.imageData} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{d.description}</p>
                          <p className="text-zinc-500 text-xs">Diorama</p>
                        </div>
                        {selected?.id === d.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected && (
                <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-800 pt-4">
                  <MarketplacePriceAdvisor
                    mode="sell"
                    item={{
                      itemId: selected.id,
                      type: selected.type,
                      title: selected.title,
                      subtitle: selected.subtitle,
                      condition: selected.condition,
                      currentPrice: price ? Number(price) : undefined,
                    }}
                    onApplySuggestedPrice={(suggestedPrice) => {
                      setPrice(String(suggestedPrice));
                      setPriceError('');
                      setSubmitError('');
                    }}
                  />

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Selling Price (৳) for <span className="text-zinc-200">{selected.subtitle ? `${selected.title} ${selected.subtitle}` : selected.title}</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); setPriceError(''); setSubmitError(''); }}
                      placeholder="e.g. 2500"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                      autoFocus
                    />
                    {priceError && <p className="mt-1 text-xs text-red-400">{priceError}</p>}
                    {submitError && <p className="mt-1 text-xs text-red-400">{submitError}</p>}
                  </div>

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
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Listing…' : 'List for Sale'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
