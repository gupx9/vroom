export default function TradingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Trading</h1>
        <p className="text-zinc-400 mt-1 text-sm">Propose and manage car trades</p>
      </div>
      <div className="pt-8 text-center text-zinc-600 py-24">
        <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3 4 7l4 4" />
          <path d="M4 7h16" />
          <path d="m16 21 4-4-4-4" />
          <path d="M20 17H4" />
        </svg>
        <p className="text-lg font-medium text-zinc-500">Coming soon</p>
        <p className="text-sm mt-1 text-zinc-600">Trade offers for your garage cars will appear here</p>
      </div>
    </div>
  );
}
