/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/page",
  () => ({
    ConfigurationWizardPage: () => <div data-testid="v3-configuration" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/page";

it("renders the configuration wizard", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-configuration")).toBeInTheDocument();
});
