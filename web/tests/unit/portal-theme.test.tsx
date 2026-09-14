/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { ThemeProvider, useTheme } from "next-themes";
import postcss, { type AnyNode } from "postcss";
import { Chart, type ChartProps } from "@/components/Chart";
import { ThemeMenu } from "@/components/ThemeMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PortalThemeProvider,
  usePortalThemeEnabled,
} from "@/components/PortalThemeProvider";
import {
  isDarkModeEnabled,
  isPortalDarkModeAvailable,
  isThemePreference,
  THEME_STORAGE_KEY,
  THEME_STORAGE_SANITIZER,
} from "@/lib/theme";
import { Icon, getIconPath } from "@/scenes/PortalV3/common/Icon";

// #region I/O boundaries
let mockPathname = "/profile";
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("react-toastify", () => ({
  ToastContainer: () => null,
  Slide: () => null,
}));
// Styling is outside this test; avoid the utility barrel's unrelated IDKit SDK.
jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));
// #endregion

// #region Canvas boundary; next-themes, CSS reads and chart options stay real
jest.mock("react-chartjs-2", () => ({
  Line: (props: unknown) => (
    <output data-testid="chart">{JSON.stringify(props)}</output>
  ),
}));
// #endregion

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

  it.each([true, false])(
    "gates supported routes and keeps unsupported routes light (flag=%s)",
    (enabled) => {
      for (const path of ["/teams/a/settings", "/profile", "/dashboard"])
        expect(isPortalDarkModeAvailable(enabled, path)).toBe(enabled);
      for (const path of [
        null,
        "/",
        "/admin",
        "/onboarding",
        "/kiosk",
        "/teams-malicious",
        "/unknown",
      ])
        expect(isPortalDarkModeAvailable(enabled, path)).toBe(false);
    },
  );
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

// #region Read the actual shipped tokens, not a duplicate test palette
const tokens: Record<string, string> = {};
const darkTokens: Record<string, string> = {};
for (const file of ["styles/globals.css", "styles/portal-theme.css"]) {
  postcss
    .parse(readFileSync(resolve(process.cwd(), file), "utf8"))
    .walkDecls((declaration) => {
      if (!declaration.prop.startsWith("--")) return;
      let dark = false;
      for (
        let parent: postcss.AnyNode | undefined = declaration.parent;
        parent;
        parent = parent.parent
      ) {
        if (
          parent.type === "atrule" &&
          parent.name === "variant" &&
          parent.params === "dark"
        )
          dark = true;
      }
      (dark ? darkTokens : tokens)[declaration.prop] = declaration.value;
    });
}

function color(name: string, depth = 0): string {
  if (depth > 5) throw new Error(`Circular token alias: ${name}`);
  const value = darkTokens[name] ?? tokens[name] ?? name;
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  if (alias) return color(alias[1], depth + 1);
  if (!/^#[\da-f]{6}$/i.test(value))
    throw new Error(`Not an opaque RGB token: ${name}=${value}`);
  return value;
}

function luminance(token: string) {
  const hex = color(token);
  return [1, 3, 5].reduce((sum, offset, index) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return (
      sum +
      (channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index]
    );
  }, 0);
}

function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}
// #endregion

// #region Text, actions and required control boundaries
describe("dark portal token contrast", () => {
  it.each([
    "--color-portal-canvas",
    "--color-surface",
    "--color-surface-raised",
    "--color-surface-muted",
  ])("keeps primary and supporting copy readable on %s", (background) => {
    for (const foreground of [
      "--color-content-primary",
      "--color-content-secondary",
      "--color-content-description",
      "--color-content-validation",
      "--color-content-link",
    ]) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    ["--color-action-foreground", "--color-action"],
    ["--color-action-foreground", "--color-action-hover"],
    ["--color-portal-text", "--color-portal-border"],
    ["--color-content-error-500", "--color-surface-error-50"],
    ["--color-content-success-500", "--color-surface-success-50"],
    ["--color-content-warning-650", "--color-surface-warning-75"],
    ["#ffffff", "--color-system-error-600"],
    ["#ffffff", "--color-system-error-800"],
  ])("keeps %s readable on %s", (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    "--color-surface",
    "--color-surface-raised",
    "--color-portal-canvas",
  ])(
    "keeps control borders and focus indicators distinguishable on %s",
    (background) => {
      expect(
        contrast("--color-control-border", background),
      ).toBeGreaterThanOrEqual(3);
      expect(contrast("--color-focus", background)).toBeGreaterThanOrEqual(3);
    },
  );
});
// #endregion

// #region Theme-aware icons
describe("portal icon rendering", () => {
  it("provides a currentColor mask for monochrome icons while retaining the original light asset", () => {
    const { container } = render(
      <Icon name="nav-help" className="size-4 text-portal-muted" />,
    );
    const mask = container.querySelector(
      '[data-portal-icon="nav-help"]',
    ) as HTMLElement;
    expect(mask).toHaveClass(
      "portal-monochrome-icon",
      "size-4",
      "text-portal-muted",
    );
    expect(mask.style.getPropertyValue("--portal-icon-mask")).toBe(
      'url("/images/portal-v3/icons/nav-help.svg")',
    );
    expect(mask.querySelector("img")).toHaveAttribute(
      "src",
      "/images/portal-v3/icons/nav-help.svg",
    );
    expect(mask).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    "world-id-sandbox-app-icon",
    "radio-check",
    "warning-triangle",
    "card-wand",
  ])("does not recolor fixed artwork %s", (name) => {
    const { container } = render(<Icon name={name} className="size-4" />);
    expect(container.querySelector("[data-portal-icon]")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      getIconPath(name),
    );
  });

  it("encodes names so an unexpected icon name cannot escape the asset directory", () => {
    expect(getIconPath('../other?name="x"')).toBe(
      "/images/portal-v3/icons/..%2Fother%3Fname%3D%22x%22.svg",
    );
  });
});
// #endregion

function Availability() {
  return (
    <span>
      {usePortalThemeEnabled() ? "Appearance available" : "Appearance hidden"}
    </span>
  );
}

// #region Real next-themes provider behavior
describe("portal appearance storage events", () => {
  beforeEach(() => {
    mockPathname = "/profile";
    localStorage.clear();
    document.documentElement.className = "font-class";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(() => ({
        matches: true,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  it("offers only Light/Dark, reflects saved System appearance, and persists explicit choices", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    render(
      <PortalThemeProvider enabled>
        <DropdownMenu open>
          <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <ThemeMenu />
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalThemeProvider>,
    );
    expect(
      screen.getAllByRole("menuitemradio").map((item) => item.textContent),
    ).toEqual(["Light", "Dark"]);
    expect(screen.queryByText("System")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("menuitemradio", { name: "Dark" }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    for (const preference of ["light", "dark"]) {
      const option = screen.getByRole("menuitemradio", {
        name: new RegExp(preference, "i"),
      });
      fireEvent.click(option);
      await waitFor(() =>
        expect(document.documentElement).toHaveClass(preference),
      );
      expect(option).toHaveAttribute("aria-checked", "true");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(preference);
    }
  });

  it.each(["click", "Enter", " "])(
    "keeps appearance selections open with %s, but still allows normal dismissal",
    async (selection) => {
      localStorage.setItem(THEME_STORAGE_KEY, "light");
      const onProfileSelect = jest.fn();
      render(
        <PortalThemeProvider enabled>
          <DropdownMenu>
            <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onProfileSelect}>
                Profile
              </DropdownMenuItem>
              <ThemeMenu />
            </DropdownMenuContent>
          </DropdownMenu>
        </PortalThemeProvider>,
      );
      const openMenu = () =>
        fireEvent.keyDown(
          screen.getByRole("button", { name: "Account menu" }),
          {
            key: "ArrowDown",
          },
        );
      openMenu();
      await screen.findByRole("menu");
      for (const preference of ["Dark", "Light", "Dark", "Dark"]) {
        const option = screen.getByRole("menuitemradio", { name: preference });
        if (selection === "click") fireEvent.click(option);
        else {
          act(() => option.focus());
          fireEvent.keyDown(option, { key: selection });
        }
        expect(screen.getByRole("menu")).toBeVisible();
        expect(option).toHaveAttribute("aria-checked", "true");
        expect(document.documentElement).toHaveClass(preference.toLowerCase());
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
          preference.toLowerCase(),
        );
      }
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
      openMenu();
      fireEvent.click(await screen.findByRole("menuitem", { name: "Profile" }));
      expect(onProfileSelect).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
      );
    },
  );

  it.each([true, false])(
    "preserves preference while navigating supported/unsupported routes (flag=%s)",
    async (enabled) => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      const page = (
        <PortalThemeProvider enabled={enabled}>
          <Availability />
        </PortalThemeProvider>
      );
      const { rerender } = render(page);
      await waitFor(() =>
        expect(document.documentElement).toHaveClass(
          enabled ? "dark" : "light",
        ),
      );
      expect(
        screen.getByText(
          enabled ? "Appearance available" : "Appearance hidden",
        ),
      ).toBeInTheDocument();
      mockPathname = "/admin";
      rerender(
        <PortalThemeProvider enabled={enabled}>
          <Availability />
        </PortalThemeProvider>,
      );
      await waitFor(() =>
        expect(document.documentElement).toHaveClass("light"),
      );
      expect(screen.getByText("Appearance hidden")).toBeInTheDocument();
      mockPathname = "/profile";
      rerender(page);
      await waitFor(() =>
        expect(document.documentElement).toHaveClass(
          enabled ? "dark" : "light",
        ),
      );
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    },
  );

  it.each(["__proto__", "constructor", "font-class", "dark injected-class"])(
    "safely rejects the cross-tab preference %s and preserves unrelated root classes",
    async (value) => {
      render(
        <PortalThemeProvider enabled>
          <span>Portal content</span>
        </PortalThemeProvider>,
      );
      await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: THEME_STORAGE_KEY,
            newValue: value,
          }),
        );
      });
      await waitFor(() =>
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system"),
      );
      expect(document.documentElement).toHaveClass("font-class", "dark");
      expect(document.documentElement).not.toHaveClass(
        "light",
        "injected-class",
      );
    },
  );

  it("syncs valid cross-tab choices and forces light when rollout is disabled", async () => {
    const { rerender } = render(
      <PortalThemeProvider enabled>
        <span>Portal content</span>
      </PortalThemeProvider>,
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "light",
        }),
      );
    });
    await waitFor(() => expect(document.documentElement).toHaveClass("light"));
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "dark",
        }),
      );
    });
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    rerender(
      <PortalThemeProvider enabled={false}>
        <span>Portal content</span>
      </PortalThemeProvider>,
    );
    await waitFor(() => expect(document.documentElement).toHaveClass("light"));
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
// #endregion

// #region Test data
const data: ChartProps["data"] = {
  x: ["Today"],
  y: [{ data: [1], borderColor: "#007cfb" }],
};
const chart = () => JSON.parse(screen.getByTestId("chart").textContent!);
const nextFrame = () => act(() => jest.advanceTimersByTime(20));
const stylesheet = document.createElement("style");

function ThemeControls() {
  const { setTheme } = useTheme();
  return (
    <>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
    </>
  );
}
const page = (forcedTheme?: string) => (
  <ThemeProvider
    attribute="class"
    storageKey="chart-theme"
    defaultTheme="light"
    forcedTheme={forcedTheme}
  >
    <ThemeControls />
    <Chart data={data} />
  </ThemeProvider>
);
const expectLight = () => {
  expect(chart().options.plugins.tooltip.backgroundColor).toBe("#ffffff");
  expect(chart().data.datasets[0].borderColor).toBe("#007cfb");
};
const expectDark = () => {
  expect(chart().options.plugins.tooltip).toMatchObject({
    backgroundColor: "#272727",
    bodyColor: "#9ba3ae",
    titleColor: "#9ba3ae",
    borderColor: "#3c424b",
  });
  expect(chart().options.scales.x.ticks.color).toBe("#9ba3ae");
  expect(chart().options.scales.y.grid.color).toBe("#3c424b");
  expect(chart().data.datasets[0].borderColor).toBe("#66a3ff");
  expect(chart().data.datasets[0].data).toEqual([1]);
  expect(chart().data.labels).toEqual(["Today"]);
  expect(data.y[0].borderColor).toBe("#007cfb");
};
// #endregion

// #region Canvas theme transitions
describe("canvas theme palette", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    document.documentElement.className = "light";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false, addListener() {}, removeListener() {} }),
    });
    // Extract shipped tokens into CSS selectors jsdom understands. The actual
    // provider must change the root class before computed styles become dark.
    const tokens = { light: [] as string[], dark: [] as string[] };
    postcss
      .parse(readFileSync("styles/portal-theme.css", "utf8"))
      .walkDecls((decl) => {
        if (!decl.prop.startsWith("--")) return;
        let dark = false;
        let parent: AnyNode | undefined = decl.parent;
        while (parent) {
          if (
            parent.type === "atrule" &&
            parent.name === "variant" &&
            parent.params === "dark"
          )
            dark = true;
          parent = parent.parent;
        }
        tokens[dark ? "dark" : "light"].push(`${decl.prop}:${decl.value};`);
      });
    stylesheet.textContent = `:root {${tokens.light.join("")}} :root.dark {${tokens.dark.join("")}}`;
    document.head.appendChild(stylesheet);
  });
  afterEach(() => {
    stylesheet.remove();
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("class");
    localStorage.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts light, reads dark tokens after the provider effect, and restores light", () => {
    render(page());
    expectLight();
    fireEvent.click(screen.getByText("Dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expectLight();
    nextFrame();
    expectDark();
    fireEvent.click(screen.getByText("Light"));
    expectLight();
    nextFrame();
    expectLight();
  });

  it("applies saved dark appearance after the initial light chart", () => {
    localStorage.setItem("chart-theme", "dark");
    render(page());
    expectLight();
    nextFrame();
    expectDark();
  });

  it("restores saved dark appearance when returning from a forced-light route", () => {
    localStorage.setItem("chart-theme", "dark");
    const { rerender } = render(page("light"));
    nextFrame();
    expectLight();
    rerender(page());
    nextFrame();
    expectDark();
    rerender(page("light"));
    expectLight();
    nextFrame();
    expectLight();
  });

  it("cancels a pending dark update when switched back before the next frame", () => {
    render(page());
    fireEvent.click(screen.getByText("Dark"));
    fireEvent.click(screen.getByText("Light"));
    nextFrame();
    expectLight();
  });

  it("cancels the pending palette read on unmount", () => {
    const computedStyle = jest.spyOn(window, "getComputedStyle");
    localStorage.setItem("chart-theme", "dark");
    const { unmount } = render(page());
    unmount();
    computedStyle.mockClear();
    nextFrame();
    expect(computedStyle).not.toHaveBeenCalled();
  });
});
// #endregion
