import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Grid3x3,
  Play,
  Search,
  X,
} from 'lucide-react';

export interface LibraryItem {
  id: string;
  title: string;
  /** Small line under the title (tags, prompt excerpt, …). */
  subtitle?: string;
  /** Chip / filter label. */
  category: string;
  /** Extra free-text search terms. */
  keywords?: string[];
  poster?: string;
  src: string;
  downloadUrl?: string;
  /** Small badge shown top-right of the card (resolution, version label, …). */
  badge?: string;
  /** CSS filter string — used to preview the post-production grade. */
  filter?: string;
  /** `metadata` renders the first frame without a poster; `none` waits for hover. */
  preload?: 'none' | 'metadata';
}

export interface LibraryAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

interface MediaLibraryProps {
  /** Declared so React's list key typechecks — this project has no @types/react. */
  key?: string | number;
  items: LibraryItem[];
  emptyTitle: string;
  emptyBody: string;
  /** Extra buttons exposed in the preview modal footer. */
  getActions?: (item: LibraryItem) => LibraryAction[];
  /** Noun used in the count line — defaults to "clip". */
  noun?: string;
  /** Rendered between the heading and the search / filter bar. */
  children?: React.ReactNode;
}

/** A video card whose clip fills the entire card, playing on hover. */
function MediaCard({
  item,
  index,
  onOpen,
  onEnter,
  onLeave,
  registerRef,
}: {
  item: LibraryItem;
  index: number;
  onOpen: () => void;
  onEnter: () => void;
  onLeave: () => void;
  registerRef: (id: string, el: HTMLVideoElement | null) => void;
  /** Declared so React's list key typechecks — this project has no @types/react. */
  key?: string | number;
}) {
  return (
    <article
      className="fade-up group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/60"
      style={{ animationDelay: `${Math.min(index, 14) * 32}ms` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* The clip itself is the card surface — absolutely filling the frame. */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        <video
          ref={(el) => registerRef(item.id, el)}
          src={item.src}
          poster={item.poster}
          preload={item.preload ?? 'none'}
          muted
          loop
          playsInline
          style={{ filter: item.filter || undefined }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
        />

        {/* Legibility scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/30 transition-opacity duration-300 group-hover:from-black/80" />

        {/* Top badges */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
          <span className="truncate rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-100 backdrop-blur-md">
            {item.category}
          </span>
          {item.badge && (
            <span className="shrink-0 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
              {item.badge}
            </span>
          )}
        </div>

        {/* Hover play affordance */}
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <span className="grid h-12 w-12 translate-y-1 scale-90 place-items-center rounded-full border border-white/30 bg-white/95 text-zinc-950 opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
            <Play className="h-4 w-4 translate-x-[1px] fill-current" />
          </span>
        </div>

        {/* Title block */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3.5">
          <h3 className="truncate text-[13px] font-semibold text-white drop-shadow">{item.title}</h3>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-400">{item.subtitle}</p>
          )}
        </div>

        {/* Click target sits above the video, below the badges */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Preview ${item.title}`}
          className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
        />
      </div>
    </article>
  );
}

/**
 * Browsable video library: responsive grid of full-bleed clip cards, category
 * chips, search and an enlarge-and-play preview modal.
 */
export function MediaLibrary({
  items,
  emptyTitle,
  emptyBody,
  getActions,
  noun = 'clip',
  children,
}: MediaLibraryProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Playing state is tracked outside React state: hover must not re-render the grid.
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const playingId = useRef<string | null>(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      const haystack = [item.title, item.subtitle, item.category, ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, category]);

  // A category filter can leave the selection dangling.
  useEffect(() => {
    if (openIndex !== null && openIndex >= filtered.length) setOpenIndex(null);
  }, [filtered.length, openIndex]);

  // Hover preview: only ever one clip plays at a time.
  const hoverIn = (id: string) => {
    const previous = playingId.current;
    if (previous && previous !== id) videoRefs.current[previous]?.pause();
    const el = videoRefs.current[id];
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    }
    playingId.current = id;
  };

  const hoverOut = (id: string) => {
    videoRefs.current[id]?.pause();
    if (playingId.current === id) playingId.current = null;
  };

  const registerRef = (id: string, el: HTMLVideoElement | null) => {
    videoRefs.current[id] = el;
  };

  const openItem = openIndex !== null ? filtered[openIndex] : null;

  // Esc closes, arrows step through the filtered list.
  useEffect(() => {
    if (!openItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null);
      else if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : (i + 1) % filtered.length));
      else if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItem, filtered.length]);

  // Lock background scroll while the modal is up.
  useEffect(() => {
    if (!openItem) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openItem]);

  const actions = openItem && getActions ? getActions(openItem) : [];

  return (
    <div className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto thin-scrollbar">
      {/* STICKY TOOLBAR — the heading, the category tabs and the search stay
          pinned while the grid scrolls underneath. */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-5 pt-5 pb-2.5 md:px-8 md:pt-6 md:pb-3">
        {children}

        {/* SEARCH + FILTER BAR — pointless until there is something to filter */}
        {items.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {categories.map((cat) => {
              const active = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                    active
                      ? 'border-white/90 bg-white text-zinc-950 shadow-md shadow-white/10'
                      : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative shrink-0 lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clips, tags, styles…"
              aria-label="Search media"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-9 pr-9 text-xs text-zinc-100 placeholder:text-zinc-600 transition-colors hover:border-zinc-700 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        )}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 pt-4 pb-10 md:px-8">
        {/* RESULT COUNT */}
        {items.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-[11px] text-zinc-500">
          <Grid3x3 className="h-3.5 w-3.5" />
          <span>
            <span className="font-medium text-zinc-300">{filtered.length}</span>
            {filtered.length === items.length
              ? ` ${noun}${items.length === 1 ? '' : 's'}`
              : ` of ${items.length} ${noun}s`}
            {category !== 'All' && <span className="text-zinc-600"> · {category}</span>}
          </span>
        </div>
        )}

        {/* GRID */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((item, i) => (
              <MediaCard
                key={`${category}-${query}-${item.id}`}
                item={item}
                index={i}
                onOpen={() => setOpenIndex(i)}
                onEnter={() => hoverIn(item.id)}
                onLeave={() => hoverOut(item.id)}
                registerRef={registerRef}
              />
            ))}
          </div>
        ) : (
          <div className="fade-up relative flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_68%)]" />
            <span className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
              <Film className="h-7 w-7 text-zinc-500" />
            </span>
            <h3 className="text-base font-semibold text-zinc-100">{emptyTitle}</h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">{emptyBody}</p>
            {(query || category !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                }}
                className="mt-5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setOpenIndex(null)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={openItem.title}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-700/70 bg-zinc-950 shadow-2xl shadow-black/80"
            >
              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">{openItem.title}</h2>
                  <p className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-zinc-500">
                    <span className="rounded-full border border-zinc-700/80 bg-zinc-900 px-2 py-0.5 font-medium uppercase tracking-wider text-zinc-400">
                      {openItem.category}
                    </span>
                    {openItem.subtitle && <span className="truncate">{openItem.subtitle}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  aria-label="Close preview"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Player */}
              <div className="relative min-h-0 flex-1 bg-black">
                <video
                  key={openItem.id}
                  src={openItem.src}
                  poster={openItem.poster}
                  style={{ filter: openItem.filter || undefined }}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="max-h-[62vh] w-full bg-black object-contain"
                />

                {filtered.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous clip"
                      onClick={() => setOpenIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length))}
                      className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/85"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next clip"
                      onClick={() => setOpenIndex((i) => (i === null ? i : (i + 1) % filtered.length))}
                      className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/85"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-5 py-3.5">
                <span className="text-[11px] text-zinc-500">
                  {openIndex !== null ? `${openIndex + 1} / ${filtered.length}` : ''}
                  {openItem.badge ? ` · ${openItem.badge}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={
                        action.primary
                          ? 'inline-flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 active:scale-[0.98]'
                          : 'inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98]'
                      }
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                  {openItem.downloadUrl && (
                    <a
                      href={openItem.downloadUrl}
                      className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
