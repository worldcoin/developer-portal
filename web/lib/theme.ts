export const THEME_STORAGE_KEY = "portal-appearance";
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

// Storage validation only; next-themes owns theme application. Without a
// readable preference, both the provider and the base CSS default to light.
export const THEME_STORAGE_SANITIZER = `try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p!==null&&p!=="light"&&p!=="dark"&&p!=="system")localStorage.removeItem("${THEME_STORAGE_KEY}")}catch(e){console.warn("Portal appearance storage unavailable; using light theme")}`;

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

/** Unmigrated marketing, onboarding, admin and QR kiosk routes stay light. */
export function isPortalDarkModeAvailable(
  enabled: boolean,
  pathname: string | null,
): boolean {
  return enabled && /^\/(teams|profile|dashboard)(\/|$)/.test(pathname ?? "");
}

/** Appearance is always available in production; only development has an override. */
export function isDarkModeEnabled(
  configured: string | undefined,
  environment: string | undefined,
): boolean {
  if (environment !== "development") return true;
  return configured === undefined || configured === "" || configured === "true";
}
