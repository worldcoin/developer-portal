/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const invalidate = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate }),
}));

const routerPush = jest.fn();
const routerRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

jest.mock("@/scenes/PortalV3/Profile/Teams/page/LeaveTeamDialog", () => ({
  LeaveTeamDialog: (props: {
    open: boolean;
    onClose: (didLeave: boolean) => void;
  }) =>
    props.open ? (
      <button type="button" onClick={() => props.onClose(true)}>
        Confirm leave
      </button>
    ) : null,
}));
// #endregion

import { LeaveTeam } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/LeaveTeam";

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

describe("Team settings LeaveTeam [successful leave]", () => {
  it("refreshes the session before returning to the dashboard", async () => {
    render(<LeaveTeam team={{ id: "team_1", name: "Test team" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Leave team" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm leave" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/update-session", {
        method: "POST",
      });
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(routerRefresh).toHaveBeenCalledTimes(1);
      expect(routerPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
