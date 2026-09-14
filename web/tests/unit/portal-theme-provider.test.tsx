/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
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
