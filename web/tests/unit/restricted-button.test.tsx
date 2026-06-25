/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { RestrictedButton } from "@/components/RestrictedButton";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

describe("RestrictedButton", () => {
  it("disables the button when the restriction is blocked", () => {
    render(
      <RestrictedButton
        type="button"
        restriction={{ allowed: false, message: "Only Owners can do this." }}
      >
        Save
      </RestrictedButton>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("preserves caller disabled state when the restriction is allowed", () => {
    render(
      <>
        <RestrictedButton
          type="button"
          restriction={{ allowed: true, message: "Allowed" }}
          disabled
        >
          Saving
        </RestrictedButton>
        <RestrictedButton
          type="button"
          restriction={{ allowed: true, message: "Allowed" }}
        >
          Save
        </RestrictedButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
