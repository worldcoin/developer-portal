export const parseTeamsSearchQuery = (
  query: string | string[] | undefined,
) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;

  return rawQuery?.trim() ?? "";
};
