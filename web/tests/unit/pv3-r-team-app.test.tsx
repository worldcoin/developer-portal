/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    apps: ({ team_id }: { team_id: string }) => `/teams/${team_id}/apps`,
  },
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/app/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("redirects team-app to the apps dashboard route", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/apps");
});
