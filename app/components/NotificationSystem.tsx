"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  auctionId: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
};

const REFRESH_INTERVAL_MS = 20_000;

export default function NotificationSystem() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const loadNotifications = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load notifications");
      }

      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
      setError(null);
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load notifications";

      setError(messageText);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      void loadNotifications();
      scheduleRefresh();
    }, REFRESH_INTERVAL_MS);
  }, [loadNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notifications");
      }

      await loadNotifications();
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to update notifications";

      setError(messageText);
    }
  }, [loadNotifications]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationIds: [notificationId] }),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error("Failed to update notifications");
    }
  }, []);

  const getNotificationHref = useCallback((notification: NotificationItem) => {
    if (notification.kind.startsWith("trade_")) {
      return "/trading";
    }

    return `/auctions/${notification.auctionId}`;
  }, []);

  const onNotificationClick = useCallback(
    (notification: NotificationItem) => {
      setNotifications((previous) =>
        previous.filter((item) => item.id !== notification.id),
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
      setOpen(false);

      void markNotificationRead(notification.id).catch(() => {
        void loadNotifications();
      });

      router.push(getNotificationHref(notification));
    },
    [getNotificationHref, loadNotifications, markNotificationRead, router],
  );

  useEffect(() => {
    void loadNotifications();
    scheduleRefresh();

    const handleRefreshEvent = () => {
      void loadNotifications();
    };

    const handleWake = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    window.addEventListener(
      "vroom:notifications:refresh",
      handleRefreshEvent as EventListener,
    );
    document.addEventListener("visibilitychange", handleWake);
    window.addEventListener("pageshow", handleWake);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      window.removeEventListener(
        "vroom:notifications:refresh",
        handleRefreshEvent as EventListener,
      );
      document.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("pageshow", handleWake);
    };
  }, [loadNotifications, scheduleRefresh]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
        aria-label="Open notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.172V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341A6.002 6.002 0 0 0 6 11v3.172a2.032 2.032 0 0 1-.595 1.423L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-zinc-500">
                Auction and trading updates
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {loading && notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-zinc-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-zinc-500">
                No unread notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onNotificationClick(notification)}
                  className="mb-2 block w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {notification.body}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-red-900/50 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                      New
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-zinc-600">
                    <span>{notification.kind}</span>
                    <span>
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))
            )}

            {error ? (
              <p className="px-3 py-2 text-xs text-red-400">{error}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
