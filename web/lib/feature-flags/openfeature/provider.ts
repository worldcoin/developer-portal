import {
  EvaluationContext,
  JsonValue,
  OpenFeature,
  Provider,
  ResolutionDetails,
} from "@openfeature/server-sdk";
import "server-only";
import { SANDBOX_TEAMS } from "./sandbox-teams";

const notFound = <T>(value: T): ResolutionDetails<T> => ({
  value,
  reason: "ERROR",
  errorCode: "FLAG_NOT_FOUND" as never,
});

/**
 * In-process OpenFeature provider backed by hardcoded lists today. As flags
 * migrate to the OpenFeature standard, their resolution moves here (env, SSM,
 * or a vendor backend) without touching evaluation call sites.
 */
class PortalFlagProvider implements Provider {
  readonly metadata = { name: "portal-in-process" } as const;

  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    if (flagKey === "sandbox-distribution") {
      const teamId = typeof context.teamId === "string" ? context.teamId : "";
      return {
        value: Boolean(teamId) && SANDBOX_TEAMS.includes(teamId),
        reason: "TARGETING_MATCH",
      };
    }
    return notFound(defaultValue);
  }

  async resolveStringEvaluation(
    _flagKey: string,
    defaultValue: string,
  ): Promise<ResolutionDetails<string>> {
    return notFound(defaultValue);
  }

  async resolveNumberEvaluation(
    _flagKey: string,
    defaultValue: number,
  ): Promise<ResolutionDetails<number>> {
    return notFound(defaultValue);
  }

  async resolveObjectEvaluation<T extends JsonValue>(
    _flagKey: string,
    defaultValue: T,
  ): Promise<ResolutionDetails<T>> {
    return notFound(defaultValue);
  }
}

// Module scope = registered once per server process, no bootstrap hook needed.
OpenFeature.setProvider(new PortalFlagProvider());

export const getFlagClient = () => OpenFeature.getClient();

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
