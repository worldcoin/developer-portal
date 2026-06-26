"use client";

import { THEME_COOKIE, Theme } from "@/lib/portal-v3/theme";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const persist = (theme: Theme) => {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  // Toggle the scope class on the shell root for instant feedback; the cookie
  // makes the next server render match (no flash).
  document
    .querySelector("[data-v3-root]")
    ?.classList.toggle("dark", theme === "dark");
};

export const ThemeToggle = (props: { initialTheme: Theme }) => {
  const [theme, setTheme] = useState<Theme>(props.initialTheme);

  const choose = (next: Theme) => {
    setTheme(next);
    persist(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-8 border border-border p-0.5"
    >
      {(["light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          aria-pressed={theme === option}
          className={twMerge(
            "flex-1 rounded-[6px] px-2 py-1 text-12 font-medium capitalize outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring",
            theme === option
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
