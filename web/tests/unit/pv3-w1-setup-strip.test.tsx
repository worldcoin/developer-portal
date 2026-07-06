/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks

// Control the actions query result per test.
const getActions = jest.fn();
const stopPolling = jest.fn();
const startPolling = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/page/graphql/client/get-actions-v4.generated",
  () => ({
    useGetActionsV4Query: (...args: unknown[]) => getActions(...args),
  }),
);

jest.mock("posthog-js", () => ({ capture: jest.fn() }));

const push = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useParams: () => ({ teamId: "team_1" }),
}));

// Strip's registration-retry flow goes through the real useAutoRegisterRp
// hook (that's part of what's under test per the task brief), so mock the
// registerRp mutation module at the same boundary the dialog tests use —
// NOT the hook itself.
const registerRpMock = jest.fn();
jest.mock(
  "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated",
  () => ({
    useRegisterRpMutation: () => [registerRpMock, { loading: false }],
  }),
);

let walletCallCount = 0;
jest.mock("ethers", () => ({
  Wallet: {
    createRandom: () => {
      walletCallCount += 1;
      return {
        address: `0xADDR${walletCallCount}`,
        privateKey: `0xPRIV${walletCallCount}`,
      };
    },
  },
}));

// #endregion

import posthog from "posthog-js";
import { SetupStrip } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/SetupStrip";

beforeEach(() => {
  jest.clearAllMocks();
  walletCallCount = 0;
});

// #region Test Data

const actionsQueryResult = (
  actions: { count: number }[],
  overrides: Partial<{
    loading: boolean;
    error: Error | undefined;
    stopPolling: jest.Mock;
    startPolling: jest.Mock;
  }> = {},
) => ({
  data: {
    app: [{ rp_registration: [{ rp_id: "rp_1" }] }],
    action_v4: actions.map((a, i) => ({
      id: `action_${i}`,
      action: `action_${i}`,
      description: "desc",
      created_at: "2026-01-01T00:00:00Z",
      nullifiers_aggregate: { aggregate: { count: a.count } },
    })),
  },
  loading: overrides.loading ?? false,
  error: overrides.error,
  stopPolling: overrides.stopPolling ?? stopPolling,
  startPolling: overrides.startPolling ?? startPolling,
});

// #endregion

describe("SetupStrip", () => {
  it("RP missing + canRegisterRp: shows finishing-setup copy with a Retry registration button", () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration={false}
        canRegisterRp
      />,
    );
    expect(
      screen.getByText(/isn't registered for World ID yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry registration/i }),
    ).toBeInTheDocument();
  });

  it("RP missing + !canRegisterRp: shows ask-an-admin text without a button", () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration={false}
        canRegisterRp={false}
      />,
    );
    expect(
      screen.getByText(/team owner or admin needs to finish World ID setup/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry registration/i }),
    ).not.toBeInTheDocument();
  });

  it("RP missing + canRegisterRp: clicking Retry registers and shows the save-your-key panel, confirming resets and refreshes", async () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    registerRpMock.mockResolvedValue({
      data: { register_rp: { rp_id: "rp_1" } },
    });

    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration={false}
        canRegisterRp
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /retry registration/i }),
    );

    expect(await screen.findByText("0xPRIV1")).toBeInTheDocument();
    expect(
      screen.getByText(/will not be shown again|shown once/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", {
      name: /i saved my key/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("RP missing + registration fails: shows error detail and a Retry again button", async () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    registerRpMock.mockRejectedValue(new Error("boom"));

    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration={false}
        canRegisterRp
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /retry registration/i }),
    );

    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry again/i }),
    ).toBeInTheDocument();
  });

  it("RP ok, zero actions: shows Create your first action CTA linking to worldIdActions", () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    const cta = screen.getByRole("link", { name: /create your first action/i });
    expect(cta).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/world-id-actions",
    );
  });

  it("RP ok, actions exist, zero verifications: shows live-wait copy with a pulse dot and starts polling", () => {
    getActions.mockReturnValue(actionsQueryResult([{ count: 0 }]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    expect(
      screen.getByText(/waiting for your first verification/i),
    ).toBeInTheDocument();
    expect(getActions).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { app_id: "app_1" } }),
    );
    expect(startPolling).toHaveBeenCalledWith(5000);
  });

  it("RP ok, actions exist, verifications > 0: renders null", () => {
    getActions.mockReturnValue(actionsQueryResult([{ count: 2 }]));
    const { container } = render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does not poll (skips the query) when RP is missing", () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration={false}
        canRegisterRp
      />,
    );
    const [options] = getActions.mock.calls[0];
    expect(options.skip).toBe(true);
    expect(startPolling).not.toHaveBeenCalled();
  });

  it("does not start polling when RP is ok but there are zero actions (state 2)", () => {
    getActions.mockReturnValue(actionsQueryResult([]));
    render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    expect(startPolling).not.toHaveBeenCalled();
    expect(stopPolling).toHaveBeenCalled();
  });

  it("poll transition 0 -> 1 shows the first-proof confirmation, captures posthog exactly once, and stops polling", () => {
    getActions.mockReturnValue(actionsQueryResult([{ count: 0 }]));
    const { rerender } = render(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    expect(
      screen.getByText(/waiting for your first verification/i),
    ).toBeInTheDocument();

    getActions.mockReturnValue(actionsQueryResult([{ count: 1 }]));
    rerender(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );

    expect(screen.getByText(/first proof received/i)).toBeInTheDocument();
    expect(posthog.capture).toHaveBeenCalledWith("v3_first_proof_received", {
      app_id: "app_1",
    });
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(stopPolling).toHaveBeenCalled();

    // Rerender again with the same crossed state — capture must not fire twice.
    rerender(
      <SetupStrip
        appId="app_1"
        teamId="team_1"
        hasRpRegistration
        canRegisterRp
      />,
    );
    expect(posthog.capture).toHaveBeenCalledTimes(1);
  });
});
