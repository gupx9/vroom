'use client';

import { useState } from 'react';
import { submitReview, submitReport } from '@/app/actions/profile';

interface ProfileActionsProps {
  targetUserId: string;
  targetUsername: string;
  initialReview: { stars: number; status: string } | null;
  initialReport: { status: string } | null;
}

type ReviewPhase = 'idle' | 'selecting' | 'loading' | 'approved' | 'pending' | 'rejected';
type ReportPhase = 'idle' | 'composing' | 'loading' | 'pending' | 'approved' | 'rejected';

export default function ProfileActions({
  targetUserId,
  targetUsername,
  initialReview,
  initialReport,
}: ProfileActionsProps) {
  // ── Review state ──────────────────────────────────────────────────────────
  const [reviewPhase, setReviewPhase] = useState<ReviewPhase>(() => {
    if (!initialReview) return 'idle';
    if (initialReview.status === 'approved') return 'approved';
    if (initialReview.status === 'rejected') return 'rejected';
    return 'pending';
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStars, setSelectedStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // ── Report state ──────────────────────────────────────────────────────────
  const [reportPhase, setReportPhase] = useState<ReportPhase>(() => {
    if (!initialReport) return 'idle';
    if (initialReport.status === 'approved') return 'approved';
    if (initialReport.status === 'rejected') return 'rejected';
    return 'pending';
  });
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    setReviewError('');
    if (selectedStars === 0) { setReviewError('Please select a star rating.'); return; }
    if (selectedStars < 3 && reviewComment.trim().length < 10) {
      setReviewError('Reason must be at least 10 characters for a low rating.');
      return;
    }
    setReviewPhase('loading');
    const res = await submitReview(targetUserId, selectedStars, reviewComment || undefined);
    if (res?.error) {
      setReviewError(res.error);
      setReviewPhase('selecting');
      return;
    }
    setReviewPhase(res.status === 'approved' ? 'approved' : 'pending');
  };

  const handleReportSubmit = async () => {
    setReportError('');
    if (reportReason.trim().length < 10) {
      setReportError('Reason must be at least 10 characters.');
      return;
    }
    setReportPhase('loading');
    const res = await submitReport(targetUserId, reportReason);
    if (res?.error) {
      setReportError(res.error);
      setReportPhase('composing');
      return;
    }
    setReportPhase('pending');
  };

  const activeStar = hoveredStar || selectedStars;

  return (
    <div className="flex flex-wrap gap-3">
      {/* ── REVIEW BUTTON / PANEL ─────────────────────────────────────────── */}
      {reviewPhase === 'idle' && (
        <button
          onClick={() => setReviewPhase('selecting')}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Review
        </button>
      )}

      {reviewPhase === 'approved' && (
        <div className="px-5 py-2.5 bg-green-900/40 border border-green-700/60 text-green-400 text-sm font-semibold rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Reviewed
        </div>
      )}

      {reviewPhase === 'pending' && (
        <div className="px-5 py-2.5 bg-amber-900/30 border border-amber-700/50 text-amber-400 text-sm font-semibold rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Sent for Admin Approval
        </div>
      )}

      {reviewPhase === 'rejected' && (
        <button
          onClick={() => setReviewPhase('idle')}
          className="px-5 py-2.5 bg-red-900/30 border border-red-700/50 text-red-400 text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-red-900/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Review Rejected — Try Again
        </button>
      )}

      {/* ── REPORT BUTTON / PANEL ─────────────────────────────────────────── */}
      {reportPhase === 'idle' && (
        <button
          onClick={() => setReportPhase('composing')}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/60 text-zinc-400 hover:text-red-400 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Report
        </button>
      )}

      {reportPhase === 'pending' && (
        <div className="px-5 py-2.5 bg-amber-900/30 border border-amber-700/50 text-amber-400 text-sm font-semibold rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Sent for Admin Approval
        </div>
      )}

      {reportPhase === 'approved' && (
        <div className="px-5 py-2.5 bg-green-900/40 border border-green-700/60 text-green-400 text-sm font-semibold rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Report Approved
        </div>
      )}

      {reportPhase === 'rejected' && (
        <button
          onClick={() => setReportPhase('idle')}
          className="px-5 py-2.5 bg-red-900/30 border border-red-700/50 text-red-400 text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-red-900/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Report Rejected — Try Again
        </button>
      )}

      {/* ── REVIEW MODAL ──────────────────────────────────────────────────── */}
      {(reviewPhase === 'selecting' || reviewPhase === 'loading') && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 pt-32 bg-black/70 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
              <h2 className="text-lg font-bold text-white">Review @{targetUsername}</h2>
              <button
                onClick={() => { setReviewPhase('idle'); setSelectedStars(0); setReviewComment(''); setReviewError(''); }}
                className="text-zinc-500 hover:text-white transition-colors"
                disabled={reviewPhase === 'loading'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
              {/* Star selector */}
              <div>
                <p className="text-sm text-zinc-400 mb-3">Select a rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setSelectedStars(star)}
                      disabled={reviewPhase === 'loading'}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill={star <= activeStar ? '#facc15' : 'none'}
                        stroke={star <= activeStar ? '#facc15' : '#52525b'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  ))}
                </div>
                {selectedStars > 0 && (
                  <p className="text-xs text-zinc-500 mt-2">
                    {selectedStars} star{selectedStars !== 1 ? 's' : ''} · +{selectedStars * 5} reputation
                    {selectedStars < 3 && (
                      <span className="text-amber-500 ml-2">· Requires admin approval</span>
                    )}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  {selectedStars > 0 && selectedStars < 3
                    ? 'Reason (required for low ratings)'
                    : 'Comment (optional)'}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    selectedStars > 0 && selectedStars < 3
                      ? 'Explain why you gave a low rating...'
                      : 'Share your experience with this seller...'
                  }
                  rows={3}
                  disabled={reviewPhase === 'loading'}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none transition-colors"
                />
              </div>

              {reviewError && (
                <p className="text-red-400 text-xs">{reviewError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setReviewPhase('idle'); setSelectedStars(0); setReviewComment(''); setReviewError(''); }}
                  disabled={reviewPhase === 'loading'}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewPhase === 'loading' || selectedStars === 0}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {reviewPhase === 'loading' ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ──────────────────────────────────────────────────── */}
      {(reportPhase === 'composing' || reportPhase === 'loading') && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 pt-32 bg-black/70 backdrop-blur-sm">
          <div className="flex w-full max-w-md max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
              <h2 className="text-lg font-bold text-white">Report @{targetUsername}</h2>
              <button
                onClick={() => { setReportPhase('idle'); setReportReason(''); setReportError(''); }}
                className="text-zinc-500 hover:text-white transition-colors"
                disabled={reportPhase === 'loading'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-sm text-zinc-400">
                Reports are reviewed by admins before any action is taken. Please describe your concern clearly.
              </p>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Reason for report <span className="text-red-500">*</span></label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why you are reporting this user..."
                  rows={4}
                  disabled={reportPhase === 'loading'}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none transition-colors"
                />
                <p className="text-xs text-zinc-600 mt-1">Minimum 10 characters</p>
              </div>

              {reportError && (
                <p className="text-red-400 text-xs">{reportError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setReportPhase('idle'); setReportReason(''); setReportError(''); }}
                  disabled={reportPhase === 'loading'}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={reportPhase === 'loading' || reportReason.trim().length < 10}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {reportPhase === 'loading' ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
