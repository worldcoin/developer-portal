/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk",
  () => ({
    ActionIdKioskPage: () => <div data-testid="v2-action-kiosk" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk",
  () => ({
    ActionIdKioskPage: () => <div data-testid="v3-action-kiosk" />,
  }),
);

import ActionIdKioskRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/kiosk/page";

it("renders the v3 action kiosk for v3, not v2", async () => {
  render(
    await ActionIdKioskRoutePage({
      params: Promise.resolve({ actionId: "a_1" }),
    }),
  );
  expect(screen.getByTestId("v3-action-kiosk")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-action-kiosk")).not.toBeInTheDocument();
});
