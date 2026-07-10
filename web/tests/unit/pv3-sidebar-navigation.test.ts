import { buildSidebarNavigation } from "@/scenes/PortalV3/layout/Shell/sidebar-navigation";

// #region Test Data
const teamId = "team_1";
const selectedAppId = "app_selected";
const routeAppId = "app_route";
const selectedAppBase = `/teams/${teamId}/apps/${selectedAppId}`;
const routeAppBase = `/teams/${teamId}/apps/${routeAppId}`;

const build = (
  overrides: Partial<Parameters<typeof buildSidebarNavigation>[0]> = {},
) =>
  buildSidebarNavigation({
    pathname: selectedAppBase,
    teamId,
    routeAppId: selectedAppId,
    selectedAppId,
    canSeeApiKeys: true,
    canSeeSettings: true,
    ...overrides,
  });
// #endregion

// #region Context and permissions
describe("buildSidebarNavigation [context and permissions]", () => {
  it("returns an empty main navigation without team context", () => {
    const navigation = build({
      pathname: "/profile",
      teamId: undefined,
      routeAppId: undefined,
    });

    expect(navigation).toEqual({
      kind: "main",
      appItems: [],
      teamItems: [],
    });
  });

  it("keeps app links dimmed until an app is selected and filters team links by permission", () => {
    const navigation = build({
      pathname: `/teams/${teamId}`,
      routeAppId: undefined,
      selectedAppId: undefined,
      canSeeApiKeys: false,
      canSeeSettings: false,
    });

    expect(navigation.kind).toBe("main");
    if (navigation.kind !== "main") return;

    expect(navigation.appItems).toHaveLength(4);
    expect(navigation.appItems.every((item) => item.dimmed)).toBe(true);
    expect(
      navigation.appItems.every((item) => item.href.endsWith("/apps")),
    ).toBe(true);
    expect(navigation.teamItems.map((item) => item.label)).toEqual(["Members"]);
  });
});
// #endregion

// #region Section navigation
describe("buildSidebarNavigation [section navigation]", () => {
  it("builds section links from the route app, independently of the selected app", () => {
    const navigation = build({
      pathname: `${routeAppBase}/mini-app/permissions`,
      routeAppId,
    });

    expect(navigation.kind).toBe("section");
    if (navigation.kind !== "section") return;

    expect(navigation.label).toBe("Mini App");
    expect(navigation.backHref).toBe(routeAppBase);
    expect(navigation.items[0]).toEqual({
      label: "Permissions",
      href: `${routeAppBase}/mini-app/permissions`,
      active: true,
    });
  });

  it("recognizes legacy Mini App aliases without activating sibling items", () => {
    const navigation = build({
      pathname: `${selectedAppBase}/notifications`,
    });

    expect(navigation.kind).toBe("section");
    if (navigation.kind !== "section") return;

    expect(
      navigation.items.find((item) => item.label === "Notifications"),
    ).toMatchObject({ active: true });
    expect(
      navigation.items.find((item) => item.label === "Transactions"),
    ).toMatchObject({ active: false });
  });

  it("does not treat a shared string prefix as a section route", () => {
    const navigation = build({
      pathname: `${selectedAppBase}/mini-app-preview`,
    });

    expect(navigation.kind).toBe("main");
    if (navigation.kind !== "main") return;
    expect(
      navigation.appItems.find((item) => item.label === "Mini App")?.active,
    ).toBe(false);
  });
});
// #endregion

// #region World ID capabilities
describe("buildSidebarNavigation [World ID capabilities]", () => {
  it("routes legacy-only apps to Actions but prefers 4.0 when RP registration exists", () => {
    const legacyNavigation = build({
      appEnvironmentFlags: {
        appId: selectedAppId,
        hasRpRegistration: false,
        hasLegacyActions: true,
      },
    });
    const registeredNavigation = build({
      appEnvironmentFlags: {
        appId: selectedAppId,
        hasRpRegistration: true,
        hasLegacyActions: true,
      },
    });

    expect(legacyNavigation.kind).toBe("main");
    expect(registeredNavigation.kind).toBe("main");
    if (
      legacyNavigation.kind !== "main" ||
      registeredNavigation.kind !== "main"
    ) {
      return;
    }
    expect(
      legacyNavigation.appItems.find((item) => item.label === "World ID")?.href,
    ).toBe(`${selectedAppBase}/actions`);
    expect(
      registeredNavigation.appItems.find((item) => item.label === "World ID")
        ?.href,
    ).toBe(`${selectedAppBase}/world-id-4-0`);
  });

  it("ignores capabilities belonging to another app", () => {
    const navigation = build({
      pathname: `${selectedAppBase}/world-id-4-0`,
      appEnvironmentFlags: {
        appId: "app_other",
        hasRpRegistration: true,
        hasLegacyActions: true,
      },
    });

    expect(navigation.kind).toBe("main");
    if (navigation.kind !== "main") return;
    expect(
      navigation.appItems.find((item) => item.label === "World ID")?.active,
    ).toBe(true);
  });
});
// #endregion
