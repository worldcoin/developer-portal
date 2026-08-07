/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/scenes/PortalV3/Teams/TeamId/layout", () => ({
  TeamIdLayout: ({ children }: React.PropsWithChildren) => (
    <div data-testid="v3-team-id-layout">{children}</div>
  ),
}));
// #endregion

import Layout from "../../app/(portal)/teams/[teamId]/layout";

const renderLayout = async () =>
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1" }),
      children: <div data-testid="team-page" />,
    }),
  );

it("records portal visits through the dynamic team layout", async () => {
  await renderLayout();

  expect(screen.getByTestId("v3-team-id-layout")).toContainElement(
    screen.getByTestId("team-page"),
  );
});
