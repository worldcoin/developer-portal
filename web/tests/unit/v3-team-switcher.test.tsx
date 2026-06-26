/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { TeamSwitcher } from "@/scenes/PortalV3/Shell/TeamSwitcher";

describe("TeamSwitcher", () => {
  it("links the team name to the apps grid", () => {
    render(
      <TeamSwitcher
        currentTeam={{ id: "team_1", name: "Tools for Humanity" }}
        teams={[{ id: "team_1", name: "Tools for Humanity" }]}
      />,
    );
    expect(screen.getByText("Tools for Humanity").closest("a")).toHaveAttribute(
      "href",
      "/teams/team_1/apps",
    );
  });
});
