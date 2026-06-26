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

// RP onboarding is gated on the World ID tab (world-id-4-0 settings surface).
// Action creation and /world-id-actions stay reachable without registration.

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

// #region world-id-actions layout (actions are not RP-gated)
describe("world-id-actions layout [actions are not RP-gated]", () => {
  it("does not redirect when the app has no RP registration", async () => {
    withAppEnv({ rpRegistrations: [] });

    await WorldIdActionsLayout(makeProps());

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region actions page (legacy index routing)
describe("actions page [legacy index routing]", () => {
  it("redirects /actions to world-id-actions without requiring RP registration", async () => {
    withAppEnv({ actions: [], rpRegistrations: [] });

    const { default: ActionsPageRoute } = await import(
      "@/app/(portal)/teams/[teamId]/apps/[appId]/actions/page"
    );

    await ActionsPageRoute({
      params: Promise.resolve({ teamId, appId }),
      searchParams: Promise.resolve({}),
    });

    expect(redirectMock).toHaveBeenCalledWith(
      `/teams/${teamId}/apps/${appId}/world-id-actions`,
    );
  });

  it("renders the legacy list when ?legacy=true and the app has legacy actions", async () => {
    withAppEnv({ actions: [{ id: "action_123" }] });

    const { default: ActionsPageRoute } = await import(
      "@/app/(portal)/teams/[teamId]/apps/[appId]/actions/page"
    );

    const result = await ActionsPageRoute({
      params: Promise.resolve({ teamId, appId }),
      searchParams: Promise.resolve({ legacy: "true" }),
    });

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
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
