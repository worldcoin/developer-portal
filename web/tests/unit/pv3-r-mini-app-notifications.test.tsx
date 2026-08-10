/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page",
  () => ({
    NotificationsPage: () => <div data-testid="v3-mini-app-notifications" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/notifications/page";

it("renders mini app notifications", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-mini-app-notifications")).toBeInTheDocument();
});
