/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ThemeMenu } from "@/components/ThemeMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PortalThemeProvider,
  usePortalThemeEnabled,
} from "@/components/PortalThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

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

function Availability() {
  return (
    <span>
      {usePortalThemeEnabled() ? "Appearance available" : "Appearance hidden"}
    </span>
  );
}

// #region Real next-themes provider behavior
describe("portal appearance storage events", () => {
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
