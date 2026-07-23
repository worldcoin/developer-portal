import "server-only";
import { getFlagClient } from "../openfeature/provider";

/**
 * Which of the given teams may see the sandbox tile. Context-heavy flags get
 * a thin typed wrapper here so call sites stay one line.
 */
export const getSandboxTeamIds = async (
  memberTeamIds: string[],
  email?: string | null,
): Promise<string[]> => {
  const client = getFlagClient();
  const allowed = await Promise.all(
    memberTeamIds.map((teamId) =>
      client.getBooleanValue("sandbox-distribution", false, {
        targetingKey: email ?? "anonymous",
        teamId,
      }),
    ),
  );
  return memberTeamIds.filter((_, i) => allowed[i]);
};
