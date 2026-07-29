/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { render, screen } from "@testing-library/react";

describe("InkButton", () => {
  it("owns link hover styling and optically aligns an inline SVG icon", () => {
    render(
      <InkButton
        href="/profile"
        className="h-8"
        icon={<PlusIcon data-testid="plus-icon" className="size-4" />}
      >
        New team
      </InkButton>,
    );

    const link = screen.getByRole("link", { name: "New team" });
    const iconSlot = screen.getByTestId("plus-icon").parentElement;

    expect(link).toHaveClass("h-8", "hover:bg-portal-ink-hover");
    expect(link).not.toHaveClass("h-10", "enabled:hover:bg-portal-ink-hover");
    expect(iconSlot).toHaveClass("flex", "shrink-0", "-translate-y-px");
  });

  it("owns the disabled button colors and hover override", () => {
    render(
      <InkButton type="button" disabled>
        Save
      </InkButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:cursor-not-allowed",
      "disabled:bg-grey-200",
      "disabled:text-grey-400",
      "disabled:hover:bg-grey-200",
    );
  });
});
