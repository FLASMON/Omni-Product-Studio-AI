// Curated stock-footage library for the Media page.
//
// Source: Mixkit free stock videos (Mixkit Free License — free for commercial
// use, no attribution required). Clips are hot-linked from Mixkit's CDN, which
// serves them with `Access-Control-Allow-Origin: *` and byte-range support, so
// they stream and seek directly in the browser.
//
// Every entry below was verified to respond 200/206 for both the 720p stream and
// the poster frame. `maxRes` is the highest variant the CDN actually holds for
// that clip (a few only exist at 720p) — used for the "download" URL only.

export interface StockCategory {
  id: string;
  label: string;
}

export type StockCategoryId =
  | 'product'
  | 'beauty'
  | 'food'
  | 'tech'
  | 'lifestyle'
  | 'atmosphere'
  | 'abstract';

export interface StockVideo {
  id: string;
  title: string;
  category: StockCategoryId;
  tags: string[];
  poster: string;
  src: string;        // 720p stream used in the grid + preview player
  download: string;   // highest available variant
  res: string;        // badge label
}

export const STOCK_CATEGORIES: StockCategory[] = [
  { id: 'product', label: 'Product' },
  { id: 'beauty', label: 'Beauty & Care' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'tech', label: 'Tech' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'atmosphere', label: 'Atmosphere' },
  { id: 'abstract', label: 'Abstract' },
];

const stream = (id: string, res: 360 | 720 | 1080) =>
  `https://assets.mixkit.co/videos/${id}/${id}-${res}.mp4`;
const poster = (id: string) =>
  `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`;

function stock(
  id: string,
  title: string,
  category: StockCategoryId,
  tags: string[],
  maxRes: 720 | 1080 = 1080,
): StockVideo {
  return {
    id,
    title,
    category,
    tags,
    poster: poster(id),
    src: stream(id, 720),
    download: stream(id, maxRes),
    res: maxRes === 1080 ? 'Full HD' : 'HD',
  };
}

export const STOCK_VIDEOS: StockVideo[] = [
  // ── Product ────────────────────────────────────────────────────────────
  stock('44119', 'Product Photo Set', 'product', ['studio', 'photographer', 'e-commerce']),
  stock('10424', 'Turntable Fruit Bowl', 'product', ['turntable', 'white bg', 'styling']),
  stock('6102', 'Grocery Shelves', 'product', ['retail', 'shelves', 'aisle'], 720),
  stock('2801', 'Honey Drizzle', 'product', ['macro', 'pour', 'food styling']),
  stock('235', 'Roasted Coffee Beans', 'product', ['macro', 'texture', 'beverage']),
  stock('4058', 'Makeup Flat Lay', 'product', ['cosmetics', 'colour', 'close-up']),

  // ── Beauty & Care ──────────────────────────────────────────────────────
  stock('50406', 'UGC Skincare Shoot', 'beauty', ['ugc', 'smartphone', 'creator']),
  stock('50412', 'Sheet Mask Routine', 'beauty', ['skincare', 'routine', 'clean']),
  stock('51185', 'Cream Ritual', 'beauty', ['skincare', 'soft light', 'portrait']),
  stock('51187', 'Spa Robe Skincare', 'beauty', ['spa', 'wellness', 'calm']),

  // ── Food & Drink ───────────────────────────────────────────────────────
  stock('15954', 'Orange Juice Pour', 'food', ['beverage', 'pour', 'macro'], 720),
  stock('15958', 'Tomato Juice Pour', 'food', ['beverage', 'pour', 'macro'], 720),
  stock('43935', 'Steaming Cup', 'food', ['coffee', 'steam', 'moody']),
  stock('43941', 'Coffee Pour', 'food', ['coffee', 'pour', 'slow motion']),
  stock('44001', 'Pizza Macro', 'food', ['food', 'close-up', 'appetite']),
  stock('42910', 'Omelet Flip', 'food', ['cooking', 'kitchen', 'action']),

  // ── Tech ───────────────────────────────────────────────────────────────
  stock('47051', 'Circuit Board', 'tech', ['macro', 'hardware', 'detail'], 720),
  stock('242', 'Laptop Typing', 'tech', ['workspace', 'keyboard', 'close-up']),
  stock('23282', 'Data Center', 'tech', ['servers', 'corridor', 'blue']),
  stock('47258', 'Assembly Robot', 'tech', ['manufacturing', 'automation', 'industry']),

  // ── Lifestyle ──────────────────────────────────────────────────────────
  stock('308', 'Remote Work', 'lifestyle', ['laptop', 'home office', 'calm']),
  stock('4809', 'Team Meeting', 'lifestyle', ['business', 'people', 'collaboration']),
  stock('4840', 'Rooftop Sunset', 'lifestyle', ['golden hour', 'portrait', 'city']),

  // ── Atmosphere ─────────────────────────────────────────────────────────
  stock('2213', 'Forest Waterfall', 'atmosphere', ['nature', 'water', 'green']),
  stock('5016', 'Coastal Waves', 'atmosphere', ['ocean', 'beach', 'slow']),
  stock('26108', 'Cloud Drift', 'atmosphere', ['sky', 'blue', 'timelapse']),
  stock('1564', 'Sand Backdrop', 'atmosphere', ['beach', 'minimal', 'texture']),
  stock('51445', 'Beach Sunset', 'atmosphere', ['sunset', 'ocean', 'warm']),
  stock('49845', 'Skyline Night', 'atmosphere', ['city', 'aerial', 'night']),
  stock('4451', 'Tokyo Night', 'atmosphere', ['street', 'neon', 'cinematic']),
  stock('49878', 'Aerial City Night', 'atmosphere', ['drone', 'city', 'lights']),

  // ── Abstract ───────────────────────────────────────────────────────────
  stock('44818', 'Ink Flow', 'abstract', ['liquid', 'dark', 'texture']),
  stock('47282', 'Light Leak', 'abstract', ['overlay', 'blue', 'bokeh'], 720),
  stock('4036', 'Aurora', 'abstract', ['northern lights', 'night', 'sky']),
  stock('31562', 'Space Tunnel', 'abstract', ['fractal', 'loop', 'motion'], 720),
];

/**
 * Still used to preview the filter catalogue before a render exists. Same
 * license-free library, chosen for its colour range (sky gradient + warm sand).
 */
export const FILTER_PREVIEW_STILL = poster('51445');

export const STOCK_CATEGORY_LABEL: Record<StockCategoryId, string> = STOCK_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.label }),
  {} as Record<StockCategoryId, string>,
);
