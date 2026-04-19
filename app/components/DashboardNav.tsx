'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/garage', label: 'My Garage' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/trading', label: 'Trading' },
  { href: '/auctions', label: 'Auctions' },
  { href: '/community', label: 'Community' },
];

export default function DashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin/moderation"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            pathname.startsWith('/admin')
              ? 'bg-red-600/20 text-red-400 border border-red-600/30'
              : 'text-red-500/70 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/40'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Moderation
        </Link>
      )}
    </nav>
  );
}
