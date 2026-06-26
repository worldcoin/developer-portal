/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/scenes/PortalV3/Shell/ThemeToggle";

describe("ThemeToggle", () => {
  it("reflects the initial theme", () => {
    render(<ThemeToggle initialTheme="light" />);
    expect(screen.getByRole("button", { name: "light" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "dark" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches and persists a cookie on click", () => {
    render(<ThemeToggle initialTheme="light" />);
    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    expect(screen.getByRole("button", { name: "dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.cookie).toContain("portal_v3_theme=dark");
  });
});
