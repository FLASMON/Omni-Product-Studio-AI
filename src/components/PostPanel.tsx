import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Sun,
  Droplets,
  Wand2,
  RotateCcw,
  Clapperboard,
  Palette,
  Check,
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
        className={`w-full h-1.5 rounded-full appearance-none bg-zinc-800 accent-zinc-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-200 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-400 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-200 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-zinc-400`}
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
      className={`group relative overflow-hidden rounded-xl border transition-all duration-150 active:scale-[0.97] ${
        active
          ? 'border-white shadow-lg shadow-white/10 ring-1 ring-white/70'
          : 'border-zinc-800 hover:border-zinc-500'
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
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 truncate px-1.5 py-1 text-left text-[9px] font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {look.label}
        </span>
        {active && (
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-zinc-950 shadow">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
      </div>
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

  const set = (key: keyof Omit<VideoGrades, 'filter'>) => (v: number) =>
    onChange((prev) => ({ ...prev, [key]: v, filter: 'custom' }));

  // Selecting a look is a full grade replacement — sliders then fine-tune it.
  const applyLook = (look: FilterLook) => onChange(gradesForLook(look));

  const reset = () => onChange({ ...DEFAULT_GRADES });

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
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex-1 min-h-0 px-5 md:px-6 py-5 space-y-6 md:overflow-y-auto thin-scrollbar">
        {!videoReady && (
          <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
            <Clapperboard className="w-4 h-4 mt-0.5 shrink-0 text-zinc-500" />
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Render a video to preview your grade live — adjustments apply instantly to the player and thumbnails.
            </p>
          </div>
        )}

        {/* VIDEO FILTERS — the full look gallery */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800">
                <Wand2 className="h-3.5 w-3.5 text-zinc-200" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-200">All Filters</p>
                <p className="text-[10px] text-zinc-500 truncate">Color grading & visual effects</p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-400">
              {FILTER_LOOKS.length} items
            </span>
          </div>

          {/* Category chips */}
          <div className="hide-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
            {['All', ...FILTER_CATEGORIES].map((cat) => {
              const active = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium transition-all duration-150 ${
                    active
                      ? 'border-white/90 bg-white text-zinc-950'
                      : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Tile grid — each thumb previews the look on the current frame */}
          <div className="grid grid-cols-2 gap-2">
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

          <div className="mt-3 flex items-center justify-between text-[10px]">
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
        <section>
          <SectionLabel icon={<Sun className="w-3.5 h-3.5" />} title="Lighting" />
          <div className="space-y-4">
            <GradeSlider label="Exposure" value={grades.exposure} onChange={set('exposure')} />
            <GradeSlider label="Contrast" value={grades.contrast} onChange={set('contrast')} />
          </div>
        </section>

        {/* COLOR CORRECTION */}
        <section>
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
    </div>
  );
}
