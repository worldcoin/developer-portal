"use client";

import {
  isPortalDarkModeAvailable,
  isThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import { Slide, ToastContainer } from "react-toastify";

const ThemeEnabledContext = createContext(false);
export const usePortalThemeEnabled = () => useContext(ThemeEnabledContext);
// next-themes indexes this map with storage values. A null prototype prevents
// inherited keys such as __proto__ from becoming invalid DOM class tokens.
const themeClasses: Record<string, string> = Object.assign(
  Object.create(null),
  {
    light: "light",
    dark: "dark",
  },
);

function ThemeSurfaces({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Storage is untrusted (including cross-tab writes). The bootstrap sanitizer
    // covers first paint; this guard handles subsequent storage events.
    if (theme !== undefined && !isThemePreference(theme)) {
      // The provider's value map only applies light/dark classes. Never use an
      // untrusted preference to remove unrelated root classes (e.g. fonts).
      setTheme("light");
    }
  }, [theme, setTheme]);

  return (
    <>
      <ToastContainer
        autoClose={4000}
        transition={Slide}
        hideProgressBar
        position="bottom-right"
      />
      <SkeletonTheme
        baseColor="var(--skeleton-base)"
        highlightColor="var(--skeleton-highlight)"
      >
        {children}
      </SkeletonTheme>
    </>
  );
}

export function PortalThemeProvider({
  children,
  enabled,
  nonce,
}: {
  children: ReactNode;
  enabled: boolean;
  nonce?: string;
}) {
  const pathname = usePathname();
  const available = isPortalDarkModeAvailable(enabled, pathname);
  return (
    <ThemeEnabledContext.Provider value={available}>
      <ThemeProvider
        attribute="class"
        storageKey={THEME_STORAGE_KEY}
        defaultTheme="system"
        value={themeClasses}
        enableSystem
        enableColorScheme
        nonce={nonce}
        forcedTheme={available ? undefined : "light"}
      >
        <ThemeSurfaces>{children}</ThemeSurfaces>
      </ThemeProvider>
    </ThemeEnabledContext.Provider>
  );
}
