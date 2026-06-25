import ActionsLayout from "@/app/(portal)/teams/[teamId]/apps/[appId]/actions/layout";
import WorldId40Layout from "@/app/(portal)/teams/[teamId]/apps/[appId]/world-id-4-0/layout";
import WorldIdActionsLayout from "@/app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/layout";

// #region Mocks
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const fetchAppEnvCachedMock = jest.fn();
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env",
  () => ({
    fetchAppEnvCached: (...args: unknown[]) => fetchAppEnvCachedMock(...args),
  }),
);
// #endregion

// #region Test Data
const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";

const makeProps = () => ({
  params: Promise.resolve({ teamId, appId }),
  children: null,
});

const withAppEnv = (overrides: {
  rpRegistrations?: Array<{ rp_id: string }>;
  actions?: unknown[];
}) => {
  fetchAppEnvCachedMock.mockResolvedValue({
    app: [{ rp_registration: overrides.rpRegistrations ?? [] }],
    action: overrides.actions ?? [],
  });
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// The World ID tab routing is now driven entirely by real state — no rollout
// feature flag. These layouts implement "setup stays behind the tab": an app
// without an RP registration is routed into the enable flow.

const enableFlowUrl = `/teams/${teamId}/apps/${appId}?enableWorldId4=true`;

// #region world-id-4-0 layout (RP settings surface)
describe("world-id-4-0 layout [setup behind the tab]", () => {
  it("redirects an app without RP registration into the enable flow", async () => {
    withAppEnv({ rpRegistrations: [] });

    await WorldId40Layout(makeProps());

    expect(redirectMock).toHaveBeenCalledWith(enableFlowUrl);
  });

  it("does not redirect once the app already has an RP registration", async () => {
    withAppEnv({ rpRegistrations: [{ rp_id: "rp_abc123" }] });

    await WorldId40Layout(makeProps());

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region world-id-actions layout (the World ID 4.0 surface)
describe("world-id-actions layout [setup behind the tab]", () => {
  it("redirects an app without RP registration into the enable flow", async () => {
    withAppEnv({ rpRegistrations: [] });

    await WorldIdActionsLayout(makeProps());

    expect(redirectMock).toHaveBeenCalledWith(enableFlowUrl);
  });

  it("does not redirect once the app already has an RP registration", async () => {
    withAppEnv({ rpRegistrations: [{ rp_id: "rp_abc123" }] });

    await WorldIdActionsLayout(makeProps());

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region actions layout (legacy v3 surface)
describe("actions layout [legacy route stays reachable]", () => {
  it("does not redirect — legacy /actions remains available for v3 apps", async () => {
    withAppEnv({ actions: [] });

    await ActionsLayout(makeProps());

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion
