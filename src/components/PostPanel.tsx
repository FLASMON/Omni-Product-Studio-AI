import React, { useMemo, useRef, useState } from 'react';
import {
  SlidersHorizontal,
  Sun,
  Droplets,
  Wand2,
  RotateCcw,
  Clapperboard,
  Palette,
  Check,
  LayoutGrid,
  Radio,
  Contrast,
  Feather,
  Brush,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import {
  VideoGrades,
  DEFAULT_GRADES,
  isDefaultGrades,
  FILTER_CATEGORIES,
  FILTER_LOOKS,
  FilterLook,
  gradesForLook,
  lookFilter,
} from '../filters.js';

/** One glyph per category — used by the tabs and the overflow menu. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Cinematic: Clapperboard,
  Retro: Radio,
  Mono: Contrast,
  Vivid: Palette,
  Soft: Feather,
  Art: Brush,
};

const CATEGORY_GLYPH: LucideIcon = Wand2;


interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function GradeSlider({ label, value, onChange, disabled = false }: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-zinc-400">{label}</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
          value !== 0
            ? 'text-zinc-200 bg-zinc-800 border-zinc-700'
            : 'text-zinc-500 bg-zinc-900 border-zinc-800'
        }`}>
          {value > 0 ? `+${value}` : `${value}`}
        </span>
      </div>
      <input
        type="range"
        min={-100}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none bg-zinc-800 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:bg-primary-hover
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary`}
      />
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{title}</span>
      <span className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

/** One look: the preview frame with that look's filter baked in. */
function FilterTile({
  look,
  css,
  previewSrc,
  active,
  onSelect,
}: {
  look: FilterLook;
  css: string;
  previewSrc?: string;
  active: boolean;
  onSelect: () => void;
  /** Declared so React's list key typechecks — this project has no @types/react. */
  key?: string | number;
}) {
  return (
    <button
      key={look.id}
      id={`filter-${look.id}`}
      type="button"
      onClick={onSelect}
      title={look.label}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-lg border transition-all duration-150 active:scale-[0.97] ${
        active
          ? 'border-primary shadow-lg shadow-primary/25 ring-1 ring-primary'
          : 'border-zinc-800 hover:border-primary/60'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900">
        {previewSrc && (
          <img
            src={previewSrc}
            alt=""
            aria-hidden
            loading="lazy"
            style={{ filter: css || undefined }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 truncate px-1.5 py-1 text-left text-[8px] font-bold uppercase tracking-wide text-on-dark drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {look.label}
        </span>
        {active && (
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-on-primary shadow">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

/** Category tab: glyph over label, the way the reference panel does it. */
function CategoryTab({
  category,
  icon: Icon,
  active,
  onSelect,
}: {
  category: string;
  icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
  /** Declared so React's list key typechecks — this project has no @types/react. */
  key?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={category}
      className={`flex w-[56px] shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-all duration-150 active:scale-95 ${
        active ? 'bg-primary/12 text-primary' : 'text-zinc-500 hover:bg-primary/8 hover:text-primary'
      }`}
    >
      <Icon className={`h-[15px] w-[15px] transition-colors ${active ? 'text-primary' : ''}`} strokeWidth={active ? 2.3 : 1.9} />
      <span className="max-w-full truncate text-[9px] font-semibold leading-none">{category}</span>
    </button>
  );
}

interface VideoPostControlsProps {
  grades: VideoGrades;
  onChange: React.Dispatch<React.SetStateAction<VideoGrades>>;
  videoReady: boolean;
  /** Frame used to preview the looks — the current render, or a stock still. */
  previewSrc?: string;
}

export function PostPanel({ grades, onChange, videoReady, previewSrc }: VideoPostControlsProps) {
  const [category, setCategory] = useState('All');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof Omit<VideoGrades, 'filter'>) => (v: number) =>
    onChange((prev) => ({ ...prev, [key]: v, filter: 'custom' }));

  // Selecting a look is a full grade replacement — sliders then fine-tune it.
  const applyLook = (look: FilterLook) => onChange(gradesForLook(look));

  const reset = () => onChange({ ...DEFAULT_GRADES });

  // Tab bar entries with their look count, and the gallery for the active tab.
  const tabs = useMemo(
    () =>
      ['All', ...FILTER_CATEGORIES].map((cat) => ({
        category: cat,
        icon: CATEGORY_ICONS[cat] ?? CATEGORY_GLYPH,
        count: cat === 'All' ? FILTER_LOOKS.length : FILTER_LOOKS.filter((l) => l.category === cat).length,
      })),
    [],
  );

  // Looks are static data, so their CSS is computed once.
  const tiles = useMemo(
    () =>
      FILTER_LOOKS.filter((l) => category === 'All' || l.category === category).map((look) => ({
        look,
        css: lookFilter(look),
      })),
    [category],
  );

  const activeLook = FILTER_LOOKS.find((l) => l.id === grades.filter);

  // Picking a category always reveals the gallery it filters.
  const chooseCategory = (cat: string) => {
    setCategory(cat);
    setMenuOpen(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* PANEL HEADER */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 md:px-6 md:pt-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 shrink-0 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-zinc-300" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white leading-tight">Post-Production</h2>
            <p className="text-[10px] text-zinc-500 leading-tight">Lighting · Color · Filters</p>
          </div>
        </div>
        <button
          id="grade-reset-btn"
          onClick={reset}
          disabled={isDefaultGrades(grades)}
          title="Reset all adjustments"
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CONTROLS — one scroll container on every layout (the mobile sheet has
          its own fixed height, so it needs to scroll there too). */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {!videoReady && (
          <div className="mx-5 mt-5 flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3 md:mx-6">
            <Clapperboard className="w-4 h-4 mt-0.5 shrink-0 text-zinc-500" />
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Render a video to preview your grade live — adjustments apply instantly to the player and thumbnails.
            </p>
          </div>
        )}

        {/* VIDEO FILTERS — the full look gallery. Header and category chips stay
            pinned to the top while the looks scroll underneath. */}
        <section>
          <div className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-900/95 px-5 pb-3 pt-5 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/12">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-100">All Filters</p>
                  <p className="text-[10px] text-zinc-500 truncate">Color grading and visual effects</p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[10px] font-semibold text-zinc-400">
                {tiles.length === FILTER_LOOKS.length ? FILTER_LOOKS.length : `${tiles.length}/${FILTER_LOOKS.length}`} items
              </span>
            </div>
          </div>

          {/* Tile grid — each thumb previews the look on the current frame */}
          <div className="grid grid-cols-3 gap-1.5 px-5 pt-4 md:px-6">
            {tiles.map(({ look, css }) => (
              <FilterTile
                key={look.id}
                look={look}
                css={css}
                previewSrc={previewSrc}
                active={grades.filter === look.id}
                onSelect={() => applyLook(look)}
              />
            ))}
          </div>

          <div className="mx-5 mt-3 flex items-center justify-between text-[10px] md:mx-6">
            <span className="text-zinc-500">
              {activeLook ? activeLook.label : grades.filter === 'custom' ? 'Custom grade' : 'No filter'}
            </span>
            {grades.filter === 'custom' && !isDefaultGrades(grades) && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Palette className="w-3 h-3" /> tuned by hand
              </span>
            )}
          </div>
        </section>

        {/* LIGHTING */}
        <section className="px-5 pt-6 md:px-6">
          <SectionLabel icon={<Sun className="w-3.5 h-3.5" />} title="Lighting" />
          <div className="space-y-4">
            <GradeSlider label="Exposure" value={grades.exposure} onChange={set('exposure')} />
            <GradeSlider label="Contrast" value={grades.contrast} onChange={set('contrast')} />
          </div>
        </section>

        {/* COLOR CORRECTION */}
        <section className="px-5 pb-5 pt-6 md:px-6">
          <SectionLabel icon={<Droplets className="w-3.5 h-3.5" />} title="Color Correction" />
          <div className="space-y-4">
            <GradeSlider label="Saturation" value={grades.saturation} onChange={set('saturation')} />
            <GradeSlider label="Temperature" value={grades.temperature} onChange={set('temperature')} />
            <div className="flex justify-between text-[9px] uppercase tracking-wider text-zinc-600 px-0.5 -mt-2">
              <span>Cool</span>
              <span>Warm</span>
            </div>
          </div>
        </section>
      </div>

      {/* CATEGORY TABS — pinned to the bottom of the panel; the last slot opens
          a menu with every category (and its look count). */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/70 px-2 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <div className="hide-scrollbar flex items-center gap-0.5 overflow-x-auto">
              {tabs.map(({ category: cat, icon }) => (
                <CategoryTab
                  key={cat}
                  category={cat}
                  icon={icon}
                  active={cat === category}
                  onSelect={() => chooseCategory(cat)}
                />
              ))}
            </div>
            {/* Fade hinting that more tabs are reachable by scrolling */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-zinc-900 to-transparent" />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              id="filter-category-more"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="All categories"
              title="All categories"
              onClick={() => setMenuOpen((o) => !o)}
              className={`grid h-10 w-8 place-items-center rounded-lg transition-colors ${
                menuOpen ? 'bg-primary/12 text-primary' : 'text-zinc-500 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div
                  role="menu"
                  className="absolute bottom-full right-0 z-40 mb-2 w-44 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl shadow-black/80"
                >
                  <p className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Categories
                  </p>
                  {tabs.map(({ category: cat, icon: Icon, count }) => (
                    <button
                      key={cat}
                      role="menuitemradio"
                      aria-checked={cat === category}
                      onClick={() => chooseCategory(cat)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        cat === category ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="flex-1 truncate">{cat}</span>
                      <span className="text-[10px] tabular-nums text-zinc-600">{count}</span>
                      {cat === category && <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
