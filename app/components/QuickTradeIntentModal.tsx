'use client';

import { useState } from 'react';

interface QuickTradeIntentModalProps {
  onClose: () => void;
  onSubmit: (wantDescription: string) => Promise<void>;
}

export default function QuickTradeIntentModal({ onClose, onSubmit }: QuickTradeIntentModalProps) {
  const [wantDescription, setWantDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = wantDescription.trim();
    if (!trimmed) {
      setError('Please add what you want in exchange.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(trimmed);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create trade offer. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Post Trade Request</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Describe what you want in exchange.</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <textarea
            value={wantDescription}
            onChange={(e) => {
              setWantDescription(e.target.value);
              setError('');
            }}
            rows={3}
            maxLength={300}
            autoFocus
            placeholder='e.g. "Looking for a 1:64 JDM car in mint condition"'
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
          />
          {error && (
            <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !wantDescription.trim()}
            className="flex-1 rounded-lg border border-red-500 bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Go To Trading'}
          </button>
        </div>
      </div>
    </div>
  );
}