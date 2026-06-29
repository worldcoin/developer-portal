/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: () => getSession() },
}));

const fetchAppEnvCached = jest.fn();
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env",
  () => ({
    fetchAppEnvCached: (appId: string) => fetchAppEnvCached(appId),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ErrorPage stub exposes the status code so we can assert on the guard branch.
jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: (props: { statusCode: number; title?: string }) => (
    <div data-testid="error-page" data-status={props.statusCode}>
      {props.title}
    </div>
  ),
}));

import { AppIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";

const TEAM_ID = "team_123";
const APP_ID = "app_00000000000000000000000000000000";

const sessionForTeam = (teamId: string) => ({
  user: { hasura: { memberships: [{ team: { id: teamId } }] } },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AppIdLayoutV3 guard", () => {
  it("renders 404 when the user is not a member of the team", async () => {
    getSession.mockResolvedValue(sessionForTeam("some_other_team"));
    const element = await AppIdLayoutV3({
      params: { teamId: TEAM_ID, appId: APP_ID },
      children: <div data-testid="page-body">body</div>,
    });
    const { getByTestId, queryByTestId } = render(element);
    expect(getByTestId("error-page")).toHaveAttribute("data-status", "404");
    expect(queryByTestId("page-body")).not.toBeInTheDocument();
    expect(fetchAppEnvCached).not.toHaveBeenCalled();
  });

  it("renders 404 when fetchAppEnvCached returns no app", async () => {
    getSession.mockResolvedValue(sessionForTeam(TEAM_ID));
    fetchAppEnvCached.mockResolvedValue({ app: [], action: [] });
    const element = await AppIdLayoutV3({
      params: { teamId: TEAM_ID, appId: APP_ID },
      children: <div data-testid="page-body">body</div>,
    });
    const { getByTestId } = render(element);
    expect(getByTestId("error-page")).toHaveAttribute("data-status", "404");
  });

  it("renders 500 when fetchAppEnvCached throws", async () => {
    getSession.mockResolvedValue(sessionForTeam(TEAM_ID));
    fetchAppEnvCached.mockRejectedValue(new Error("boom"));
    const element = await AppIdLayoutV3({
      params: { teamId: TEAM_ID, appId: APP_ID },
      children: <div data-testid="page-body">body</div>,
    });
    const { getByTestId } = render(element);
    expect(getByTestId("error-page")).toHaveAttribute("data-status", "500");
  });

  it("renders children (no AppIdChrome) on the happy path", async () => {
    getSession.mockResolvedValue(sessionForTeam(TEAM_ID));
    fetchAppEnvCached.mockResolvedValue({
      app: [
        {
          engine: "cloud",
          rp_registration: [],
          is_staging: false,
        },
      ],
      action: [],
    });
    const element = await AppIdLayoutV3({
      params: { teamId: TEAM_ID, appId: APP_ID },
      children: <div data-testid="page-body">body</div>,
    });
    const { getByTestId, queryByTestId } = render(element);
    expect(getByTestId("page-body")).toBeInTheDocument();
    expect(queryByTestId("error-page")).not.toBeInTheDocument();
  });
});
