/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { additionalColors } from "@/lib/additional-colors";
import { colorAtom } from "@/scenes/common/layout/color-atom";
import { HelpCenterMenu } from "@/scenes/PortalV3/layout/Shell/HelpCenterMenu";
import { NavItem } from "@/scenes/PortalV3/layout/Shell/NavItem";
import { TeamsDropdown } from "@/scenes/PortalV3/layout/Shell/TeamsDropdown";
import { UserPopup } from "@/scenes/PortalV3/layout/Shell/UserPopup";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
      <TooltipProvider>
        <SidebarProvider>
          <TeamsDropdown teams={[{ id: "team_1", name: "Example team" }]} />
          <UserPopup
            user={{ name: "Ada Lovelace", email: "ada@example.com" }}
            color={null}
          />
        </SidebarProvider>
      </TooltipProvider>,
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

  it("uses a pointer cursor for interactive sidebar items", () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <NavItem href="/world-id" label="World ID" />
          <HelpCenterMenu />
          <TeamsDropdown teams={[{ id: "team_1", name: "Example team" }]} />
          <UserPopup
            user={{ name: "Ada Lovelace", email: "ada@example.com" }}
            color={null}
          />
        </SidebarProvider>
      </TooltipProvider>,
    );

    for (const element of [
      screen.getByRole("link", { name: "World ID" }),
      screen.getByRole("button", { name: "Help center" }),
      screen.getByRole("button", { name: "Switch team" }),
      screen.getByRole("button", { name: "Account menu" }),
    ]) {
      expect(element).toHaveClass("cursor-pointer");
    }
  });

  it("opens the profile menu directly above the profile row", async () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <UserPopup
            user={{ name: "Ada Lovelace", email: "ada@example.com" }}
            color={null}
          />
        </SidebarProvider>
      </TooltipProvider>,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Account menu" }), {
      key: "ArrowDown",
    });

    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("data-side", "top");
    expect(menu).toHaveClass("w-(--radix-dropdown-menu-trigger-width)");
  });

  it("updates the profile avatar when the profile color changes", () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <TooltipProvider>
          <SidebarProvider>
            <UserPopup
              user={{ name: "Ada Lovelace", email: "ada@example.com" }}
              color={additionalColors.pink}
            />
          </SidebarProvider>
        </TooltipProvider>
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
