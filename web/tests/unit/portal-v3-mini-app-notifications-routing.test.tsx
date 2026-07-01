/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page",
  () => ({
    NotificationsPage: () => <div data-testid="v2-notifications" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page",
  () => ({
    NotificationsPage: () => <div data-testid="v3-notifications" />,
  }),
);

import NotificationsRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/notifications/page";

it("renders the v3 Notifications page for v3, not v2", async () => {
  render(
    await NotificationsRoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-notifications")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-notifications")).not.toBeInTheDocument();
});
