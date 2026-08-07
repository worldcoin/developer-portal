/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout",
  () => ({
    AppProfileLayout: () => <div data-testid="v3-configuration-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/layout";

it("renders the configuration layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-configuration-layout")).toBeInTheDocument();
});
