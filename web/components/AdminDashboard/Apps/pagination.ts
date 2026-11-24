export const APPS_LIMIT_OPTIONS = [10, 25, 50, 100, 300] as const;
export const DEFAULT_APPS_LIMIT = 25;
export const DEFAULT_APPS_PAGE = 1;

export type AppsLimit = (typeof APPS_LIMIT_OPTIONS)[number];

export const parseAppsLimit = (
  limit: string | string[] | undefined,
): AppsLimit => {
  const rawLimit = Array.isArray(limit) ? limit[0] : limit;
  const parsedLimit = Number(rawLimit);

  return APPS_LIMIT_OPTIONS.includes(parsedLimit as AppsLimit)
    ? (parsedLimit as AppsLimit)
    : DEFAULT_APPS_LIMIT;
};

export const parseAppsPage = (page: string | string[] | undefined) => {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number(rawPage);

  return Number.isInteger(parsedPage) && parsedPage > 0
    ? parsedPage
    : DEFAULT_APPS_PAGE;
};

export const getAppsOffset = (page: number, limit: AppsLimit) =>
  (page - 1) * limit;

export const getAppsTotalPages = (totalItems: number, limit: AppsLimit) =>
  Math.max(DEFAULT_APPS_PAGE, Math.ceil(totalItems / limit));

export const clampAppsPage = (page: number, totalPages: number) =>
  Math.min(Math.max(page, DEFAULT_APPS_PAGE), totalPages);
