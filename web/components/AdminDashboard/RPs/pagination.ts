export const RPS_LIMIT_OPTIONS = [10, 25, 50, 100, 300] as const;
export const DEFAULT_RPS_LIMIT = 25;
export const DEFAULT_RPS_PAGE = 1;

export type RpsLimit = (typeof RPS_LIMIT_OPTIONS)[number];

export const parseRpsLimit = (
  limit: string | string[] | undefined,
): RpsLimit => {
  const rawLimit = Array.isArray(limit) ? limit[0] : limit;
  const parsedLimit = Number(rawLimit);

  return RPS_LIMIT_OPTIONS.includes(parsedLimit as RpsLimit)
    ? (parsedLimit as RpsLimit)
    : DEFAULT_RPS_LIMIT;
};

export const parseRpsPage = (page: string | string[] | undefined) => {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number(rawPage);

  return Number.isInteger(parsedPage) && parsedPage > 0
    ? parsedPage
    : DEFAULT_RPS_PAGE;
};

export const getRpsOffset = (page: number, limit: RpsLimit) =>
  (page - 1) * limit;

export const getRpsTotalPages = (totalItems: number, limit: RpsLimit) =>
  Math.max(DEFAULT_RPS_PAGE, Math.ceil(totalItems / limit));

export const clampRpsPage = (page: number, totalPages: number) =>
  Math.min(Math.max(page, DEFAULT_RPS_PAGE), totalPages);
