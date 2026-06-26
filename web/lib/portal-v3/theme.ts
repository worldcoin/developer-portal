/**
 * v3 theme: light (default) or dark, persisted in a cookie and applied as a
 * `.dark` class on the shell root (the v3 CSS-variable tokens switch under it).
 * Scoped to the v3 shell — the rest of the app is unaffected.
 */
export const THEME_COOKIE = "portal_v3_theme";

export type Theme = "light" | "dark";

export const parseTheme = (raw: string | undefined): Theme =>
  raw === "dark" ? "dark" : "light";
