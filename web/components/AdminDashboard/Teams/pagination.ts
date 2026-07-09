export const TEAMS_LIMIT_OPTIONS = [10, 25, 50, 100, 300] as const;

export const DEFAULT_TEAMS_LIMIT = 25;

export type TeamsLimit = (typeof TEAMS_LIMIT_OPTIONS)[number];

export const parseTeamsLimit = (
  limit: string | string[] | undefined,
): TeamsLimit => {
  const rawLimit = Array.isArray(limit) ? limit[0] : limit;
  const parsedLimit = Number(rawLimit);

  if (TEAMS_LIMIT_OPTIONS.includes(parsedLimit as TeamsLimit)) {
    return parsedLimit as TeamsLimit;
  }

  return DEFAULT_TEAMS_LIMIT;
};
