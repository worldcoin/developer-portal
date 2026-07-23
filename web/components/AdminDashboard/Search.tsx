"use client";

import { clsx } from "clsx";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { UIModule } from "./UIModule";

type SearchProps = {
  className?: string;
};

type SearchResult = {
  id: string;
  name: string;
  detail?: string | null;
  href: string;
  type: "App" | "RP" | "Team" | "User";
};

type SearchResponse = {
  apps: Array<{ id: string; name: string; teamId: string }>;
  rps: Array<{ appId: string; appName: string; id: string }>;
  teams: Array<{ id: string; name: string }>;
  users: Array<{ email: string | null; id: string; name: string }>;
};

export const Search = ({ className }: SearchProps) => {
  const router = useRouter();
  const listboxId = useId().replaceAll(":", "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<"error" | "idle" | "loading" | "ready">(
    "idle",
  );
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const requestIdRef = useRef(0);
  const normalizedQuery = query.trim();
  const results = useMemo<SearchResult[]>(
    () => [
      ...(response?.teams.map((team) => ({
        href: `/admin/teams/${team.id}`,
        id: team.id,
        name: team.name,
        type: "Team" as const,
      })) ?? []),
      ...(response?.apps.map((app) => ({
        detail: app.teamId,
        href: `/admin/apps/${app.id}`,
        id: app.id,
        name: app.name,
        type: "App" as const,
      })) ?? []),
      ...(response?.rps.map((rp) => ({
        detail: rp.appName,
        href: `/admin/rps/${rp.id}`,
        id: rp.id,
        name: rp.id,
        type: "RP" as const,
      })) ?? []),
      ...(response?.users.map((user) => ({
        detail: user.email,
        href: `/admin/users/${user.id}`,
        id: user.id,
        name: user.name,
        type: "User" as const,
      })) ?? []),
    ],
    [response],
  );
  const isOpen = isFocused && normalizedQuery.length >= 2;

  useEffect(() => {
    setShortcutLabel(
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘ K" : "Ctrl K",
    );

    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsFocused(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResponse(null);
      setSelectedIndex(-1);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      setStatus("loading");
      setSelectedIndex(-1);

      try {
        const apiResponse = await fetch(
          `/api/admin/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );

        if (!apiResponse.ok) {
          throw new Error("Admin search request failed");
        }

        const data = (await apiResponse.json()) as SearchResponse;
        if (requestId === requestIdRef.current) {
          setResponse(data);
          setStatus("ready");
        }
      } catch (error) {
        if (
          (error as Error).name !== "AbortError" &&
          requestId === requestIdRef.current
        ) {
          setResponse(null);
          setStatus("error");
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [normalizedQuery]);

  const selectResult = (result: SearchResult) => {
    setIsFocused(false);
    setSelectedIndex(-1);
    router.push(result.href);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsFocused(false);
      setSelectedIndex(-1);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((index) =>
        index <= 0 ? results.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      selectResult(results[selectedIndex]);
    }
  };

  return (
    <div className={clsx("relative", className)}>
      <UIModule
        className={clsx("relative h-10 p-0", "3xl:h-12.5", "4xl:h-17.5")}
      >
        <SearchIcon
          className={clsx(
            "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400",
            "3xl:left-4 3xl:size-5",
            "4xl:left-5 4xl:size-7",
          )}
        />
        <input
          aria-activedescendant={
            selectedIndex >= 0 ? `${listboxId}-${selectedIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label="Search teams, apps, RPs, and users"
          aria-busy={status === "loading"}
          className={clsx(
            "size-full rounded-16 bg-transparent py-2 pr-20 pl-9 text-14 outline-hidden placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500",
            "3xl:pr-24 3xl:pl-11 3xl:text-18",
            "4xl:pr-28 4xl:pl-16 4xl:text-24",
          )}
          enterKeyHint="search"
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 100);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setResponse(null);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search teams, apps, RPs, and users"
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-8 bg-grey-100 px-2 py-1 font-sans text-11 font-medium text-grey-500 3xl:right-4 3xl:text-13 4xl:right-5 4xl:text-16">
          {shortcutLabel}
        </kbd>
      </UIModule>
      {isOpen && (
        <div
          className="absolute top-[calc(100%+0.25rem)] z-50 max-h-[min(32rem,70dvh)] w-full overflow-y-auto rounded-12 border border-grey-200 bg-grey-0 p-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {status === "loading" && (
            <p aria-live="polite" className="px-3 py-2 text-13 text-grey-500">
              Searching…
            </p>
          )}
          {status === "error" && (
            <p
              aria-live="polite"
              className="px-3 py-2 text-13 text-system-error-700"
            >
              Search is temporarily unavailable.
            </p>
          )}
          {status === "ready" && results.length === 0 && (
            <p aria-live="polite" className="px-3 py-2 text-13 text-grey-500">
              No matching teams, apps, RPs, or users.
            </p>
          )}
          {status === "ready" &&
            results.map((result, index) => (
              <button
                aria-selected={selectedIndex === index}
                className={clsx(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-8 px-3 py-2 text-left outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500",
                  selectedIndex === index && "bg-blue-50",
                )}
                id={`${listboxId}-${index}`}
                key={`${result.type}:${result.id}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => selectResult(result)}
                role="option"
                type="button"
              >
                <span className="pt-0.5 text-11 font-medium tracking-wide text-grey-400 uppercase">
                  {result.type}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-13 font-medium text-grey-900">
                    {result.name}
                  </span>
                  <span className="block truncate font-mono text-11 text-grey-500">
                    {result.detail ?? result.id}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
