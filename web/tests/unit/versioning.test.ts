import {
  getCurrentPathWithSearch,
  getMiniAppNavState,
  getPathWithExplicitVersion,
  getSelectedAppVersion,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/versioning";

describe("versioning helpers", () => {
  it("normalizes stale requested versions against availability", () => {
    expect(
      getSelectedAppVersion({
        hasDraft: false,
        hasVerified: true,
        searchParams: new URLSearchParams("version=current"),
      }),
    ).toBe("approved");

    expect(
      getSelectedAppVersion({
        hasDraft: true,
        hasVerified: false,
        searchParams: new URLSearchParams("version=approved"),
      }),
    ).toBe("current");
  });

  it("rebuilds the current path with its query string", () => {
    expect(
      getCurrentPathWithSearch(
        "/teams/team_123/apps/app_123/configuration",
        new URLSearchParams("version=approved&foo=bar"),
      ),
    ).toBe(
      "/teams/team_123/apps/app_123/configuration?version=approved&foo=bar",
    );
  });

  it("preserves only explicit valid versions for legacy redirects", () => {
    expect(
      getPathWithExplicitVersion(
        "/teams/team_123/apps/app_123/mini-app/permissions",
        { version: "approved" },
      ),
    ).toBe(
      "/teams/team_123/apps/app_123/mini-app/permissions?version=approved",
    );

    expect(
      getPathWithExplicitVersion(
        "/teams/team_123/apps/app_123/mini-app/permissions",
        { version: "stale" },
      ),
    ).toBe("/teams/team_123/apps/app_123/mini-app/permissions");
  });

  it("builds mini app hrefs and active flags for versioned and unversioned URLs", () => {
    expect(
      getMiniAppNavState({
        teamId: "team_123",
        appId: "app_123",
        pathname: "/teams/team_123/apps/app_123/mini-app/permissions",
        searchParams: new URLSearchParams("version=approved"),
        hasDraft: true,
        hasVerified: true,
      }),
    ).toMatchObject({
      version: "approved",
      permissionsPath:
        "/teams/team_123/apps/app_123/mini-app/permissions?version=approved",
      isPermissionsActive: true,
      isTransactionsActive: false,
      isNotificationsActive: false,
    });

    expect(
      getMiniAppNavState({
        teamId: "team_123",
        appId: "app_123",
        pathname: "/teams/team_123/apps/app_123/mini-app/transactions",
        searchParams: new URLSearchParams(),
        hasDraft: false,
        hasVerified: true,
      }),
    ).toMatchObject({
      version: "approved",
      transactionsPath: "/teams/team_123/apps/app_123/mini-app/transactions",
      isPermissionsActive: false,
      isTransactionsActive: true,
      isNotificationsActive: false,
    });
  });

  it("preserves explicit requested versions in mini app nav while availability is unresolved", () => {
    expect(
      getMiniAppNavState({
        teamId: "team_123",
        appId: "app_123",
        pathname: "/teams/team_123/apps/app_123/mini-app/permissions",
        searchParams: new URLSearchParams("version=approved"),
        hasDraft: false,
        hasVerified: false,
        preserveRequestedVersion: true,
      }),
    ).toMatchObject({
      version: "approved",
      permissionsPath:
        "/teams/team_123/apps/app_123/mini-app/permissions?version=approved",
      transactionsPath:
        "/teams/team_123/apps/app_123/mini-app/transactions?version=approved",
      isPermissionsActive: true,
    });

    expect(
      getMiniAppNavState({
        teamId: "team_123",
        appId: "app_123",
        pathname: "/teams/team_123/apps/app_123/mini-app/transactions",
        searchParams: new URLSearchParams("version=current"),
        hasDraft: false,
        hasVerified: false,
        preserveRequestedVersion: true,
      }),
    ).toMatchObject({
      version: "current",
      permissionsPath:
        "/teams/team_123/apps/app_123/mini-app/permissions?version=current",
      transactionsPath:
        "/teams/team_123/apps/app_123/mini-app/transactions?version=current",
      isTransactionsActive: true,
    });

    expect(
      getMiniAppNavState({
        teamId: "team_123",
        appId: "app_123",
        pathname: "/teams/team_123/apps/app_123/mini-app/notifications",
        searchParams: new URLSearchParams(),
        hasDraft: false,
        hasVerified: false,
        preserveRequestedVersion: true,
      }),
    ).toMatchObject({
      version: "current",
      notificationsPath: "/teams/team_123/apps/app_123/mini-app/notifications",
      isNotificationsActive: true,
    });
  });
});
