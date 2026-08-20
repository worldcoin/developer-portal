/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const invalidate = jest.fn().mockResolvedValue(undefined);
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate }),
}));

jest.mock("@/components/Icons/WorldIcon", () => ({
  WorldIcon: () => <span data-testid="join-spinner" />,
}));
// #endregion

import { JoinTeamButton } from "@/scenes/Onboarding/Join/page/JoinTeamButton";
import {
  peekInviteIntent,
  setInviteIntent,
} from "@/scenes/Onboarding/Join/page/invite-intent";

const INVITE_A = "inv_a";
const INVITE_B = "inv_b";
const LOGIN_HREF = "/api/auth/login?returnTo=/join";

const originalLocation = window.location;
const locationAssign = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  global.fetch = jest.fn();
  Object.defineProperty(window, "location", {
    value: { assign: locationAssign },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

const renderButton = (overrides?: {
  invite_id?: string;
  hasSession?: boolean;
}) =>
  render(
    <JoinTeamButton
      invite_id={overrides?.invite_id ?? INVITE_A}
      hasSession={overrides?.hasSession ?? true}
      loginHref={LOGIN_HREF}
    />,
  );

// #region Logged-in confirm
describe("JoinTeamButton [logged-in]", () => {
  it("does not POST when there is a session but no invite intent", () => {
    renderButton({ hasSession: true });

    expect(
      screen.getByRole("button", { name: "Join team" }),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not POST when the stored intent is for a different invite", () => {
    setInviteIntent(INVITE_B);
    renderButton({ hasSession: true, invite_id: INVITE_A });

    expect(
      screen.getByRole("button", { name: "Join team" }),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("auto-POSTs when the stored intent matches the invite", async () => {
    setInviteIntent(INVITE_A);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_1" }),
    });

    renderButton({ hasSession: true, invite_id: INVITE_A });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/join-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_id: INVITE_A }),
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_1"));
    expect(peekInviteIntent(INVITE_A)).toBe(false);
  });

  it("POSTs after an explicit click when there is no intent", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_1" }),
    });

    renderButton({ hasSession: true });
    fireEvent.click(screen.getByRole("button", { name: "Join team" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_1"));
  });

  it("toasts the API detail when the invite email does not match", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        code: "invite_email_mismatch",
        detail: "Invite email does not match logged in email.",
      }),
    });

    renderButton({ hasSession: true });
    fireEvent.click(screen.getByRole("button", { name: "Join team" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Invite email does not match logged in email.",
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Logged-out login
describe("JoinTeamButton [logged-out]", () => {
  it("stores intent and goes to Auth0 without POSTing", () => {
    renderButton({ hasSession: false });
    fireEvent.click(screen.getByRole("button", { name: "Join team" }));

    expect(peekInviteIntent(INVITE_A)).toBe(true);
    expect(locationAssign).toHaveBeenCalledWith(LOGIN_HREF);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
// #endregion
