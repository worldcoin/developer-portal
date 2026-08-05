/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { WarningBadgeIcon } from "@/scenes/PortalV3/common/Icon";

// #region Shared warning badge rendering
describe("WarningBadgeIcon", () => {
  it("renders the canonical inline alert glyph with its optical lift", () => {
    const { container } = render(<WarningBadgeIcon />);

    const badge = container.firstElementChild;
    const icon = container.querySelector("svg");

    expect(badge).toHaveClass(
      "size-8",
      "rounded-full",
      "bg-system-warning-600",
    );
    expect(badge).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass(
      "size-4",
      "shrink-0",
      "-translate-y-px",
      "text-white",
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("allows the badge color to vary without dropping icon correction", () => {
    const { container } = render(<WarningBadgeIcon className="bg-[#ffae00]" />);

    expect(container.firstElementChild).toHaveClass("bg-[#ffae00]");
    expect(container.firstElementChild).not.toHaveClass(
      "bg-system-warning-600",
    );
    expect(container.querySelector("svg")).toHaveClass("-translate-y-px");
  });
});
// #endregion
