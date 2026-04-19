"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getMyEligibleCars, createAuction } from "@/app/actions/auctions";

interface EligibleCar {
  id: string;
  imageData: string;
  brand: string;
  carModel: string;
  size: string;
  condition: string;
  description: string | null;
  price: number;
}

interface Props {
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "3 hours", value: 3 },
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "72 hours", value: 72 },
];

function parseDaysHoursMinutesToHours(value: string): number | null {
  const raw = value.trim();
  const parts = raw.split(":");
  if (parts.length !== 3) return null;

  const [daysText, hoursText, minutesText] = parts;
  if (
    !/^\d+$/.test(daysText) ||
    !/^\d+$/.test(hoursText) ||
    !/^\d+$/.test(minutesText)
  ) {
    return null;
  }

  const days = Number(daysText);
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(days) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  if (days < 0 || hours < 0 || minutes < 0) return null;
  if (hours > 23 || minutes > 59) return null;

  const totalHours = days * 24 + hours + minutes / 60;
  if (totalHours <= 0) return null;

  return totalHours;
}

export default function CreateAuctionModal({ onClose }: Props) {
  const router = useRouter();
  const [cars, setCars] = useState<EligibleCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<EligibleCar | null>(null);
  const [startingBid, setStartingBid] = useState("");
  const [duration, setDuration] = useState<number | "custom">(24);
  const [customDuration, setCustomDuration] = useState("");
  const [bidError, setBidError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyEligibleCars().then((res) => {
      if ("error" in res && res.error) return;
      setCars(res.cars as EligibleCar[]);
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    const parsed = parseFloat(startingBid);
    if (!startingBid || isNaN(parsed) || parsed <= 0) {
      setBidError("Enter a valid starting bid greater than 0");
      return;
    }

    const selectedDurationHours =
      duration === "custom"
        ? parseDaysHoursMinutesToHours(customDuration)
        : duration;
    if (
      typeof selectedDurationHours !== "number" ||
      !Number.isFinite(selectedDurationHours) ||
      selectedDurationHours <= 0
    ) {
      setSubmitError(
        "Enter a valid custom duration as DD:HH:MM (days:hours:minutes)",
      );
      return;
    }

    setBidError("");
    setSubmitError("");
    startTransition(async () => {
      const res = await createAuction(
        selectedCar.id,
        parsed,
        selectedDurationHours,
      );
      if (res?.error) {
        setSubmitError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white text-lg font-bold">Start Auction</h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              List one of your cars for auction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              Loading your cars…
            </div>
          ) : cars.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-400 font-medium">No eligible cars</p>
              <p className="text-zinc-600 text-sm mt-1">
                All your cars are already in active auctions or your garage is
                empty.
              </p>
            </div>
          ) : (
            <>
              {/* Car selector */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Select a car
                </p>
                <div className="space-y-2">
                  {cars.map((car) => (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => {
                        setSelectedCar(car);
                        setBidError("");
                        setSubmitError("");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedCar?.id === car.id
                          ? "border-red-500 bg-red-950/30"
                          : "border-zinc-800 bg-zinc-800/40 hover:border-zinc-600"
                      }`}
                    >
                      <img
                        src={car.imageData}
                        alt=""
                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {car.brand} {car.carModel}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {car.size} · {car.condition}
                        </p>
                      </div>
                      {selectedCar?.id === car.id && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCar && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                      Auction Settings
                    </p>

                    {/* Starting Bid */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Starting Bid (৳)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={startingBid}
                        onChange={(e) => {
                          setStartingBid(e.target.value);
                          setBidError("");
                          setSubmitError("");
                        }}
                        placeholder="e.g. 1000"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                        autoFocus
                      />
                      {bidError && (
                        <p className="mt-1 text-xs text-red-400">{bidError}</p>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Auction Duration
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setDuration(opt.value);
                              setSubmitError("");
                            }}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                              duration === opt.value
                                ? "border-red-500 bg-red-950/40 text-red-300"
                                : "border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-500"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setDuration("custom");
                            setSubmitError("");
                          }}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                            duration === "custom"
                              ? "border-red-500 bg-red-950/40 text-red-300"
                              : "border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          Custom
                        </button>
                      </div>

                      {/* Custom DD:HH:MM Input */}
                      {duration === "custom" && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Custom Time (DD:HH:MM)
                          </label>
                          <input
                            type="text"
                            value={customDuration}
                            onChange={(e) => {
                              setCustomDuration(e.target.value);
                              setSubmitError("");
                            }}
                            placeholder="00:00:00 (days:hours:minutes)"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                          />
                          <p className="mt-1 text-xs text-zinc-500">
                            Example: 01:06:30 = 1 day, 6 hours, 30 minutes.
                          </p>
                        </div>
                      )}
                    </div>

                    {submitError && (
                      <p className="mt-2 text-xs text-red-400">{submitError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isPending ||
                        (duration === "custom" &&
                          !parseDaysHoursMinutesToHours(customDuration))
                      }
                      className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <>
                          <svg
                            className="animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Starting…
                        </>
                      ) : (
                        "Start Auction"
                      )}
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
