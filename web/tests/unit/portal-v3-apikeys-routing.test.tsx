/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/ApiKeys/page", () => ({
  TeamApiKeysPage: () => <div data-testid="v2-apikeys" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/ApiKeys/page", () => ({
  TeamApiKeysPage: () => <div data-testid="v3-apikeys" />,
}));

import ApiKeysRoutePage from "../../app/(portal)/teams/[teamId]/(team)/api-keys/page";

it("renders the v3 API-keys page for v3, not v2", async () => {
  render(
    await ApiKeysRoutePage({ params: Promise.resolve({ teamId: "team_1" }) }),
  );
  expect(screen.getByTestId("v3-apikeys")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-apikeys")).not.toBeInTheDocument();
});
