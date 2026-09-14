export const THEME_STORAGE_KEY = "portal-appearance";
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

// Storage validation only; next-themes owns theme application. The CSS system
// fallback also works when storage is blocked and its bootstrap cannot read it.
export const THEME_STORAGE_SANITIZER = `try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p!==null&&p!=="light"&&p!=="dark"&&p!=="system")localStorage.removeItem("${THEME_STORAGE_KEY}")}catch(e){console.warn("Portal appearance storage unavailable; using system preference")}`;

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

/** Explicit false is the kill switch, including in local development. */
export function isDarkModeEnabled(
  configured: string | undefined,
  environment: string | undefined,
): boolean {
  return (
    configured === "true" ||
    ((configured === undefined || configured === "") &&
      environment === "development")
  );
}
