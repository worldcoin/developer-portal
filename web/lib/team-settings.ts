import { urls } from "./urls";

export const TEAM_SETTINGS_TABS = {
  General: "general",
  Members: "members",
  ApiKeys: "api-keys",
} as const;

export type TeamSettingsTab =
  (typeof TEAM_SETTINGS_TABS)[keyof typeof TEAM_SETTINGS_TABS];

type QueryValue = string | string[] | undefined;

export type PortalAppContext = {
  teamId: string;
  appId: string;
};

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

/**
 * Recovers the app that launched a team-scoped page from its validated
 * `return_to` URL. Keeping this context in the URL means the app navigation
 * survives client transitions, reloads, and copied team-settings links without
 * trusting hidden client state.
 */
export const getPortalAppContext = (
  value: QueryValue,
  expectedTeamId?: string,
): PortalAppContext | null => {
  const returnTo = getPortalReturnTo(value);
  if (!returnTo) return null;

  const pathname = new URL(returnTo, portalOrigin).pathname;
  const match = /^\/teams\/([^/]+)\/apps\/([^/]+)(?:\/|$)/.exec(pathname);
  if (!match) return null;

  try {
    const teamId = decodeURIComponent(match[1]);
    const appId = decodeURIComponent(match[2]);
    const safeId = /^[A-Za-z0-9_-]+$/;

    if (
      !safeId.test(teamId) ||
      !safeId.test(appId) ||
      (expectedTeamId !== undefined && teamId !== expectedTeamId)
    ) {
      return null;
    }

    return { teamId, appId };
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
