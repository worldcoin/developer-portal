/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
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
    configuration: ({
      team_id,
      app_id,
    }: {
      team_id: string;
      app_id: string;
    }) => `/teams/${team_id}/apps/${app_id}/configuration`,
  },
}));

jest.mock("@/lib/genarate-title", () => ({
  generateMetaTitle: () => "title",
}));

// v3 no longer has a standalone danger page — Danger zone is a section on the
// Configuration page — so only the v2 page component is imported by the shim.
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppProfileDangerPage: () => <div data-testid="v2-danger-page" />,
  }),
);

import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/danger/page";
// #endregion

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("redirects v3 to the Configuration page — Danger zone is a section there now", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
  await Page(props());
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/configuration",
  );
});

it("renders the standalone Danger page for v2, without redirecting", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );
  render(await Page(props()));
  expect(screen.getByTestId("v2-danger-page")).toBeInTheDocument();
  expect(redirect).not.toHaveBeenCalled();
});
