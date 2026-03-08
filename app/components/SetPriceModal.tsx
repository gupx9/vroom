'use client';

import { useState } from 'react';

interface SetPriceModalProps {
  itemName: string;
  onConfirm: (price: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function SetPriceModal({ itemName, onConfirm, onClose, loading }: SetPriceModalProps) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(price);
    if (!price || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid selling price greater than 0');
      return;
    }
    onConfirm(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-white text-lg font-bold">Set Selling Price</h2>
          <p className="text-zinc-400 text-sm mt-1">
            How much are you asking for <span className="text-zinc-200 font-medium">{itemName}</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Selling Price (৳)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setError(''); }}
              placeholder="e.g. 1500"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Listing…' : 'List for Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
