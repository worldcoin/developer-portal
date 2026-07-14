/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";

const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    apps: ({ team_id }: { team_id: string }) => `/teams/${team_id}/apps`,
  },
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v2-team-root" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
  searchParams: Promise.resolve({}),
});

beforeEach(() => jest.clearAllMocks());

it("redirects v3 team root to the apps list", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/apps");
});
