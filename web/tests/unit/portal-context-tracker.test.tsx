/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
let mockParams: { teamId?: string; appId?: string } = {};
jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
}));

const mockUser = {
  hasura: { id: "usr_11111111111111111111111111111111" },
};
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockUser }),
}));
// #endregion

import {
  PORTAL_CONTEXT_COOKIE,
  parsePortalContextCookie,
  serializePortalContext,
} from "@/lib/portal-context";
import { PortalContextTracker } from "@/scenes/common/layout/PortalContextTracker";

// #region Test Data
const USER_ID = "usr_11111111111111111111111111111111";
const TEAM_A_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEAM_B_ID = "team_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const APP_ID = "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const writeContext = (context: {
  userId: string;
  teamId: string;
  appId?: string;
}) => {
  document.cookie = `${PORTAL_CONTEXT_COOKIE}=${serializePortalContext(context)}; Path=/`;
};
// #endregion

beforeEach(() => {
  mockParams = {};
  document.cookie = `${PORTAL_CONTEXT_COOKIE}=; Path=/; Max-Age=0`;
});

// #region Mounted route tracking
describe("PortalContextTracker", () => {
  it("stores the team and app from an app-scoped route", async () => {
    mockParams = { teamId: TEAM_A_ID, appId: APP_ID };

    render(<PortalContextTracker />);

    await waitFor(() => {
      expect(parsePortalContextCookie(document.cookie)).toEqual({
        userId: USER_ID,
        teamId: TEAM_A_ID,
        appId: APP_ID,
      });
    });
  });

  it("preserves the app while visiting a route in the same team", async () => {
    writeContext({ userId: USER_ID, teamId: TEAM_A_ID, appId: APP_ID });
    mockParams = { teamId: TEAM_A_ID };

    render(<PortalContextTracker />);

    await waitFor(() => {
      expect(parsePortalContextCookie(document.cookie)).toEqual({
        userId: USER_ID,
        teamId: TEAM_A_ID,
        appId: APP_ID,
      });
    });
  });

  it("does not carry an app into a different team", async () => {
    writeContext({ userId: USER_ID, teamId: TEAM_A_ID, appId: APP_ID });
    mockParams = { teamId: TEAM_B_ID };

    render(<PortalContextTracker />);

    await waitFor(() => {
      expect(parsePortalContextCookie(document.cookie)).toEqual({
        userId: USER_ID,
        teamId: TEAM_B_ID,
      });
    });
  });
});
// #endregion
