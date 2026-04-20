'use client';

import { useState } from 'react';

type AdviceMode = 'sell' | 'buy';

type AdviceResult = {
  provider: 'gemini' | 'groq' | 'fallback';
  sourceNote: string;
  debugError?: string;
  mode: AdviceMode;
  recommendedPrice: number;
  lowPrice: number;
  highPrice: number;
  marketSignal: 'underpriced' | 'fair' | 'overpriced';
  confidence: 'low' | 'medium' | 'high';
  rationale: string;
  comparableCount: number;
};

interface MarketplacePriceAdvisorProps {
  mode: AdviceMode;
  item: {
    itemId?: string;
    type: 'car' | 'diorama';
    title: string;
    subtitle?: string;
    condition?: string;
    currentPrice?: number;
  };
  onApplySuggestedPrice?: (price: number) => void;
}

function formatPrice(price: number) {
  return `৳${price.toLocaleString()}`;
}

export default function MarketplacePriceAdvisor({
  mode,
  item,
  onApplySuggestedPrice,
}: MarketplacePriceAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<AdviceResult | null>(null);

  const runAdvice = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/marketplace/price-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          mode,
          itemType: item.type,
          itemId: item.itemId,
          title: item.title,
          subtitle: item.subtitle,
          condition: item.condition,
          currentPrice: item.currentPrice,
        }),
      });

      const payload = (await response.json()) as AdviceResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to get AI price advice');
      }

      setAdvice(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to get AI price advice');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = typeof item.currentPrice === 'number' && Number.isFinite(item.currentPrice) ? item.currentPrice : 0;
  const priceLabel = mode === 'sell' ? 'Suggested listing price' : 'Fair market price';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Gemini price assistant</p>
          <p className="text-sm text-zinc-300 mt-1">
            {mode === 'sell'
              ? 'Get a realistic asking price before you list.'
              : 'Check if this listing is priced fairly before you buy.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAdvice()}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Analyzing...' : mode === 'sell' ? 'Get AI price' : 'Check fair price'}
        </button>
      </div>

      {advice && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              {advice.provider === 'gemini' ? 'Gemini AI' : advice.provider === 'groq' ? 'GROQ fallback' : 'Local estimate'}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              advice.marketSignal === 'overpriced'
                ? 'border-red-700/60 bg-red-950/40 text-red-300'
                : advice.marketSignal === 'underpriced'
                  ? 'border-green-700/60 bg-green-950/40 text-green-300'
                  : 'border-amber-700/60 bg-amber-950/40 text-amber-300'
            }`}>
              {advice.marketSignal}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {advice.confidence} confidence
            </span>
          </div>

          <p className="text-[11px] text-zinc-500">{advice.sourceNote}</p>

          {advice.debugError && (
            <p className="rounded-md border border-amber-700/60 bg-amber-950/30 px-2 py-1 text-[11px] text-amber-300">
              {advice.debugError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{priceLabel}</p>
              <p className="mt-1 text-lg font-bold text-white">{formatPrice(advice.recommendedPrice)}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Price range</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                {formatPrice(advice.lowPrice)} - {formatPrice(advice.highPrice)}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Comparable listings</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{advice.comparableCount} found</p>
            </div>
          </div>

          {mode === 'buy' && currentPrice > 0 && (
            <p
              className={`text-xs ${
                currentPrice > advice.highPrice
                  ? 'text-red-300'
                  : currentPrice < advice.lowPrice
                    ? 'text-green-300'
                    : 'text-zinc-400'
              }`}
            >
              Current price: {formatPrice(currentPrice)}
              {currentPrice > advice.highPrice
                ? ` is above the suggested range by ${formatPrice(currentPrice - advice.highPrice)}.`
                : currentPrice < advice.lowPrice
                  ? ` is below the suggested range by ${formatPrice(advice.lowPrice - currentPrice)}.`
                  : ' sits inside the suggested range.'}
            </p>
          )}

          <p className="text-xs text-zinc-400">{advice.rationale}</p>

          {mode === 'sell' && onApplySuggestedPrice && (
            <button
              type="button"
              onClick={() => onApplySuggestedPrice(advice.recommendedPrice)}
              className="rounded-lg border border-red-700/60 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-950/50"
            >
              Use suggested price
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
