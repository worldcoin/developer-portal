export const TEAMS_LIMIT_OPTIONS = [10, 25, 50, 100, 300] as const;

export const DEFAULT_TEAMS_LIMIT = 25;
export const DEFAULT_TEAMS_PAGE = 1;

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

export const parseTeamsPage = (page: string | string[] | undefined): number => {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number(rawPage);

  if (Number.isInteger(parsedPage) && parsedPage > 0) {
    return parsedPage;
  }

  return DEFAULT_TEAMS_PAGE;
};

export const getTeamsOffset = (page: number, limit: TeamsLimit) => {
  return (page - 1) * limit;
};

export const getTeamsTotalPages = (totalItems: number, limit: TeamsLimit) => {
  return Math.max(DEFAULT_TEAMS_PAGE, Math.ceil(totalItems / limit));
};

export const clampTeamsPage = (page: number, totalPages: number) => {
  return Math.min(Math.max(page, DEFAULT_TEAMS_PAGE), totalPages);
};

export const getTeamsVisibleRange = ({
  page,
  limit,
  totalItems,
}: {
  page: number;
  limit: TeamsLimit;
  totalItems: number;
}) => {
  if (totalItems === 0) {
    return {
      from: 0,
      to: 0,
    };
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return {
    from,
    to,
  };
};
