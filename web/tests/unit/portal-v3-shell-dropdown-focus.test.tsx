/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
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

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));
// #endregion

// #region Trigger focus treatment
describe("Portal v3 shell dropdown focus treatment", () => {
  it("uses a clean background cue instead of a persistent focus ring", () => {
    render(
      <SidebarProvider>
        <TeamsDropdown teams={[{ id: "team_1", name: "Example team" }]} />
        <UserPopup
          user={{ name: "Ada Lovelace", email: "ada@example.com" }}
          color={null}
        />
      </SidebarProvider>,
    );

    const teamTrigger = screen.getByRole("button", { name: "Switch team" });
    const profileTrigger = screen.getByRole("button", {
      name: "Account menu",
    });

    for (const trigger of [teamTrigger, profileTrigger]) {
      expect(trigger).toHaveClass("focus-visible:bg-portal-border");
      expect(trigger).toHaveClass("focus-visible:ring-0");
    }
  });

  it("updates the profile avatar when the profile color changes", () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <SidebarProvider>
          <UserPopup
            user={{ name: "Ada Lovelace", email: "ada@example.com" }}
            color={additionalColors.pink}
          />
        </SidebarProvider>
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
