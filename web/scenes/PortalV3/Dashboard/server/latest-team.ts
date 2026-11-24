import "server-only";

import { logger } from "@/lib/logger";

const latestTeamKey = (userId: string) =>
  `developer-portal:latest-team:v1:${userId}`;

/**
 * Returns an advisory navigation preference.
 *
 * Team membership remains authoritative and callers must validate the returned
 * ID against the user's current memberships before redirecting.
 */
export const getLatestTeamId = async (
  userId: string,
): Promise<string | undefined> => {
  const redis = global.RedisClient;
  if (!redis) return undefined;

  try {
    return (await redis.get(latestTeamKey(userId))) ?? undefined;
  } catch (error) {
    logger.warn("Failed to read the latest team from Redis", {
      userId,
      error,
    });
    return undefined;
  }
};

export const rememberLatestTeam = async (
  userId: string,
  teamId: string,
): Promise<void> => {
  const redis = global.RedisClient;
  if (!redis) return;

  try {
    await redis.set(latestTeamKey(userId), teamId);
  } catch (error) {
    logger.warn("Failed to remember the latest team in Redis", {
      userId,
      teamId,
      error,
    });
  }
};
