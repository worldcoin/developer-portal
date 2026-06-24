/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Tooltip } from "@/components/Tooltip";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

describe("Tooltip", () => {
  it("opens on click and stays open on repeated clicks", async () => {
    render(
      <Tooltip content="Requires Owner role">
        <span>Trigger</span>
      </Tooltip>,
    );

    const trigger = screen.getByText("Trigger").parentElement as HTMLElement;

    fireEvent.click(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Requires Owner role",
    );

    fireEvent.click(trigger);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Requires Owner role",
    );
  });
});
