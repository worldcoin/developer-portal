/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Onboarding/CreateTeam/page", () => ({
  CreateTeamPage: () => <div data-testid="v2-create-team" />,
}));
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...a: unknown[]) => getSession(...a) },
}));
jest.mock("@/scenes/PortalV3/layout/AutoTeamBootstrap", () => ({
  AutoTeamBootstrap: (props: { defaultName: string; hasUser: boolean }) => (
    <div data-testid="auto-team-bootstrap" data-name={props.defaultName} />
  ),
  deriveTeamName: () => "Soam's team",
}));
import { CreateTeamPage as CreateTeamPageV3 } from "@/scenes/PortalV3/Onboarding/CreateTeam/page";

beforeEach(() => jest.clearAllMocks());

describe("route chooser", () => {
  it("flag on → v3 create-team page is chosen", async () => {
    getSession.mockResolvedValue({
      user: { name: "Soam", email: "a@b.com", hasura: undefined },
    });
    const RoutePage = (await import("../../app/(onboarding)/create-team/page"))
      .default;
    // v3 page is async — resolve it before rendering
    render(await CreateTeamPageV3({ params: Promise.resolve({}) }));
    expect(screen.getByTestId("auto-team-bootstrap")).toBeInTheDocument();
    // and the route's default export resolves through pickPortalVersion to the v3 element
    const el = await RoutePage({ params: Promise.resolve({}) });
    expect((el as React.ReactElement).type).toBe(CreateTeamPageV3);
  });
});

describe("v3 create-team page branching", () => {
  it("new user (no memberships) → auto-team bootstrap, not the manual form", async () => {
    getSession.mockResolvedValue({
      user: { name: "Soam", email: "a@b.com", hasura: undefined },
    });
    render(await CreateTeamPageV3({ params: Promise.resolve({}) }));
    expect(screen.getByTestId("auto-team-bootstrap")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-create-team")).not.toBeInTheDocument();
  });

  it("user with an existing team → manual form (intentional second team)", async () => {
    getSession.mockResolvedValue({
      user: {
        name: "Soam",
        email: "a@b.com",
        hasura: {
          id: "user_1",
          memberships: [{ role: "OWNER", team: { id: "team_1", name: "T" } }],
        },
      },
    });
    render(await CreateTeamPageV3({ params: Promise.resolve({}) }));
    expect(screen.getByTestId("v2-create-team")).toBeInTheDocument();
    expect(screen.queryByTestId("auto-team-bootstrap")).not.toBeInTheDocument();
  });
});
