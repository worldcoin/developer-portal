import { headers } from "next/headers";
/**
 * Extracts specific ids from a path
 * @param path - The path to extract ids from
 * @param keys - The keys to extract from the path (e.g. ["Teams", "Apps", "Actions"])
 * @returns The extracted ids
 */
export const extractIdsFromPath = (
  path: string,
  keys: string[],
): Record<string, string | undefined> => {
  const parts = path.split("/").filter(Boolean);
  const result: Record<string, string | undefined> = {};

  for (const key of keys) {
    const index = parts.indexOf(key);
    result[key] =
      index !== -1 && index + 1 < parts.length ? parts[index + 1] : undefined;
  }

  return result;
};

/**
 * Gets the URL path from the headers set by middleware
 * @returns The path from the headers
 */
export const getPathFromHeaders = (): string | null => {
  const headersList = headers();
  const path = headersList.get("x-current-path");
  return path;
};
