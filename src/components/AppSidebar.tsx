import React from 'react';
import { Clapperboard, CircleHelp, Film, History, Wand2, type LucideIcon } from 'lucide-react';

export type AppPage = 'studio' | 'media' | 'renders';

interface NavEntry {
  id: AppPage;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const NAV: NavEntry[] = [
  { id: 'studio', label: 'Studio', hint: 'Build & render', icon: Wand2 },
  { id: 'media', label: 'Media', hint: 'Stock library', icon: Film },
  { id: 'renders', label: 'Renders', hint: 'This session', icon: History },
];

interface AppSidebarProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  /** Number of rendered versions available in the Renders tab. */
  renderCount: number;
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-zinc-950 bg-emerald-400 px-1 text-center text-[9px] font-bold leading-[16px] text-zinc-950 shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Vertical icon rail (desktop) / horizontal icon strip (mobile) that switches
 * between the app's top-level pages. Icons only, with a floating label on hover.
 */
export function AppSidebar({ page, onNavigate, renderCount }: AppSidebarProps) {
  const items = NAV.map((entry) => ({
    ...entry,
    badge: entry.id === 'renders' ? renderCount : 0,
  }));

  return (
    <>
      {/* ── DESKTOP RAIL ─────────────────────────────────────────────── */}
      <nav
        id="app-nav-rail"
        aria-label="Primary"
        className="hidden md:flex md:w-[76px] md:shrink-0 flex-col items-center gap-1.5 border-r border-zinc-800/80 bg-zinc-950/60 py-4"
      >
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg shadow-black/40">
          <Clapperboard className="h-[18px] w-[18px] text-zinc-100" />
        </div>
        <span className="mb-3 mt-3 select-none text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
          Menu
        </span>

        {items.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className="group relative">
              <button
                id={`nav-${item.id}`}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition-all duration-200 active:scale-95 ${
                  active
                    ? 'border-white/90 bg-white text-zinc-950 shadow-lg shadow-white/10'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                {item.badge > 0 && !active && <Badge count={item.badge} />}
              </button>

              {/* Hover label — floats out of the rail */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 flex -translate-y-1/2 -translate-x-1 items-center gap-2 whitespace-nowrap rounded-xl border border-zinc-700/80 bg-zinc-900/95 px-3 py-1.5 text-xs font-medium text-zinc-100 opacity-0 shadow-xl shadow-black/60 backdrop-blur transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
              >
                {item.label}
                <span className="text-[10px] font-normal text-zinc-500">{item.hint}</span>
              </span>
            </div>
          );
        })}

        <div className="mt-auto flex w-full flex-col items-center gap-3 pt-4">
          <span className="h-px w-8 bg-zinc-800" />
          <div className="group relative">
            <button
              type="button"
              aria-label="Help & licensing"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-transparent text-zinc-500 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-white"
            >
              <CircleHelp className="h-[18px] w-[18px]" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-1/2 left-full z-40 ml-3 translate-y-1/2 -translate-x-1 whitespace-nowrap rounded-xl border border-zinc-700/80 bg-zinc-900/95 px-3 py-1.5 text-xs font-medium text-zinc-100 opacity-0 shadow-xl shadow-black/60 backdrop-blur transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
            >
              Stock footage by Mixkit · Free License
            </span>
          </div>
          <span className="select-none text-[10px] font-medium text-zinc-600">v1.1</span>
        </div>
      </nav>

      {/* ── MOBILE STRIP ─────────────────────────────────────────────── */}
      <nav
        id="app-nav-strip"
        aria-label="Primary"
        className="md:hidden flex shrink-0 items-center gap-1 border-b border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2 overflow-x-auto hide-scrollbar"
      >
        {items.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'border-white/90 bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge > 0 && !active && (
                <span className="rounded-full bg-emerald-400 px-1.5 text-[9px] font-bold text-zinc-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Page heading used at the top of the Media / Renders pages. */
export function PageHeading({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-zinc-700/70 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg shadow-black/40">
          <Icon className="h-5 w-5 text-zinc-100" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
