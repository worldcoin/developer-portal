import { urls } from "./urls";

export const TEAM_SETTINGS_TABS = {
  General: "general",
  Members: "members",
  ApiKeys: "api-keys",
} as const;

export type TeamSettingsTab =
  (typeof TEAM_SETTINGS_TABS)[keyof typeof TEAM_SETTINGS_TABS];

type QueryValue = string | string[] | undefined;

const portalOrigin = "https://developer.worldcoin.org";

export const getPortalReturnTo = (value: QueryValue): string | null => {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const returnTo = new URL(value, portalOrigin);

    if (returnTo.origin !== portalOrigin) {
      return null;
    }

    return `${returnTo.pathname}${returnTo.search}${returnTo.hash}`;
  } catch {
    return null;
  }
};

export const resolvePortalReturnTo = (value: QueryValue): string =>
  getPortalReturnTo(value) ?? urls.dashboard();

export const resolveTeamSettingsTab = (
  value: QueryValue,
  canViewApiKeys: boolean,
): TeamSettingsTab => {
  if (value === TEAM_SETTINGS_TABS.Members) {
    return TEAM_SETTINGS_TABS.Members;
  }

  if (value === TEAM_SETTINGS_TABS.ApiKeys && canViewApiKeys) {
    return TEAM_SETTINGS_TABS.ApiKeys;
  }

  return TEAM_SETTINGS_TABS.General;
};

export const isTeamSettingsPath = (pathname: string): boolean =>
  /^\/teams\/[^/]+\/settings\/?$/.test(pathname);
