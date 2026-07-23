import {
  EvaluationContext,
  JsonValue,
  OpenFeature,
  Provider,
  ResolutionDetails,
} from "@openfeature/server-sdk";
import "server-only";
import { getSandboxTeams } from "../world-id-sandbox/teams";

const notFound = <T>(value: T): ResolutionDetails<T> => ({
  value,
  reason: "ERROR",
  errorCode: "FLAG_NOT_FOUND" as never,
});

/**
 * In-process OpenFeature provider. Flag-specific targeting lives in each
 * feature's module; this class only routes keys to those evaluators so a
 * future SSM / Flagd / vendor provider can replace it without touching call
 * sites.
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
        value: Boolean(teamId) && getSandboxTeams().includes(teamId),
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
