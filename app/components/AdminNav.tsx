'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/moderation', label: 'Moderation' },
];

export default function AdminNav() {
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
      <span className="ml-2 px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-800/50">
        Admin
      </span>
    </nav>
  );
}
