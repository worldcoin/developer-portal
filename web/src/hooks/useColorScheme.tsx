import { useEffect, useState } from "react";

type ColorScheme = Readonly<"light" | "dark">;

/**
 * Detects change of os color scheme
 */
export function useColorScheme(): ColorScheme {
  const [theme, setTheme] = useState<ColorScheme>("light");

  // Listen to OS color scheme changes
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEventMap["change"]) => {
      setTheme(e.matches ? "dark" : "light");
    };

    query.addEventListener("change", handleChange);

    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, []);

  return theme;
}
