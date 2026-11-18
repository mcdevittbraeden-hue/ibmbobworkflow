import Link from 'next/link';
import clsx from 'clsx';

/**
 * Shared top navigation (Relay design: white bar, bottom border, black
 * rounded logo mark, pill links). One place to add a page for every screen.
 */

export type NavKey = 'dashboard' | 'study' | 'campus' | 'relay' | 'career';

const LINKS: Array<{ key: NavKey; href: string; label: string }> = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'study', href: '/study', label: 'Study Coach' },
  { key: 'campus', href: '/campus', label: 'Campus' },
  { key: 'relay', href: '/relay', label: 'Relay' },
  { key: 'career', href: '/career', label: 'Career' },
];

export function AppNav({ active, email }: { active: NavKey; email?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-2.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-ink text-sm font-black text-white">F</span>
          <span className="text-base font-extrabold tracking-[-.4px] text-ink">FriarAI</span>
        </Link>

        <nav aria-label="Main" className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {LINKS.map((l) =>
            l.key === active ? (
              <span key={l.key} aria-current="page" className="flex-shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-bold text-white">
                {l.label}
              </span>
            ) : (
              <Link
                key={l.key}
                href={l.href}
                className={clsx('flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface hover:text-ink')}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-3 md:flex">
          {email && <span className="text-[13px] text-muted">{email}</span>}
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">Demo</span>
        </div>
      </div>
    </header>
  );
}
