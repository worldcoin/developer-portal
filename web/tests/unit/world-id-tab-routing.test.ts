import ActionsLayout from "@/app/(portal)/teams/[teamId]/apps/[appId]/actions/layout";
import WorldId40Layout from "@/app/(portal)/teams/[teamId]/apps/[appId]/world-id-4-0/layout";
import WorldIdActionsLayout from "@/app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/layout";
import { FetchAppEnvQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";

// #region Mocks
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

const fetchAppEnvCachedMock = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env",
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

const makeAppEnv = (overrides: {
  rpRegistrations?: Array<{ rp_id: string }>;
  actions?: unknown[];
}): FetchAppEnvQuery =>
  ({
    app: [
      {
        id: appId,
        engine: "cloud",
        is_staging: false,
        rp_registration: overrides.rpRegistrations ?? [],
      },
    ],
    action: (overrides.actions ?? []) as FetchAppEnvQuery["action"],
  }) as FetchAppEnvQuery;

const withAppEnv = (overrides: {
  rpRegistrations?: Array<{ rp_id: string }>;
  actions?: unknown[];
}) => {
  fetchAppEnvCachedMock.mockResolvedValue(makeAppEnv(overrides));
};

const driveV2 = () =>
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

const enableFlowUrl = `/teams/${teamId}/apps/${appId}?enableWorldId4=true`;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
});

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

// #region world-id-actions layout (RP guard now v2-only)
describe("world-id-actions layout [RP guard moved to v2]", () => {
  it("passes through without redirecting for v3", async () => {
    withAppEnv({ rpRegistrations: [] });

    await WorldIdActionsLayout(makeProps());

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects a v2 app without RP registration into the enable flow", async () => {
    driveV2();
    withAppEnv({ rpRegistrations: [] });

    await WorldIdActionsLayout(makeProps());

    expect(redirectMock).toHaveBeenCalledWith(enableFlowUrl);
  });

  it("does not redirect a v2 app that already has an RP registration", async () => {
    driveV2();
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
