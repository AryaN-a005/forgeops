'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Dashboard' },
  { href: '/organizations', label: 'Organizations' },
  { href: '/projects', label: 'Projects' },
  { href: '/deployments', label: 'Deployments' },
  { href: '/clusters', label: 'Clusters' },
  { href: '/monitoring', label: 'Monitoring' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-neutral-950 md:block">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold tracking-tight text-white">
          ForgeOps
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-500">
          Deployment Platform
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'block rounded-xl px-3 py-2.5 text-sm transition',
                active
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}