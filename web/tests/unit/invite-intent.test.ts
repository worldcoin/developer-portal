/** @jest-environment jsdom */

import {
  clearInviteIntent,
  peekInviteIntent,
  setInviteIntent,
} from "@/scenes/Onboarding/Join/page/invite-intent";

beforeEach(() => {
  window.sessionStorage.clear();
});

// #region Invite intent storage
describe("invite intent [sessionStorage]", () => {
  it("matches only the invite that was stored", () => {
    setInviteIntent("inv_a");

    expect(peekInviteIntent("inv_a")).toBe(true);
    expect(peekInviteIntent("inv_b")).toBe(false);
  });

  it("clears the stored invite", () => {
    setInviteIntent("inv_a");
    clearInviteIntent();

    expect(peekInviteIntent("inv_a")).toBe(false);
  });
});
// #endregion
