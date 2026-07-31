/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

let mockPortalVersion: "v2" | "v3" = "v3";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalVersion === "v3" ? v3() : v2(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page",
  () => ({ WorldIdActionsPage: () => <div data-testid="v2-wia-list" /> }),
);

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/page";

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalVersion = "v3";
});

describe("/world-id-actions [Portal V3 compatibility]", () => {
  it("redirects the retired list route to the canonical Actions tab", async () => {
    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=actions",
    );
  });

  it("preserves query parameters and overwrites a stale tab", async () => {
    await RoutePage(props({ createAction: "true", tab: "configuration" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?createAction=true&tab=actions",
    );
  });
});

describe("/world-id-actions [Portal V2]", () => {
  it("retains the existing World ID Actions page", async () => {
    mockPortalVersion = "v2";

    render(
      await RoutePage({
        params: Promise.resolve({ teamId: "t", appId: "a" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("v2-wia-list")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
