export default function MarketplacePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-zinc-400 mt-1 text-sm">Browse buy &amp; sell listings</p>
      </div>
      <div className="pt-8 text-center text-zinc-600 py-24">
        <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <p className="text-lg font-medium text-zinc-500">Coming soon</p>
        <p className="text-sm mt-1 text-zinc-600">Listings from your garage will appear here once enabled</p>
      </div>
    </div>
  );
}
