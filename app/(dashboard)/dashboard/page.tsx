import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const carsCount = await prisma.car.count({
    where: { userId: session.userId },
  });

  const [forSaleCars, forSaleDioramas, forTradeCars, forTradeDioramas] = await Promise.all([
    prisma.car.count({ where: { userId: session.userId, forSale: true } }),
    prisma.diorama.count({ where: { userId: session.userId, forSale: true } }),
    prisma.car.count({ where: { userId: session.userId, forTrade: true } }),
    prisma.diorama.count({ where: { userId: session.userId, forTrade: true } }),
  ]);
  const forSaleCount = forSaleCars + forSaleDioramas;
  const forTradeCount = forTradeCars + forTradeDioramas;

  const stats = [
    { label: 'Cars in Garage', value: carsCount, href: '/garage', live: true },
    { label: 'Listed for Sale', value: forSaleCount, href: '/marketplace', live: false },
    { label: 'Open for Trade', value: forTradeCount, href: '/trading', live: false },
    { label: 'Active Bids', value: '—', href: '/auctions', live: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 mt-1 text-sm">Your automotive command center</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) =>
          stat.live ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-900/50 transition-colors group"
            >
              <p className="text-3xl font-black font-mono text-white">{stat.value}</p>
              <p className="text-zinc-400 text-sm mt-1 group-hover:text-zinc-300 transition-colors">
                {stat.label}
              </p>
            </Link>
          ) : (
            <div
              key={stat.label}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl opacity-50"
            >
              <p className="text-3xl font-black font-mono text-zinc-500">{stat.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{stat.label}</p>
            </div>
          )
        )}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/garage', label: 'My Garage', desc: 'Upload and showcase your cars', active: true },
            { href: '/marketplace', label: 'Marketplace', desc: 'Buy & sell listings', active: false },
            { href: '/trading', label: 'Trading', desc: 'Propose car trades', active: false },
            { href: '/auctions', label: 'Auctions', desc: 'Bid on vehicles', active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-5 rounded-xl border transition-colors flex flex-col gap-1 ${
                item.active
                  ? 'bg-zinc-900 border-zinc-700 hover:border-red-600/40'
                  : 'bg-zinc-900/40 border-zinc-800 opacity-60 pointer-events-none'
              }`}
            >
              <span className="font-semibold text-white text-sm">{item.label}</span>
              <span className="text-zinc-500 text-xs">{item.desc}</span>
              {!item.active && (
                <span className="text-xs text-zinc-600 mt-1">Coming soon</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

