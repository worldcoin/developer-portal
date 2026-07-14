/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page", () => ({
  WorldIdPage: () => <div data-testid="v3-world-id" />,
}));
import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/page";

beforeEach(() => {
  jest.clearAllMocks();
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
});

it("renders the v3 World ID page", async () => {
  render(
    await Page({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-world-id")).toBeInTheDocument();
});

it("preserves the query when v2 falls back to World ID 4.0", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  await Page({
    params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    searchParams: Promise.resolve({ createAction: "true" }),
  });

  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id-4-0?createAction=true",
  );
});
