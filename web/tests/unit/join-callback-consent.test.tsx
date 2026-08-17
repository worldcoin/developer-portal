/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const invalidate = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { hasura: { id: "usr_1" } }, invalidate }),
}));
// #endregion

import { JoinCallbackPageContent } from "@/scenes/Onboarding/JoinCallback/page/JoinCallbackPageContent";
import { toast } from "react-toastify";

// #region Test Data
const INVITE_ID = "invite_1234567890";

const renderConsent = () =>
  render(
    <JoinCallbackPageContent
      invite_id={INVITE_ID}
      teamName="Acme Labs"
      exitUrl="/dashboard"
    />,
  );

const joinButton = () => screen.getByRole("button", { name: /join team/i });

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const fetchMock = jest.fn();
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock as unknown as typeof fetch;
});

// #region Consent is required before the invite is consumed (HackerOne #3943242)
describe("/join-callback consent screen", () => {
  // The load-bearing assertion of the whole fix. This page is reachable by a
  // cross-site top-level navigation carrying an attacker's invite_id, so merely
  // landing on it must not consume anything. The previous implementation POSTed
  // from a mount effect, which made the same-origin guard on the endpoint
  // useless — our own page was the one firing the request.
  it("does not post anything on mount", async () => {
    renderConsent();

    await waitFor(() => expect(joinButton()).toBeInTheDocument());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });

  // The team being joined has to be named: accepting exposes the member's
  // profile to that team, so the user needs to see whose team it is.
  it("names the team being joined", () => {
    renderConsent();

    expect(screen.getByText(/Join Acme Labs/)).toBeInTheDocument();
    expect(
      screen.getByText(/Acme Labs on World's Developer Portal/),
    ).toBeInTheDocument();
  });

  it("offers a way out that does not consume the invite", () => {
    renderConsent();

    const notNow = screen.getByRole("link", { name: /not now/i });

    expect(notNow).toHaveAttribute("href", "/dashboard");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("consumes the invite only once the user clicks, then follows returnTo", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { returnTo: "/teams/team_1" }),
    );

    renderConsent();
    fireEvent.click(joinButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_1"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/join-callback");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(init.body)).toEqual({ invite_id: INVITE_ID });

    // The session has to be refreshed before navigating, or the new membership
    // is missing from the session the destination page is authorised against.
    expect(invalidate).toHaveBeenCalled();
  });

  it("surfaces the endpoint's reason and stays put when the invite is refused", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        code: "invalid_invite",
        detail: "This invite has already been used. Ask for a new one.",
      }),
    );

    renderConsent();
    fireEvent.click(joinButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "This invite has already been used. Ask for a new one.",
      ),
    );

    expect(push).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();

    // The button is re-enabled so a transient failure can be retried.
    await waitFor(() => expect(joinButton()).not.toBeDisabled());
  });

  it("does not navigate when a 200 arrives without a returnTo", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    renderConsent();
    fireEvent.click(joinButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("reports a network failure instead of hanging on the spinner", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    renderConsent();
    fireEvent.click(joinButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to join team"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores repeat clicks while a join is in flight", async () => {
    let release: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
    );

    renderConsent();

    fireEvent.click(joinButton());
    await waitFor(() => expect(joinButton()).toBeDisabled());

    fireEvent.click(joinButton());
    fireEvent.click(joinButton());

    expect(fetchMock).toHaveBeenCalledTimes(1);

    release(jsonResponse(200, { returnTo: "/teams/team_1" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_1"));
  });
});
// #endregion
