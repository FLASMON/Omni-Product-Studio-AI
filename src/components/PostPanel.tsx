import React from 'react';
import { SlidersHorizontal, Sun, Droplets, Wand2, RotateCcw, Clapperboard, Palette } from 'lucide-react';

// Video grade state — pure CSS-filter values applied live to the player.
export interface VideoGrades {
  exposure: number;     // -100..100 → brightness()
  contrast: number;     // -100..100 → contrast()
  saturation: number;   // -100..100 → saturate()
  temperature: number;  // -100 (cool) .. 100 (warm) → sepia()/hue-rotate()
  filter: string;       // active preset id, or 'custom' after manual slider edits
}

export const DEFAULT_GRADES: VideoGrades = {
  exposure: 0, contrast: 0, saturation: 0, temperature: 0, filter: 'none',
};

export const isDefaultGrades = (g: VideoGrades) =>
  g.exposure === 0 && g.contrast === 0 && g.saturation === 0 && g.temperature === 0;

// Build the CSS filter string for the current grade values.
export function buildGradeFilter(g: VideoGrades): string {
  if (isDefaultGrades(g)) return '';
  const parts: string[] = [];
  if (g.exposure !== 0) parts.push(`brightness(${(1 + g.exposure / 200).toFixed(3)})`);
  if (g.contrast !== 0) parts.push(`contrast(${(1 + g.contrast / 150).toFixed(3)})`);
  if (g.saturation !== 0) parts.push(`saturate(${Math.max(0, 1 + g.saturation / 100).toFixed(3)})`);
  if (g.temperature > 0) parts.push(`sepia(${((g.temperature / 100) * 0.4).toFixed(3)})`);
  else if (g.temperature < 0) parts.push(`hue-rotate(${((g.temperature / 100) * 15).toFixed(2)}deg)`);
  return parts.join(' ');
}

// One-shot looks. Each simply presets the sliders — the sliders stay the
// single source of truth, so a preset can always be fine-tuned by hand.
const FILTER_PRESETS: { id: string; label: string; grades: Omit<VideoGrades, 'filter'> }[] = [
  { id: 'none',     label: 'None',     grades: { exposure: 0,  contrast: 0,  saturation: 0,   temperature: 0 } },
  { id: 'cinema',   label: 'Cinematic', grades: { exposure: -5, contrast: 25, saturation: 10,  temperature: 8 } },
  { id: 'noir',     label: 'Noir',     grades: { exposure: 0,  contrast: 40, saturation: -100, temperature: 0 } },
  { id: 'vintage',  label: 'Vintage',  grades: { exposure: 5,  contrast: 10, saturation: -25, temperature: 35 } },
  { id: 'vivid',    label: 'Vivid',    grades: { exposure: 5,  contrast: 20, saturation: 40,  temperature: 0 } },
  { id: 'arctic',   label: 'Arctic',   grades: { exposure: 0,  contrast: 15, saturation: -10, temperature: -45 } },
  { id: 'sunset',   label: 'Sunset',   grades: { exposure: 8,  contrast: 12, saturation: 20,  temperature: 55 } },
];

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

interface VideoPostControlsProps {
  grades: VideoGrades;
  onChange: React.Dispatch<React.SetStateAction<VideoGrades>>;
  videoReady: boolean;
}

export function PostPanel({ grades, onChange, videoReady }: VideoPostControlsProps) {
  const set = (key: keyof Omit<VideoGrades, 'filter'>) => (v: number) =>
    onChange((prev) => ({ ...prev, [key]: v, filter: 'custom' }));

  const applyPreset = (id: string) =>
    onChange((prev) => {
      const preset = FILTER_PRESETS.find((p) => p.id === id);
      return preset ? { ...preset.grades, filter: id } : prev;
    });

  const reset = () => onChange({ ...DEFAULT_GRADES });

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

        {/* VIDEO FILTERS */}
        <section>
          <SectionLabel icon={<Wand2 className="w-3.5 h-3.5" />} title="Video Filters" />
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((preset) => {
              const active = grades.filter === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`filter-${preset.id}`}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-150 ${
                    active
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          {grades.filter === 'custom' && !isDefaultGrades(grades) && (
            <p className="mt-2.5 text-[10px] text-zinc-500 flex items-center gap-1.5">
              <Palette className="w-3 h-3" /> Custom grade
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
