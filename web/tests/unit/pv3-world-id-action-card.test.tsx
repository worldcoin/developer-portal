/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ActionCard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";

it("links to the canonical action route", () => {
  render(
    <ActionCard
      teamId="team_1"
      appId="app_1"
      action={{
        id: "action_1",
        action: "verify",
        description: "",
        total: 0,
        latestAt: null,
        points: Array(7).fill(0),
      }}
    />,
  );

  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id-actions/action_1",
  );
});
