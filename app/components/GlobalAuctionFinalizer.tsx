"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AuctionTimerTarget = {
  id: string;
  endsAt: string;
};

const TARGET_SYNC_INTERVAL_MS = 60_000;
const RETRY_DELAY_MS = 30_000;
const MIN_DELAY_MS = 250;

export default function GlobalAuctionFinalizer() {
  const router = useRouter();
  const [targets, setTargets] = useState<AuctionTimerTarget[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef(new Set<string>());
  const syncingRef = useRef(false);

  const normalizedTargets = useMemo(
    () =>
      targets
        .map((auction) => ({
          id: auction.id,
          endsAtMs: new Date(auction.endsAt).getTime(),
        }))
        .filter((auction) => Number.isFinite(auction.endsAtMs)),
    [targets],
  );

  const loadTargets = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;

    try {
      const response = await fetch("/api/auctions/active-timers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json()) as {
        auctions?: AuctionTimerTarget[];
      };

      if (!response.ok) {
        return;
      }

      setTargets(payload.auctions ?? []);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();

      const now = Date.now();
      const hasDueAuction = normalizedTargets.some(
        (auction) =>
          auction.endsAtMs <= now && !inFlightRef.current.has(auction.id),
      );

      if (hasDueAuction) {
        void finalizeDueAuctions();
        return;
      }

      const nextEndsAt = normalizedTargets.reduce((soonest, target) => {
        if (target.endsAtMs <= now || inFlightRef.current.has(target.id)) {
          return soonest;
        }

        return Math.min(soonest, target.endsAtMs);
      }, Number.POSITIVE_INFINITY);

      if (!Number.isFinite(nextEndsAt)) {
        return;
      }

      timeoutRef.current = window.setTimeout(
        () => {
          void finalizeDueAuctions();
        },
        Math.max(MIN_DELAY_MS, nextEndsAt - now),
      );
    };

    const finalizeDueAuctions = async () => {
      if (cancelled) {
        return;
      }

      const now = Date.now();
      const dueAuctions = normalizedTargets.filter(
        (auction) =>
          auction.endsAtMs <= now && !inFlightRef.current.has(auction.id),
      );

      if (dueAuctions.length === 0) {
        scheduleNext();
        return;
      }

      dueAuctions.forEach((auction) => inFlightRef.current.add(auction.id));

      let finalizedAnyAuction = false;

      try {
        await Promise.all(
          dueAuctions.map(async (auction) => {
            const response = await fetch("/api/auctions/finalize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ auctionId: auction.id }),
            });

            if (!response.ok) {
              return;
            }

            const payload = (await response.json()) as { finalized?: boolean };
            if (payload.finalized) {
              finalizedAnyAuction = true;
            }
          }),
        );
      } finally {
        dueAuctions.forEach((auction) =>
          inFlightRef.current.delete(auction.id),
        );
      }

      if (cancelled) {
        return;
      }

      if (finalizedAnyAuction) {
        window.dispatchEvent(new CustomEvent("vroom:notifications:refresh"));
        await loadTargets();
        router.refresh();
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        void finalizeDueAuctions();
      }, RETRY_DELAY_MS);
    };

    const handleWake = () => {
      if (document.visibilityState === "visible") {
        void loadTargets();
        void finalizeDueAuctions();
      }
    };

    scheduleNext();

    document.addEventListener("visibilitychange", handleWake);
    window.addEventListener("pageshow", handleWake);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("pageshow", handleWake);
    };
  }, [loadTargets, normalizedTargets, router]);

  useEffect(() => {
    void loadTargets();

    const intervalId = window.setInterval(() => {
      void loadTargets();
    }, TARGET_SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadTargets]);

  return null;
}
