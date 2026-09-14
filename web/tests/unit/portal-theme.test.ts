import { runInNewContext } from "node:vm";
import {
  isDarkModeEnabled,
  isPortalThemeRoute,
  isThemePreference,
  THEME_STORAGE_KEY,
  THEME_STORAGE_SANITIZER,
} from "@/lib/theme";

// #region Rollout and route boundaries
describe("portal theme rollout", () => {
  it("defaults on only in development, and honors explicit opt-in and kill switch", () => {
    expect(isDarkModeEnabled(undefined, "development")).toBe(true);
    expect(isDarkModeEnabled("", "development")).toBe(true);
    expect(isDarkModeEnabled(undefined, "production")).toBe(false);
    expect(isDarkModeEnabled("true", "production")).toBe(true);
    expect(isDarkModeEnabled("false", "development")).toBe(false);
    expect(isDarkModeEnabled("TRUE", "development")).toBe(false);
  });

  it("keeps marketing, admin, kiosks, unknown paths and partial route matches light", () => {
    for (const path of ["/teams/a/settings", "/profile", "/dashboard"])
      expect(isPortalThemeRoute(path)).toBe(true);
    for (const path of [
      null,
      "/",
      "/admin",
      "/onboarding",
      "/kiosk",
      "/teams-malicious",
      "/theme-preview",
    ])
      expect(isPortalThemeRoute(path)).toBe(false);
  });
});
// #endregion

// #region Untrusted / unavailable preference storage
describe("portal theme preference storage", () => {
  it("accepts only the three exact preference strings", () => {
    for (const value of ["light", "dark", "system"])
      expect(isThemePreference(value)).toBe(true);
    for (const value of [
      undefined,
      null,
      {},
      "Dark",
      "dark injected-class",
      "",
      "__proto__",
    ])
      expect(isThemePreference(value)).toBe(false);
  });

  it("removes malformed preferences without deleting other stored data", () => {
    const values = new Map([
      [THEME_STORAGE_KEY, "dark injected-class"],
      ["unrelated", "keep"],
    ]);
    runInNewContext(THEME_STORAGE_SANITIZER, {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
      },
    });
    expect(values.has(THEME_STORAGE_KEY)).toBe(false);
    expect(values.get("unrelated")).toBe("keep");
  });

  it.each([null, "light", "dark", "system"])(
    "preserves valid or absent preference %s",
    (preference) => {
      const removeItem = jest.fn();
      runInNewContext(THEME_STORAGE_SANITIZER, {
        localStorage: { getItem: () => preference, removeItem },
      });
      expect(removeItem).not.toHaveBeenCalled();
    },
  );

  it("does not break rendering when storage is blocked and reports the fallback", () => {
    const warn = jest.fn();
    expect(() =>
      runInNewContext(THEME_STORAGE_SANITIZER, {
        localStorage: {
          getItem: () => {
            throw new Error("Storage blocked");
          },
        },
        console: { warn },
      }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("using system preference"),
    );
  });
});
// #endregion
