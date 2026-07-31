import { urls } from "./urls";

const portalOrigin = "https://portal.invalid";

const teamPath = (teamId: string) => urls.teams({ team_id: teamId });

export const getTeamSettingsHref = (props: {
  teamId: string;
  returnTo: string;
}) => {
  const settingsHref = urls.teamSettings({ team_id: props.teamId });
  const safeReturnTo = getTeamSettingsReturnTo({
    teamId: props.teamId,
    returnTo: props.returnTo,
  });

  return props.returnTo === settingsHref
    ? settingsHref
    : `${settingsHref}?${new URLSearchParams({ returnTo: safeReturnTo })}`;
};

/**
 * Returns a same-team, internal destination for leaving Team Settings. Query
 * parameters are retained, but malformed, external, cross-team, and Settings
 * URLs safely fall back to the team overview.
 */
export const getTeamSettingsReturnTo = (props: {
  teamId: string;
  returnTo: string | null | undefined;
}) => {
  const fallback = teamPath(props.teamId);
  const settingsPath = urls.teamSettings({ team_id: props.teamId });

  if (!props.returnTo?.startsWith("/") || props.returnTo.startsWith("//")) {
    return fallback;
  }

  try {
    const destination = new URL(props.returnTo, portalOrigin);
    const isSameOrigin = destination.origin === portalOrigin;
    const isWithinTeam =
      destination.pathname === fallback ||
      destination.pathname.startsWith(`${fallback}/`);

    if (
      !isSameOrigin ||
      !isWithinTeam ||
      destination.pathname === settingsPath ||
      destination.pathname.startsWith(`${settingsPath}/`)
    ) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
};
