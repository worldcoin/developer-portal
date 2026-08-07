/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    teamSettings: ({ team_id }: { team_id: string }) =>
      `/teams/${team_id}/settings`,
  },
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/api-keys/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("redirects api keys to consolidated team settings", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/settings");
});
