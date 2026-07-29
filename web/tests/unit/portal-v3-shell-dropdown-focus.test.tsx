/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { additionalColors } from "@/lib/additional-colors";
import { colorAtom } from "@/scenes/common/layout/color-atom";
import { TeamsDropdown } from "@/scenes/PortalV3/layout/Shell/TeamsDropdown";
import { UserPopup } from "@/scenes/PortalV3/layout/Shell/UserPopup";
import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

// #region Mocks
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
  usePathname: () => "/teams/team_1/apps",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

  it("updates the profile avatar when the profile color changes", () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <UserPopup
          user={{ name: "Ada Lovelace", email: "ada@example.com" }}
          color={additionalColors.pink}
        />
      </Provider>,
    );

    const avatar = screen.getByText("AL");
    expect(avatar).toHaveStyle({
      backgroundColor: additionalColors.pink[100],
      color: additionalColors.pink[500],
    });

    act(() => store.set(colorAtom, additionalColors.green));

    expect(avatar).toHaveStyle({
      backgroundColor: additionalColors.green[100],
      color: additionalColors.green[500],
    });
  });
});
// #endregion
