import "server-only";

import { logger } from "@/lib/logger";
import {
  CleanupStatus,
  PlanStep,
  recordCleanupOutcome,
  scheduleOldKeyDeletion,
  touchSkippedCleanupCandidate,
  type ManagerKeyCleanupCandidate,
  type ManagerKeyCleanupPlan,
  type RpManagerKeyCleanupInput,
  type RpManagerKeyCleanupItemResult,
} from "./actions";

// ANCHOR: Execute the cleanup action selected after all safety checks.
export async function executeCleanupPlan(
  input: RpManagerKeyCleanupInput,
  candidate: ManagerKeyCleanupCandidate,
  plan: ManagerKeyCleanupPlan,
): Promise<RpManagerKeyCleanupItemResult> {
  const base = {
    rpId: candidate.rp_id,
    appId: candidate.app_id,
    oldManagerKeyArn: candidate.old_manager_kms_key_arn,
  };

  switch (plan.nextStep) {
    case PlanStep.Skip:
      await touchSkippedCleanupCandidate(input, candidate);
      logger.info("RP manager key cleanup skipped", {
        rp_id: candidate.rp_id,
        old_manager_kms_key_arn: candidate.old_manager_kms_key_arn,
        detail: plan.reason,
      });
      return {
        ...base,
        status: "skipped",
        detail: plan.reason,
      };

    case PlanStep.MarkAsBlocked:
      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.Blocked,
        detail: plan.reason,
      });
      return {
        ...base,
        status: CleanupStatus.Blocked,
        detail: plan.reason,
      };

    case PlanStep.MarkAsReadyForExternalCleanup:
      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.ReadyForExternalCleanup,
      });
      return {
        ...base,
        status: CleanupStatus.ReadyForExternalCleanup,
      };

    case PlanStep.MarkAsDeleted:
      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.Deleted,
      });
      return {
        ...base,
        status: CleanupStatus.Deleted,
      };

    case PlanStep.RecordExistingDeletionSchedule:
      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.DeletionScheduled,
        expectedDeletionAt: plan.deletionDate,
      });
      return {
        ...base,
        status: CleanupStatus.DeletionScheduled,
        expectedDeletionAt: plan.deletionDate,
      };

    case PlanStep.ScheduleDeletion: {
      const deletionDate = await scheduleOldKeyDeletion(input, candidate);
      await recordCleanupOutcome(input, candidate, {
        status: CleanupStatus.DeletionScheduled,
        deletionScheduledAt: new Date().toISOString(),
        expectedDeletionAt: deletionDate,
      });
      return {
        ...base,
        status: CleanupStatus.DeletionScheduled,
        expectedDeletionAt: deletionDate,
      };
    }
  }
}
