/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FetchAppEnvQuery } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

const fetchAppEnvCached = jest.fn();
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env",
  () => ({
    fetchAppEnvCached: (...args: unknown[]) => fetchAppEnvCached(...args),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SidebarNav", () => ({
  AppEnvFlagsSync: ({
    appId,
    hasRpRegistration,
    hasLegacyActions,
  }: {
    appId: string;
    hasRpRegistration: boolean;
    hasLegacyActions: boolean;
  }) => (
    <div
      data-testid="flags-sync"
      data-app-id={appId}
      data-rp={String(hasRpRegistration)}
      data-legacy={String(hasLegacyActions)}
    />
  ),
}));

import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
// #endregion

// #region Test Data
const teamId = "team_1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";

const makeAppEnv = (overrides: {
  rpRegistrations?: Array<{ rp_id: string }>;
  actions?: unknown[];
}): FetchAppEnvQuery =>
  ({
    app: [
      {
        id: appId,
        engine: "cloud",
        is_staging: false,
        rp_registration: overrides.rpRegistrations ?? [],
      },
    ],
    action: (overrides.actions ?? []) as FetchAppEnvQuery["action"],
  }) as FetchAppEnvQuery;

const renderLayout = async (params: { teamId?: string; appId?: string }) =>
  render(await AppIdLayout({ params, children: <div data-testid="page" /> }));

const status = () => screen.getByTestId("error").getAttribute("data-status");
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  // clearAllMocks clears call data but not implementations, so reset the
  // resolved/rejected value between tests to avoid leakage.
  fetchAppEnvCached.mockReset();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
});

// #region auth / existence guard
describe("v3 AppIdLayout [guard]", () => {
  it("returns 404 when the user is not allowed to read the app (and never fetches app-env)", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);
    await renderLayout({ teamId, appId });
    expect(status()).toBe("404");
    expect(fetchAppEnvCached).not.toHaveBeenCalled();
  });

  it("returns 404 when appId is missing, short-circuiting the DB check and fetch", async () => {
    await renderLayout({ teamId });
    expect(status()).toBe("404");
    expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
    expect(fetchAppEnvCached).not.toHaveBeenCalled();
  });

  it("returns 404 when the app cannot be resolved from FetchAppEnv", async () => {
    fetchAppEnvCached.mockResolvedValue({
      app: [],
      action: [],
    } as unknown as FetchAppEnvQuery);
    await renderLayout({ teamId, appId });
    expect(status()).toBe("404");
    expect(screen.queryByTestId("flags-sync")).not.toBeInTheDocument();
  });

  it("returns 500 when FetchAppEnv throws — a dependency failure is not masked as 404", async () => {
    fetchAppEnvCached.mockRejectedValue(new Error("upstream down"));
    await renderLayout({ teamId, appId });
    expect(status()).toBe("500");
  });
});
// #endregion

// #region success → sidebar flags + children
describe("v3 AppIdLayout [publishes app-env flags]", () => {
  it("renders children directly (no chrome) and publishes hasRpRegistration=true when the app has an RP registration", async () => {
    fetchAppEnvCached.mockResolvedValue(
      makeAppEnv({ rpRegistrations: [{ rp_id: "rp_abc" }] }),
    );
    await renderLayout({ teamId, appId });
    expect(screen.getByTestId("page")).toBeInTheDocument();
    const flags = screen.getByTestId("flags-sync");
    expect(flags.getAttribute("data-app-id")).toBe(appId);
    expect(flags.getAttribute("data-rp")).toBe("true");
    expect(flags.getAttribute("data-legacy")).toBe("false");
  });

  it("publishes hasLegacyActions=true when the app has legacy actions", async () => {
    fetchAppEnvCached.mockResolvedValue(
      makeAppEnv({ actions: [{ id: "a_1" }] }),
    );
    await renderLayout({ teamId, appId });
    const flags = screen.getByTestId("flags-sync");
    expect(flags.getAttribute("data-legacy")).toBe("true");
    expect(flags.getAttribute("data-rp")).toBe("false");
  });

  it("publishes both flags false for an app with no RP registration and no legacy actions", async () => {
    fetchAppEnvCached.mockResolvedValue(makeAppEnv({}));
    await renderLayout({ teamId, appId });
    const flags = screen.getByTestId("flags-sync");
    expect(flags.getAttribute("data-rp")).toBe("false");
    expect(flags.getAttribute("data-legacy")).toBe("false");
  });
});
// #endregion
