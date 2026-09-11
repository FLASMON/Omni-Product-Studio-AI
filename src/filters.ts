// Post-production grade model.
//
// Everything here is pure CSS-filter maths: the renders themselves are never
// touched, we only stack filter primitives on the <video> element (and on the
// filter thumbnails) in a fixed, colour-correct order.

export interface VideoGrades {
  exposure: number;     // -100..100 → brightness()
  contrast: number;     // -100..100 → contrast()
  saturation: number;   // -100..100 → saturate()
  temperature: number;  // -100 (cool) .. 100 (warm) → sepia()/hue-rotate()
  grayscale: number;    // 0..100
  sepia: number;        // 0..100
  hue: number;          // -180..180 degrees
  invert: number;       // 0..100
  blur: number;         // 0..6 px — soft-focus looks
  filter: string;       // active look id, or 'custom' after manual slider edits
}

export const DEFAULT_GRADES: VideoGrades = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  grayscale: 0,
  sepia: 0,
  hue: 0,
  invert: 0,
  blur: 0,
  filter: 'none',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const isDefaultGrades = (g: VideoGrades) =>
  g.exposure === 0 &&
  g.contrast === 0 &&
  g.saturation === 0 &&
  g.temperature === 0 &&
  g.grayscale === 0 &&
  g.sepia === 0 &&
  g.hue === 0 &&
  g.invert === 0 &&
  g.blur === 0;

// Order matters: monochrome/duotone looks rely on grayscale → sepia →
// hue-rotate → saturate (the final saturate is what turns a sepia wash into a
// saturated duotone tint).
export function buildGradeFilter(g: VideoGrades): string {
  const parts: string[] = [];

  if (g.blur) parts.push(`blur(${g.blur.toFixed(2)}px)`);
  if (g.exposure !== 0) parts.push(`brightness(${(1 + g.exposure / 200).toFixed(3)})`);
  if (g.contrast !== 0) parts.push(`contrast(${(1 + g.contrast / 150).toFixed(3)})`);
  if (g.grayscale) parts.push(`grayscale(${clamp(g.grayscale, 0, 100).toFixed(0)}%)`);

  const sepiaAmount = clamp(g.sepia + Math.max(0, g.temperature) * 0.4, 0, 100);
  if (sepiaAmount) parts.push(`sepia(${sepiaAmount.toFixed(1)}%)`);

  const hueAmount = g.hue + (g.temperature < 0 ? (g.temperature / 100) * 15 : 0);
  if (hueAmount) parts.push(`hue-rotate(${hueAmount.toFixed(1)}deg)`);

  if (g.saturation !== 0) parts.push(`saturate(${Math.max(0, 1 + g.saturation / 100).toFixed(3)})`);
  if (g.invert) parts.push(`invert(${clamp(g.invert, 0, 100).toFixed(0)}%)`);

  return parts.join(' ');
}

export interface FilterLook {
  id: string;
  label: string;
  category: string;
  /** Anything omitted falls back to a neutral 0. */
  grades: Partial<Omit<VideoGrades, 'filter'>>;
}

export const FILTER_CATEGORIES = ['Cinematic', 'Retro', 'Mono', 'Vivid', 'Soft', 'Art'] as const;

/** Curated looks. Each one is a complete grade — selecting it replaces the last. */
export const FILTER_LOOKS: FilterLook[] = [
  // ── Cinematic ──────────────────────────────────────────────────────────
  { id: 'cinematic',      label: 'Cinematic',      category: 'Cinematic', grades: { contrast: 25, saturation: 8, temperature: 8 } },
  { id: 'teal-orange',    label: 'Teal & Orange',  category: 'Cinematic', grades: { contrast: 18, saturation: 15, temperature: 25, hue: -8 } },
  { id: 'hollywood',      label: 'Hollywood',      category: 'Cinematic', grades: { contrast: 20, saturation: -6, temperature: 12, exposure: 4 } },
  { id: 'soft-cinematic', label: 'Soft Cinematic', category: 'Cinematic', grades: { contrast: -6, saturation: -12, exposure: 4, temperature: 6 } },
  { id: 'bleach-bypass',  label: 'Bleach Bypass',  category: 'Cinematic', grades: { contrast: 40, saturation: -45, exposure: 6 } },
  { id: 'cold-blue',      label: 'Cold Blue',      category: 'Cinematic', grades: { temperature: -45, contrast: 12, saturation: -5 } },
  { id: 'warm-amber',     label: 'Warm Amber',     category: 'Cinematic', grades: { temperature: 50, exposure: 6, saturation: 10 } },
  { id: 'mystic',         label: 'Mystic',         category: 'Cinematic', grades: { contrast: 12, saturation: -18, temperature: -12, exposure: -4 } },
  { id: 'film-print',     label: 'Film Print',     category: 'Cinematic', grades: { contrast: 8, saturation: -8, sepia: 15, exposure: 3 } },
  { id: 'noir-cinema',    label: 'Noir Cinema',    category: 'Cinematic', grades: { grayscale: 100, contrast: 35 } },
  { id: 'dramatic',       label: 'Dramatic',       category: 'Cinematic', grades: { contrast: 45, saturation: -12, exposure: -8 } },

  // ── Retro ──────────────────────────────────────────────────────────────
  { id: 'vintage',        label: 'Vintage',        category: 'Retro', grades: { sepia: 35, contrast: 10, saturation: -25, exposure: 5 } },
  { id: 'sepia',          label: 'Sepia',          category: 'Retro', grades: { sepia: 65, contrast: 5, saturation: -15 } },
  { id: 'retro-70s',      label: '70s Retro',      category: 'Retro', grades: { sepia: 30, saturation: 10, temperature: 35, contrast: -5 } },
  { id: 'vaporwave',      label: '80s Vaporwave',  category: 'Retro', grades: { hue: -30, saturation: 35, temperature: 20, contrast: 8 } },
  { id: 'polaroid',       label: 'Polaroid',       category: 'Retro', grades: { exposure: 10, contrast: -12, saturation: 12, sepia: 12 } },
  { id: 'film-8mm',       label: '8mm Film',       category: 'Retro', grades: { sepia: 40, contrast: 18, saturation: -20, exposure: -3 } },
  { id: 'duotone-blue',   label: 'Duotone Blue',   category: 'Retro', grades: { grayscale: 100, sepia: 55, hue: 175, saturation: 180 } },
  { id: 'duotone-red',    label: 'Duotone Red',    category: 'Retro', grades: { grayscale: 100, sepia: 55, hue: -30, saturation: 200 } },
  { id: 'duotone-violet', label: 'Duotone Violet', category: 'Retro', grades: { grayscale: 100, sepia: 60, hue: 250, saturation: 190 } },
  { id: 'cross-process',  label: 'Cross Process',  category: 'Retro', grades: { contrast: 30, saturation: 25, hue: -12, exposure: 4 } },
  { id: 'faded-retro',    label: 'Faded Retro',    category: 'Retro', grades: { contrast: -20, saturation: -25, exposure: 8, sepia: 20 } },
  { id: 'lo-fi',          label: 'Lo-Fi',          category: 'Retro', grades: { contrast: 25, saturation: -25, sepia: 30, exposure: -2, blur: 0.3 } },

  // ── Mono ───────────────────────────────────────────────────────────────
  { id: 'black-white',    label: 'Black & White',  category: 'Mono', grades: { grayscale: 100 } },
  { id: 'high-contrast',  label: 'High Contrast',  category: 'Mono', grades: { grayscale: 100, contrast: 45 } },
  { id: 'low-key',        label: 'Low Key',        category: 'Mono', grades: { grayscale: 100, exposure: -30, contrast: 30 } },
  { id: 'silver',         label: 'Silver',         category: 'Mono', grades: { grayscale: 100, contrast: 15, exposure: 6 } },
  { id: 'film-noir',      label: 'Film Noir',      category: 'Mono', grades: { grayscale: 100, contrast: 50, exposure: -12 } },
  { id: 'cold-mono',      label: 'Cold Mono',      category: 'Mono', grades: { grayscale: 100, hue: 200, saturation: 30, contrast: 12 } },

  // ── Vivid ──────────────────────────────────────────────────────────────
  { id: 'vivid',          label: 'Vivid',          category: 'Vivid', grades: { saturation: 45, contrast: 18, exposure: 5 } },
  { id: 'vivid-warm',     label: 'Vivid Warm',     category: 'Vivid', grades: { saturation: 40, temperature: 35, contrast: 15 } },
  { id: 'vivid-cold',     label: 'Vivid Cold',     category: 'Vivid', grades: { saturation: 40, temperature: -35, contrast: 15 } },
  { id: 'pop',            label: 'Pop!',           category: 'Vivid', grades: { saturation: 70, contrast: 30 } },
  { id: 'sunny',          label: 'Sunny',          category: 'Vivid', grades: { exposure: 14, saturation: 25, temperature: 18 } },
  { id: 'saturated',      label: 'Saturated',      category: 'Vivid', grades: { saturation: 30, contrast: 8 } },
  { id: 'neon',           label: 'Neon',           category: 'Vivid', grades: { saturation: 85, contrast: 30, hue: -6 } },
  { id: 'punch',          label: 'Punch',          category: 'Vivid', grades: { contrast: 35, saturation: 20, exposure: -4 } },

  // ── Soft ───────────────────────────────────────────────────────────────
  { id: 'soft-glow',      label: 'Soft Glow',      category: 'Soft', grades: { exposure: 12, contrast: -14, saturation: 6, blur: 0.8 } },
  { id: 'dream',          label: 'Dream',          category: 'Soft', grades: { exposure: 14, contrast: -10, saturation: 14, temperature: 10, blur: 0.6 } },
  { id: 'pale',           label: 'Pale',           category: 'Soft', grades: { exposure: 16, contrast: -18, saturation: -20 } },
  { id: 'hazy',           label: 'Hazy',           category: 'Soft', grades: { exposure: 10, contrast: -22, sepia: 18, blur: 0.5 } },
  { id: 'frosted',        label: 'Frosted',        category: 'Soft', grades: { exposure: 8, saturation: -10, contrast: -10, hue: -10, blur: 1.2 } },
  { id: 'matte',          label: 'Matte',          category: 'Soft', grades: { contrast: -28, exposure: 6, saturation: -8 } },

  // ── Art ────────────────────────────────────────────────────────────────
  { id: 'negative',       label: 'Negative',       category: 'Art', grades: { invert: 100 } },
  { id: 'sketch',         label: 'Sketch',         category: 'Art', grades: { grayscale: 100, contrast: 60, exposure: 22 } },
  { id: 'xray',           label: 'X-Ray',          category: 'Art', grades: { invert: 100, grayscale: 40, blur: 0.6 } },
  { id: 'blueprint',      label: 'Blueprint',      category: 'Art', grades: { grayscale: 100, sepia: 60, hue: 200, saturation: 220, contrast: 15 } },
  { id: 'watercolor',     label: 'Watercolor',     category: 'Art', grades: { saturation: 30, contrast: -22, exposure: 14, hue: 8, blur: 1 } },
  { id: 'glitch',         label: 'Glitch',         category: 'Art', grades: { hue: -25, saturation: 60, contrast: 35, invert: 12 } },
];

/** Full grade for a look — used both on the player and on its thumbnail. */
export const gradesForLook = (look: FilterLook): VideoGrades => ({
  ...DEFAULT_GRADES,
  ...look.grades,
  filter: look.id,
});

/** CSS filter string for a look (memo-friendly: looks are static data). */
export const lookFilter = (look: FilterLook): string => buildGradeFilter(gradesForLook(look));

export const lookById = (id: string): FilterLook | undefined =>
  FILTER_LOOKS.find((l) => l.id === id);
