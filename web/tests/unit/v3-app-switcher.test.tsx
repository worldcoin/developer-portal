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

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

import { AppSwitcher } from "@/scenes/PortalV3/Shell/AppSwitcher";

const apps = [
  { id: "app_1", name: "MiniKit" },
  { id: "app_2", name: "Acme" },
];

describe("AppSwitcher", () => {
  it("shows the current app's name in the trigger", () => {
    render(<AppSwitcher teamId="team_1" currentAppId="app_1" apps={apps} />);
    expect(screen.getByText("MiniKit")).toBeInTheDocument();
  });

  it("falls back to 'Select app' when none is current", () => {
    render(<AppSwitcher teamId="team_1" apps={apps} />);
    expect(screen.getByText("Select app")).toBeInTheDocument();
  });

  it("renders nothing when there are no apps", () => {
    const { container } = render(<AppSwitcher teamId="team_1" apps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
