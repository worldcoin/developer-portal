import "server-only";

import {
  CleanupStatus,
  assertValidRpManagerKeyCleanupInput,
  determineCleanupPlan,
  loadCleanupCandidates,
  recordCleanupOutcome,
  type RpManagerKeyCleanupInput,
  type RpManagerKeyCleanupItemResult,
  type RpManagerKeyCleanupReport,
} from "./rp-manager-key-cleanup/actions";
import { executeCleanupPlan } from "./rp-manager-key-cleanup/helpers";

export type {
  RpManagerKeyCleanupInput,
  RpManagerKeyCleanupItemResult,
  RpManagerKeyCleanupRegistry,
  RpManagerKeyCleanupReport,
} from "./rp-manager-key-cleanup/actions";

export { CleanupStatus, PlanStep } from "./rp-manager-key-cleanup/actions";

// ANCHOR: Validate the input and clean up each eligible old RP manager key.
export async function cleanupRpManagerKeys(
  input: RpManagerKeyCleanupInput,
): Promise<RpManagerKeyCleanupReport> {
  assertValidRpManagerKeyCleanupInput(input);

  const candidates = await loadCleanupCandidates(input);
  const results: RpManagerKeyCleanupItemResult[] = [];

  for (const candidate of candidates) {
    try {
      const cleanupPlan = await determineCleanupPlan(input, candidate);
      const result = await executeCleanupPlan(input, candidate, cleanupPlan);
      results.push(result);
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : "Unknown error";

      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.Failed,
        detail: failureReason,
      });

      results.push({
        rpId: candidate.rp_id,
        appId: candidate.app_id,
        oldManagerKeyArn: candidate.old_manager_kms_key_arn,
        status: CleanupStatus.Failed,
        detail: failureReason,
      });
    }
  }

  return {
    candidateCount: candidates.length,
    results,
  };
}
