/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { additionalColors } from "@/lib/additional-colors";
import { colorAtom } from "@/scenes/common/layout/color-atom";
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
  it("preloads account-menu icons before the lazy menu opens", () => {
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

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    const preloadedImages = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>(
        'link[rel="preload"][as="image"]',
      ),
      (link) => link.getAttribute("href"),
    );

    expect(preloadedImages).toEqual(
      expect.arrayContaining([
        "/images/portal-v3/icons/profile-menu-profile.svg",
        "/images/portal-v3/icons/nav-help.svg",
        "/images/portal-v3/icons/profile-menu-log-out.svg",
        "/images/portal-v3/icons/profile-menu-docs.svg",
        "/images/portal-v3/icons/profile-menu-terms.svg",
      ]),
    );
  });

  it("preloads switcher icons before the lazy popover opens", () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <TeamsDropdown teams={[{ id: "team_1", name: "Example team" }]} />
        </SidebarProvider>
      </TooltipProvider>,
    );

    expect(
      screen.queryByTestId("team-switcher-list"),
    ).not.toBeInTheDocument();

    const preloadedImages = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>(
        'link[rel="preload"][as="image"]',
      ),
      (link) => link.getAttribute("href"),
    );

    expect(preloadedImages).toEqual(
      expect.arrayContaining([
        "/images/portal-v3/icons/dropdown-plus.svg",
        "/images/portal-v3/icons/dropdown-check.svg",
        "/images/portal-v3/icons/apps-empty-icon.svg",
      ]),
    );
  });

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

  it("opens Help Center options when its profile-menu item is hovered", async () => {
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
    const helpCenter = await screen.findByRole("menuitem", {
      name: "Help center",
    });

    fireEvent.pointerEnter(helpCenter);

    expect(
      await screen.findByRole("menuitem", { name: "Documentation" }),
    ).toBeInTheDocument();
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
