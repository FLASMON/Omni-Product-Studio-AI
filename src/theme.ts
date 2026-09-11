// Dark is the studio default; light mode is an opt-in that flips the zinc ramp
// (see the `[data-theme="light"]` block in index.css). The chosen theme is
// persisted so it survives reloads, and index.html re-applies it before paint.

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'omni-theme';

export const readTheme = (): Theme => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — the attribute is enough for this session */
  }
};
