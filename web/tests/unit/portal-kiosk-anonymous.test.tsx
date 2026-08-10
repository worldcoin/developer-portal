/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
// I/O boundary: the anonymous GetKioskAction query. The Hasura `public` role
// has no permissions on the action tables, so a session-less visitor's query
// resolves with a GraphQL error and `data` stays undefined.
const useQuery = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

const useSearchParams = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

// Interactive kiosk tree (idkit, posthog); it must not mount without data,
// so stub it to make its absence assertable.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk/ActiveKiosk",
  () => ({
    ActiveKioskPage: () => <div data-testid="active-kiosk" />,
  }),
);

import KioskRoutePage from "../../app/(portal)/kiosk/[appId]/[actionId]/page";
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const actionId = "action_0123456789abcdef";

// React 19's `use()` unwraps an already-fulfilled thenable synchronously,
// so the client page renders without a Suspense boundary in the test.
const fulfilledParams = (value: Record<string, string>) =>
  Object.assign(Promise.resolve(value), {
    status: "fulfilled",
    value,
  }) as Promise<Record<string, string>>;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  useSearchParams.mockReturnValue(new URLSearchParams());
  useQuery.mockReturnValue({ data: undefined });
});

// #region anonymous visitor gets the shell, not a crash
// Invariant: the kiosk route is public — anonymous kiosk = shell only. The
// page mounts its SizingWrapper shell without a session (no redirect, no
// throw); kiosk data requires a signed-in team member.
describe("/kiosk/[appId]/[actionId] [anonymous visitor]", () => {
  it("mounts the shell without crashing and without the active kiosk", () => {
    const { container } = render(
      <KioskRoutePage params={fulfilledParams({ appId, actionId })} />,
    );

    // The SizingWrapper shell rendered...
    expect(container.firstElementChild).not.toBeNull();
    // ...but with no data, the kiosk itself does not mount.
    expect(screen.queryByTestId("active-kiosk")).not.toBeInTheDocument();
    // The query was attempted with the route params (params promise unwrapped).
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { action_id: actionId, app_id: appId },
      }),
    );
  });
});
// #endregion
