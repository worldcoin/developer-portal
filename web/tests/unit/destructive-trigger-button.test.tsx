/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { fireEvent, render, screen } from "@testing-library/react";

describe("DestructiveTriggerButton", () => {
  it("renders the shared red-outline pill treatment", () => {
    const onClick = jest.fn();

    render(
      <DestructiveTriggerButton className="h-7 shrink-0" onClick={onClick}>
        Trigger action
      </DestructiveTriggerButton>,
    );

    const button = screen.getByRole("button", { name: "Trigger action" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(
      "h-8",
      "shrink-0",
      "rounded-full",
      "border-system-error-300",
      "bg-white",
      "text-13",
      "text-system-error-600",
    );
    expect(button).not.toHaveClass("h-7");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("owns disabled styling and blocks activation", () => {
    const onClick = jest.fn();

    render(
      <DestructiveTriggerButton disabled onClick={onClick}>
        Delete team
      </DestructiveTriggerButton>,
    );

    const button = screen.getByRole("button", { name: "Delete team" });

    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:cursor-not-allowed",
      "disabled:border-system-error-100",
      "disabled:text-system-error-300",
    );

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards an explicit native button type", () => {
    render(
      <DestructiveTriggerButton type="submit">
        Submit action
      </DestructiveTriggerButton>,
    );

    expect(
      screen.getByRole("button", { name: "Submit action" }),
    ).toHaveAttribute("type", "submit");
  });

  it("allows callers to hide the trigger without overriding its visual size", () => {
    render(
      <DestructiveTriggerButton className="hidden h-7">
        Hidden action
      </DestructiveTriggerButton>,
    );

    const button = screen.getByRole("button", { name: "Hidden action" });

    expect(button).toHaveClass("hidden", "h-8");
    expect(button).not.toHaveClass("inline-flex", "h-7");
  });
});
