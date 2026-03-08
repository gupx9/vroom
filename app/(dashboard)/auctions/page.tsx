export default function AuctionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Auctions</h1>
        <p className="text-zinc-400 mt-1 text-sm">Live and upcoming vehicle auctions</p>
      </div>
      <div className="pt-8 text-center text-zinc-600 py-24">
        <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14.5 12.5-8 8a2.119 2.119 0 0 1-3-3l8-8" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
        <p className="text-lg font-medium text-zinc-500">Coming soon</p>
        <p className="text-sm mt-1 text-zinc-600">Place bids and run timed auctions on your cars</p>
      </div>
    </div>
  );
}
