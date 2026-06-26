/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

import { UserPopup } from "@/scenes/PortalV3/Shell/UserPopup";

describe("UserPopup", () => {
  it("shows the user's name in the trigger", () => {
    render(
      <UserPopup user={{ name: "Soam", email: "soam@example.com" }} theme="light" />,
    );
    expect(screen.getByText("Soam")).toBeInTheDocument();
  });
});
