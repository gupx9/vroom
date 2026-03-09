'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  approveReport,
  rejectReport,
  approveReview,
  rejectReview,
  banUser,
  unbanUser,
} from '@/app/actions/admin';

interface ReportItem {
  id: string;
  reason: string;
  createdAt: Date;
  author: { username: string };
  target: { id: string; username: string; reputation: number; bannedUntil: Date | null };
}

interface ReviewItem {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: Date;
  author: { username: string };
  target: { id: string; username: string; reputation: number };
}

interface ModerationPanelProps {
  reports: ReportItem[];
  reviews: ReviewItem[];
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={s <= stars ? '#facc15' : 'none'}
          stroke={s <= stars ? '#facc15' : '#52525b'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function BanModal({
  userId,
  username,
  bannedUntil,
  onClose,
  onRefresh,
}: {
  userId: string;
  username: string;
  bannedUntil: Date | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [days, setDays] = useState('7');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const isBanned = bannedUntil && new Date(bannedUntil) > new Date();
  const bannedUntilStr = isBanned
    ? new Date(bannedUntil!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const handleBan = () => {
    const d = parseInt(days, 10);
    if (!d || d <= 0) { setError('Enter a valid number of days'); return; }
    setError('');
    startTransition(async () => {
      const res = await banUser(userId, d);
      if (res?.error) { setError(res.error); return; }
      onRefresh();
      onClose();
    });
  };

  const handleUnban = () => {
    startTransition(async () => {
      await unbanUser(userId);
      onRefresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Manage Ban — @{username}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {isBanned && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-sm text-red-400">
              Currently banned until <span className="font-bold">{bannedUntilStr}</span>
            </div>
          )}

          {!isBanned && (
            <div className="space-y-2">
              <label className="block text-sm text-zinc-400">Ban duration (days)</label>
              <div className="flex gap-2">
                {['1', '3', '7', '30'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      days === d
                        ? 'bg-red-700 border-red-600 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="Custom days"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors">
              Cancel
            </button>
            {isBanned ? (
              <button
                onClick={handleUnban}
                disabled={pending}
                className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {pending ? 'Lifting...' : 'Lift Ban'}
              </button>
            ) : (
              <button
                onClick={handleBan}
                disabled={pending}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {pending ? 'Banning...' : 'Ban User'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModerationPanel({ reports, reviews }: ModerationPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reports' | 'reviews'>('reports');
  const [banTarget, setBanTarget] = useState<{ id: string; username: string; bannedUntil: Date | null } | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => router.refresh();

  const handleApproveReport = (id: string) =>
    startTransition(async () => { await approveReport(id); refresh(); });

  const handleRejectReport = (id: string) =>
    startTransition(async () => { await rejectReport(id); refresh(); });

  const handleApproveReview = (id: string) =>
    startTransition(async () => { await approveReview(id); refresh(); });

  const handleRejectReview = (id: string) =>
    startTransition(async () => { await rejectReview(id); refresh(); });

  const tabClass = (tab: 'reports' | 'reviews') =>
    `px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-red-600/20 text-red-400 border border-red-600/30'
        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
    }`;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveTab('reports')} className={tabClass('reports')}>
          Reports
          {reports.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-700 text-white text-[10px] font-bold">
              {reports.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('reviews')} className={tabClass('reviews')}>
          Low Reviews
          {reviews.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-bold">
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {/* ── REPORTS ── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 && (
            <div className="py-16 text-center text-zinc-600">
              <svg className="mx-auto mb-3 opacity-30" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-zinc-500 font-medium">No pending reports</p>
            </div>
          )}
          {reports.map((r) => {
            const isBanned = r.target.bannedUntil && new Date(r.target.bannedUntil) > new Date();
            return (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-zinc-400">
                        <span className="text-zinc-300 font-medium">@{r.author.username}</span>
                        <span className="text-zinc-600 mx-1.5">reported</span>
                        <span className="text-white font-semibold">@{r.target.username}</span>
                      </span>
                      <span className="text-zinc-600 text-xs">
                        · rep: <span className={r.target.reputation < 0 ? 'text-red-400' : 'text-zinc-400'}>{r.target.reputation >= 0 ? `+${r.target.reputation}` : r.target.reputation}</span>
                      </span>
                      {isBanned && (
                        <span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-800/50">
                          Banned
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 text-sm bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 mt-2">
                      {r.reason}
                    </p>
                    <p className="text-zinc-600 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveReport(r.id)}
                      className="px-4 py-2 bg-red-700/20 hover:bg-red-700/40 border border-red-700/40 text-red-400 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Approve <span className="text-xs opacity-70">−20 rep</span>
                    </button>
                    <button
                      onClick={() => handleRejectReport(r.id)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setBanTarget({ id: r.target.id, username: r.target.username, bannedUntil: r.target.bannedUntil })}
                      className={`px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                        isBanned
                          ? 'bg-red-950/30 border-red-800/50 text-red-400 hover:bg-red-950/50'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-800/50'
                      }`}
                    >
                      {isBanned ? 'Manage Ban' : 'Ban User'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOW REVIEWS ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 && (
            <div className="py-16 text-center text-zinc-600">
              <svg className="mx-auto mb-3 opacity-30" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-zinc-500 font-medium">No pending low reviews</p>
            </div>
          )}
          {reviews.map((rv) => (
            <div key={rv.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-zinc-400">
                      <span className="text-zinc-300 font-medium">@{rv.author.username}</span>
                      <span className="text-zinc-600 mx-1.5">reviewed</span>
                      <span className="text-white font-semibold">@{rv.target.username}</span>
                    </span>
                    <StarDisplay stars={rv.stars} />
                    <span className="text-amber-500 text-xs font-medium">+{rv.stars * 5} rep if approved</span>
                    <span className="text-zinc-600 text-xs">
                      · rep: <span className={rv.target.reputation < 0 ? 'text-red-400' : 'text-zinc-400'}>{rv.target.reputation >= 0 ? `+${rv.target.reputation}` : rv.target.reputation}</span>
                    </span>
                  </div>
                  {rv.comment && (
                    <p className="text-zinc-300 text-sm bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 mt-2">
                      {rv.comment}
                    </p>
                  )}
                  <p className="text-zinc-600 text-xs">
                    {new Date(rv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveReview(rv.id)}
                    className="px-4 py-2 bg-green-900/20 hover:bg-green-900/40 border border-green-800/40 text-green-400 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectReview(rv.id)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ban modal */}
      {banTarget && (
        <BanModal
          userId={banTarget.id}
          username={banTarget.username}
          bannedUntil={banTarget.bannedUntil}
          onClose={() => setBanTarget(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
