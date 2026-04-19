"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

type AuctionExpiryTarget = {
  id: string;
  endsAt: string;
  finalized?: boolean;
};

type Props = {
  auctions: AuctionExpiryTarget[];
};

const RETRY_DELAY_MS = 30_000;
const MIN_DELAY_MS = 250;

export default function AuctionExpiryWatcher({ auctions }: Props) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef(new Set<string>());

  const targets = useMemo(
    () =>
      auctions
        .filter((auction) => !auction.finalized)
        .map((auction) => ({
          id: auction.id,
          endsAtMs: new Date(auction.endsAt).getTime(),
        }))
        .filter((auction) => Number.isFinite(auction.endsAtMs)),
    [auctions],
  );

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
      const hasDueAuction = targets.some(
        (auction) =>
          auction.endsAtMs <= now && !inFlightRef.current.has(auction.id),
      );

      if (hasDueAuction) {
        void finalizeDueAuctions();
        return;
      }

      const nextEndsAt = targets.reduce((soonest, target) => {
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
      const dueAuctions = targets.filter(
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
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ auctionId: auction.id }),
            });

            if (response.ok) {
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
        window.dispatchEvent(
          new CustomEvent("vroom:notifications:refresh", {
            detail: {
              auctionIds: dueAuctions.map((auction) => auction.id),
            },
          }),
        );
        router.refresh();
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        void finalizeDueAuctions();
      }, RETRY_DELAY_MS);
    };

    const handleWake = () => {
      if (document.visibilityState === "visible") {
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
  }, [router, targets]);

  return null;
}
