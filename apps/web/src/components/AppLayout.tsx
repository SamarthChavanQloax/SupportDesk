import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: 'Tickets', to: '/tickets' },
];

/**
 * Responsive Navy + Slate application shell with a persistent desktop sidebar
 * and an accessible slide-over mobile drawer so content is never squished.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#172B4D] text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D9488] text-sm font-bold text-white shadow-xs">
            SD
          </span>
          <span className="text-base font-bold tracking-tight">SupportDesk</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close navigation menu"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            &times;
          </span>
        </button>
      </div>

      <div className="px-3 pt-5">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace
        </p>
        <nav aria-label="Primary navigation" className="mt-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-white">
            {user?.name ?? 'Authenticated User'}
          </p>
          <p className="truncate text-xs text-slate-300">{user?.email ?? ''}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#334155]">
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">{sidebarContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation backdrop"
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-50 w-64 max-w-[80vw] shadow-xl">{sidebarContent}</aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 md:hidden"
              aria-label="Open navigation menu"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#172B4D] md:hidden">SupportDesk</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
                <span className="rounded-full bg-[#0D9488]/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#0D9488]">
                  {user.role}
                </span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

