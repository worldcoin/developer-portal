/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { RestrictedAction } from "@/components/RestrictedAction";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

const blocked = {
  allowed: false,
  message: "Only Owners can edit this section.",
};

describe("RestrictedAction", () => {
  it("passes disabled state from the restriction object", () => {
    render(
      <RestrictedAction restriction={blocked}>
        {({ disabled }) => (
          <button type="button" disabled={disabled}>
            Save
          </button>
        )}
      </RestrictedAction>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps blocked link children out of keyboard interaction", () => {
    render(
      <RestrictedAction restriction={blocked}>
        <a href="/blocked">Create action</a>
      </RestrictedAction>,
    );

    expect(screen.getByText("Create action").parentElement).toHaveAttribute(
      "inert",
    );
  });

  it("shows the restriction message from the disabled wrapper", async () => {
    render(
      <RestrictedAction restriction={blocked}>
        {({ disabled }) => (
          <button type="button" disabled={disabled}>
            Submit
          </button>
        )}
      </RestrictedAction>,
    );

    const trigger = screen
      .getByText("Submit")
      .closest("[aria-disabled='true']") as HTMLElement;

    fireEvent.focus(trigger);

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Only Owners can edit this section.",
    );
  });
});
