/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FetchAppEnvQuery } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";

// #region Mocks
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

jest.mock("@/components/SizingWrapper", () => ({
  SizingWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Expose the visible items so we can assert the hidden-flag logic without
// depending on Tab markup.
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/common/SectionSubTabs",
  () => ({
    SectionSubTabs: ({
      items,
    }: {
      items: Array<{ label: string; hidden?: boolean }>;
    }) => (
      <ul data-testid="subtabs">
        {items
          .filter((i) => !i.hidden)
          .map((i) => (
            <li key={i.label}>{i.label}</li>
          ))}
      </ul>
    ),
  }),
);

jest.mock("@/lib/urls", () => ({
  urls: { actions: () => "/actions-legacy" },
}));

import { AppWorldIdSubTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout/AppWorldIdSubTabs";
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

const renderSubTabs = async () =>
  render(await AppWorldIdSubTabs({ teamId, appId }));
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  fetchAppEnvCached.mockReset();
});

// #region visibility from app state
describe("AppWorldIdSubTabs [visibility]", () => {
  it("shows World ID 4.0 + Actions and hides Legacy for an app with an RP registration only", async () => {
    fetchAppEnvCached.mockResolvedValue(
      makeAppEnv({ rpRegistrations: [{ rp_id: "rp_abc" }] }),
    );
    await renderSubTabs();
    expect(screen.getByText("World ID 4.0")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.queryByText("World ID 3.0 Legacy")).not.toBeInTheDocument();
  });

  it("shows only Legacy for an app with legacy actions but no RP registration", async () => {
    fetchAppEnvCached.mockResolvedValue(
      makeAppEnv({ actions: [{ id: "a_1" }] }),
    );
    await renderSubTabs();
    expect(screen.getByText("World ID 3.0 Legacy")).toBeInTheDocument();
    expect(screen.queryByText("World ID 4.0")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders nothing when the app has neither RP registration nor legacy actions", async () => {
    fetchAppEnvCached.mockResolvedValue(makeAppEnv({}));
    const { container } = await renderSubTabs();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
// #endregion

// #region degraded mode
describe("AppWorldIdSubTabs [degraded mode]", () => {
  it("renders nothing (and does not throw) when the app-env fetch fails", async () => {
    fetchAppEnvCached.mockRejectedValue(new Error("upstream down"));
    const { container } = await renderSubTabs();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
// #endregion
