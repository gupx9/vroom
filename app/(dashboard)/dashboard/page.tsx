export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Dashboard Overview</h1>
      <p className="text-zinc-400">
        Welcome to your VROOM.IO command center. From here, you can manage your fleet, track metrics, and oversee your entire automotive operation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Placeholder Cards */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-lg hover:border-red-900/50 transition-colors">
          <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.4-1.7-1-2.2l-3.1-2.2c-.3-.2-.7-.3-1.1-.3H10c-.9 0-1.8.4-2.4 1M7 17H4c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h8"/><circle cx="16.5" cy="17.5" r="2.5"/><circle cx="8.5" cy="17.5" r="2.5"/></svg>
          </div>
          <h3 className="text-xl font-semibold">Active Vehicles</h3>
          <p className="text-3xl font-black font-mono">24</p>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-lg hover:border-red-900/50 transition-colors">
          <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h3 className="text-xl font-semibold">System Health</h3>
          <p className="text-3xl font-black font-mono text-green-500">99.9%</p>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-lg hover:border-red-900/50 transition-colors">
          <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 className="text-xl font-semibold">Total Revenue</h3>
          <p className="text-3xl font-black font-mono">$1.2M</p>
        </div>
      </div>
    </div>
  );
}
