/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page",
  () => ({ WorldIdActionsPage: () => <div data-testid="v2-wia-list" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page",
  () => ({ WorldIdActionsPage: () => <div data-testid="v3-wia-list" /> }),
);
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout", () => ({
  WorldIdLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="v3-world-id-layout">{children}</div>
  ),
}));
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env",
  () => ({ fetchAppEnvCached: jest.fn().mockResolvedValue({ action: [] }) }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/page";
it("renders v3 wia-list", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "t", appId: "a" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-world-id-layout")).toBeInTheDocument();
  expect(screen.getByTestId("v3-wia-list")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-list")).not.toBeInTheDocument();
});
