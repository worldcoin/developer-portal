export const USERS_LIMIT_OPTIONS = [10, 25, 50, 100, 300] as const;

export const DEFAULT_USERS_LIMIT = 25;
export const DEFAULT_USERS_PAGE = 1;

export type UsersLimit = (typeof USERS_LIMIT_OPTIONS)[number];

export const parseUsersLimit = (
  limit: string | string[] | undefined,
): UsersLimit => {
  const rawLimit = Array.isArray(limit) ? limit[0] : limit;
  const parsedLimit = Number(rawLimit);

  if (USERS_LIMIT_OPTIONS.includes(parsedLimit as UsersLimit)) {
    return parsedLimit as UsersLimit;
  }

  return DEFAULT_USERS_LIMIT;
};

export const parseUsersPage = (page: string | string[] | undefined): number => {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number(rawPage);

  if (Number.isInteger(parsedPage) && parsedPage > 0) {
    return parsedPage;
  }

  return DEFAULT_USERS_PAGE;
};

export const getUsersOffset = (page: number, limit: UsersLimit) => {
  return (page - 1) * limit;
};

export const getUsersTotalPages = (totalItems: number, limit: UsersLimit) => {
  return Math.max(DEFAULT_USERS_PAGE, Math.ceil(totalItems / limit));
};

export const clampUsersPage = (page: number, totalPages: number) => {
  return Math.min(Math.max(page, DEFAULT_USERS_PAGE), totalPages);
};

export const getUsersVisibleRange = ({
  page,
  limit,
  totalItems,
}: {
  page: number;
  limit: UsersLimit;
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
