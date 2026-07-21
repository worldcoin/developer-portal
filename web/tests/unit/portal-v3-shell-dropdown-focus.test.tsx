/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { TeamsDropdown } from "@/scenes/PortalV3/layout/Shell/TeamsDropdown";
import { UserPopup } from "@/scenes/PortalV3/layout/Shell/UserPopup";
import { render, screen } from "@testing-library/react";

// #region Mocks
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
  useRouter: () => ({ push: jest.fn() }),
}));
// #endregion

// #region Trigger focus treatment
describe("Portal v3 shell dropdown focus treatment", () => {
  it("uses a clean background cue instead of a persistent focus ring", () => {
    render(
      <>
        <TeamsDropdown teams={[{ id: "team_1", name: "Example team" }]} />
        <UserPopup
          user={{ name: "Ada Lovelace", email: "ada@example.com" }}
          color={null}
        />
      </>,
    );

    const teamTrigger = screen.getByRole("button", { name: "Switch team" });
    const profileTrigger = screen.getByRole("button", {
      name: "Open profile menu",
    });

    for (const trigger of [teamTrigger, profileTrigger]) {
      expect(trigger.className).not.toContain("focus-visible:ring");
      expect(trigger).toHaveClass("focus-visible:bg-portal-border");
    }
  });
});
// #endregion
