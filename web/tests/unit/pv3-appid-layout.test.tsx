/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const getIsUserAllowedToReadApp = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
}));

import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";

const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const renderLayout = async (value?: string) =>
  render(
    await AppIdLayout({
      params: { teamId: "team_1", appId: value },
      children: <div data-testid="page" />,
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
});

it("renders the app for a member", async () => {
  await renderLayout(appId);
  expect(screen.getByTestId("page")).toBeInTheDocument();
});

it("returns 404 when the user cannot read the app", async () => {
  getIsUserAllowedToReadApp.mockResolvedValue(false);
  await renderLayout(appId);
  expect(screen.getByTestId("error")).toHaveAttribute("data-status", "404");
});

it("returns 404 without querying when appId is missing", async () => {
  await renderLayout();
  expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
  expect(screen.getByTestId("error")).toHaveAttribute("data-status", "404");
});
