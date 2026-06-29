/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/teams/team_1/apps/app_1",
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
}));

import { SidebarNav } from "@/scenes/PortalV3/Shell/SidebarNav";

describe("PortalV3 actions compatibility route", () => {
  it("renderPortalScene with V3=null renders the v2 ActionsPage body", async () => {
    // Stub the v2 ActionsPage so we don't pull Apollo/GraphQL.
    jest.doMock("@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page", () => ({
      ActionsPage: (props: { searchParams: Promise<unknown> }) => (
        <div data-testid="v2-actions-body">legacy actions</div>
      ),
    }));
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    jest.resetModules();

    const { renderPortalScene } = await import(
      "@/lib/feature-flags/portal-v3/render-portal-scene"
    );
    const { ActionsPage } = await import(
      "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page"
    );
    const Scene = renderPortalScene(ActionsPage, null);
    render(
      Scene({
        params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
        searchParams: Promise.resolve({}),
      } as never),
    );
    // V3=null => v2 body renders (inside the v3 shell at runtime).
    expect(screen.getByTestId("v2-actions-body")).toBeInTheDocument();
  });

  it("v3 SidebarNav renders no /actions or sign-in-with-world-id link", () => {
    const { container } = render(<SidebarNav />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs.some((h) => h?.includes("/actions"))).toBe(false);
    expect(hrefs.some((h) => h?.includes("/sign-in-with-world-id"))).toBe(
      false,
    );
    expect(hrefs.some((h) => h?.includes("proof-debugging"))).toBe(false);
  });
});
