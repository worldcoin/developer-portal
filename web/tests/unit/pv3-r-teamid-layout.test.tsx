/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
let usePortalV3 = true;
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    usePortalV3 ? v3() : v2(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/layout", () => ({
  TeamIdLayout: ({ children }: React.PropsWithChildren) => (
    <div data-testid="v2-team-id-layout">{children}</div>
  ),
}));
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

beforeEach(() => {
  usePortalV3 = true;
});

it("records Portal V3 visits through the dynamic team layout", async () => {
  await renderLayout();

  expect(screen.getByTestId("v3-team-id-layout")).toContainElement(
    screen.getByTestId("team-page"),
  );
  expect(screen.queryByTestId("v2-team-id-layout")).not.toBeInTheDocument();
});

it("preserves the existing Portal V2 team layout", async () => {
  usePortalV3 = false;

  await renderLayout();

  expect(screen.getByTestId("v2-team-id-layout")).toContainElement(
    screen.getByTestId("team-page"),
  );
  expect(screen.queryByTestId("v3-team-id-layout")).not.toBeInTheDocument();
});
