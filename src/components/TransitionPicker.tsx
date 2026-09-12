import React from 'react';
import {
  AudioLines,
  Blend,
  CheckCircle2,
  Scissors,
  Shapes,
  Wand2,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { TRANSITION_STYLES, transitionById } from '../transitions.js';

/** One icon per transition style — mirrors the card's icon language. */
const STYLE_ICONS: Record<string, LucideIcon> = {
  director: Wand2,
  'hard-cut': Scissors,
  crossfade: Blend,
  'whip-pan': Wind,
  'match-cut': Shapes,
  'l-cut': AudioLines,
};

interface TransitionPickerProps {
  /** Active transition style id. */
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

/**
 * Step 03 of the builder: how successive shots should flow in the generated
 * commercial. Purely a prompt input — the chosen style is forwarded to the
 * prompt writer on the server and has no client-side effect.
 */
export function TransitionPicker({ value, onChange, disabled = false }: TransitionPickerProps) {
  const selected = transitionById(value);

  return (
    <div
      id="transition-picker-card"
      className="mb-6 p-5 rounded-2xl border bg-zinc-950 border-zinc-700 shadow-lg shadow-black/30 transition-all duration-200"
    >
      {/* CARD HEADER — same anatomy as the uploader cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center shadow-sm">
            03
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Shot Transitions
          </h2>
        </div>

        {selected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            {selected.label}
          </span>
        )}
      </div>

      {/* STYLE CHIPS */}
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Transition style
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TRANSITION_STYLES.map((style) => {
          const isSelected = style.id === value;
          const Icon = STYLE_ICONS[style.id] ?? Wand2;
          return (
            <button
              key={style.id}
              id={`transition-chip-${style.id}`}
              type="button"
              onClick={() => onChange(style.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary font-semibold shadow-md shadow-primary/25 scale-[1.02]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-primary/50 hover:text-primary hover:bg-primary/8'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Icon className="w-3 h-3" />
              {style.label}
            </button>
          );
        })}
      </div>

      {/* HINT for the active style */}
      {selected && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          {selected.hint}
        </p>
      )}
    </div>
  );
}
