import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import {
  isUuid,
  readDecisionWriteBody,
} from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  invalidReviewIdResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
  workflowSuccessResponse,
} from "@/api/admin/reviewer/response";
import {
  collectVerifiedReviewerAssetKeys,
  deletePreparedReviewerAssets,
  expireVerifiedReviewerAssets,
  prepareReviewerDecisionAssets,
} from "@/api/helpers/reviewer-decision-assets";
import {
  createReviewDecisionFingerprint,
  isMatchingTerminalReviewDecision,
  isSamePreparedAssetPlan,
  readCommittedPreparedAssetKeys,
  validateReviewDecisionContext,
} from "@/api/helpers/reviewer-decision";
import {
  decideReviewSubmission,
  enqueueReviewAssetCleanup,
  fetchReviewDecisionContext,
  fetchReviewDecisionOutcome,
  mapReviewerWorkflowSubmission,
  settleReviewAssetCleanup,
} from "@/api/helpers/reviewer-workflow";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

const cleanupPreparedAssets = async ({
  keys,
  reviewId,
}: {
  keys: string[];
  reviewId: string;
}) => {
  if (keys.length === 0) return;
  try {
    await deletePreparedReviewerAssets({ keys });
  } catch (error) {
    logger.error("Failed to compensate reviewer decision assets", {
      reviewId,
      ...sanitizedWorkflowError(error),
    });
  }
};

const expirePriorAssets = async ({
  keys,
  reviewId,
}: {
  keys: string[];
  reviewId: string;
}) => {
  if (keys.length === 0) return;
  try {
    const failedKeys = await expireVerifiedReviewerAssets({ keys });
    if (failedKeys.length > 0) {
      logger.warn("Some superseded reviewer assets could not be expired", {
        reviewId,
        failedAssetCount: failedKeys.length,
      });
    }
  } catch (error) {
    logger.error("Failed to expire superseded reviewer assets", {
      reviewId,
      ...sanitizedWorkflowError(error),
    });
  }
};

const settlePreparedAssetPlan = async ({
  reviewId,
  fingerprint,
  operationId,
  state,
  actorSubject,
  actorEmail,
}: {
  reviewId: string;
  fingerprint: string;
  operationId: string | null;
  state: "committed" | "aborted";
  actorSubject: string;
  actorEmail: string;
}) => {
  if (!operationId) return;
  try {
    const notification = await settleReviewAssetCleanup({
      submission_id: reviewId,
      decision_fingerprint: fingerprint,
      operation_id: operationId,
      settlement_state: state,
      actor_subject: actorSubject,
      actor_email: actorEmail,
    });
    if (!notification) {
      logger.error("Unable to settle reviewer asset operation", {
        reviewId,
        actorSubject,
        settlementState: state,
      });
    }
  } catch (error) {
    logger.error("Failed to settle reviewer asset operation", {
      reviewId,
      actorSubject,
      settlementState: state,
      ...sanitizedWorkflowError(error),
    });
  }
};

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateReviewerApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  if (!isUuid(id)) return invalidReviewIdResponse();

  const body = await readDecisionWriteBody(req);
  if (!body) return invalidBodyResponse();

  const fingerprint = createReviewDecisionFingerprint({
    actorSubject: auth.user.subject,
    submissionId: id,
    body,
  });

  try {
    const context = await fetchReviewDecisionContext(id);
    if (!context) return workflowConflictResponse();

    if (
      context.status === "approved" ||
      context.status === "changes_requested"
    ) {
      return isMatchingTerminalReviewDecision(
        context,
        fingerprint,
        auth.user.subject,
        body.decision,
      )
        ? workflowSuccessResponse(mapReviewerWorkflowSubmission(context))
        : workflowConflictResponse();
    }

    const validated = validateReviewDecisionContext({
      actorSubject: auth.user.subject,
      body,
      context,
    });
    if (!validated) return workflowConflictResponse();

    const priorVerified = validated.priorVerified;
    const oldAssetKeys =
      body.decision === "approved" && priorVerified
        ? collectVerifiedReviewerAssetKeys({
            appId: context.app_id,
            metadata: priorVerified,
          })
        : [];

    let prepared = {
      metadataAssets: {},
      localizationAssets: {},
      preparedKeys: [] as string[],
    };
    let operationId: string | null = null;
    if (body.decision === "approved") {
      operationId = randomUUID().replaceAll("-", "");
      try {
        prepared = await prepareReviewerDecisionAssets({
          appId: context.app_id,
          appMetadataId: body.appMetadataId,
          operationId,
          metadataSnapshot: context.metadata_snapshot,
          localizationsSnapshot: context.localizations_snapshot,
          registerPreparedPlan: async (keys) => {
            const notification = await enqueueReviewAssetCleanup({
              submission_id: id,
              decision_fingerprint: fingerprint,
              operation_id: operationId!,
              expected_review_version: body.expectedReviewVersion,
              app_metadata_id: body.appMetadataId,
              asset_keys: keys,
              actor_subject: auth.user.subject,
              actor_email: auth.user.email,
            });
            if (!notification) {
              throw new Error("Unable to register reviewer asset settlement.");
            }
          },
        });
      } catch (error) {
        await settlePreparedAssetPlan({
          reviewId: id,
          fingerprint,
          operationId,
          state: "aborted",
          actorSubject: auth.user.subject,
          actorEmail: auth.user.email,
        });
        throw error;
      }
    }

    let finalized;
    try {
      finalized = await decideReviewSubmission({
        submission_id: id,
        claim_token: body.claimToken,
        expected_review_version: body.expectedReviewVersion,
        app_metadata_id: body.appMetadataId,
        expected_metadata_updated_at: body.expectedMetadataUpdatedAt,
        decision: body.decision,
        developer_message: validated.developerMessage,
        override_reason: body.overrideReason?.trim() || null,
        decision_fingerprint: fingerprint,
        expected_prior_verified_id: priorVerified?.id ?? null,
        expected_prior_verified_updated_at: priorVerified?.updated_at ?? null,
        expected_prior_localizations_snapshot:
          priorVerified?.localisations ?? [],
        metadata_assets: prepared.metadataAssets,
        localization_assets: prepared.localizationAssets,
        prepared_asset_keys: prepared.preparedKeys,
        old_asset_keys: oldAssetKeys,
        failed_checks: validated.failedChecks,
        actor_subject: auth.user.subject,
        actor_email: auth.user.email,
      });
    } catch (mutationError) {
      let outcome;
      try {
        outcome = await fetchReviewDecisionOutcome(id);
      } catch (readError) {
        logger.error("Reviewer decision outcome is ambiguous", {
          reviewId: id,
          actorSubject: auth.user.subject,
          mutationError: sanitizedWorkflowError(mutationError).errorName,
          outcomeError: sanitizedWorkflowError(readError).errorName,
        });
        return reviewerApiJson(
          { error: "Unable to complete review decision" },
          { status: 500 },
        );
      }

      if (
        outcome &&
        isMatchingTerminalReviewDecision(
          outcome,
          fingerprint,
          auth.user.subject,
          body.decision,
        )
      ) {
        const committedKeys = readCommittedPreparedAssetKeys(
          outcome.decision_result,
        );
        if (body.decision === "approved" && committedKeys) {
          const planCommitted = isSamePreparedAssetPlan(
            committedKeys,
            prepared.preparedKeys,
          );
          await settlePreparedAssetPlan({
            reviewId: id,
            fingerprint,
            operationId,
            state: planCommitted ? "committed" : "aborted",
            actorSubject: auth.user.subject,
            actorEmail: auth.user.email,
          });
          if (!planCommitted) {
            await cleanupPreparedAssets({
              keys: prepared.preparedKeys,
              reviewId: id,
            });
          }
        }
        await expirePriorAssets({ keys: oldAssetKeys, reviewId: id });
        return workflowSuccessResponse(mapReviewerWorkflowSubmission(outcome));
      }

      if (
        outcome &&
        (outcome.status === "approved" ||
          outcome.status === "changes_requested")
      ) {
        await settlePreparedAssetPlan({
          reviewId: id,
          fingerprint,
          operationId,
          state: "aborted",
          actorSubject: auth.user.subject,
          actorEmail: auth.user.email,
        });
        await cleanupPreparedAssets({
          keys: prepared.preparedKeys,
          reviewId: id,
        });
        return workflowConflictResponse();
      }
      logger.error("Reviewer decision outcome remains ambiguous", {
        reviewId: id,
        actorSubject: auth.user.subject,
        ...sanitizedWorkflowError(mutationError),
      });
      return reviewerApiJson(
        { error: "Unable to complete review decision" },
        { status: 500 },
      );
    }

    if (!finalized) {
      await settlePreparedAssetPlan({
        reviewId: id,
        fingerprint,
        operationId,
        state: "aborted",
        actorSubject: auth.user.subject,
        actorEmail: auth.user.email,
      });
      await cleanupPreparedAssets({
        keys: prepared.preparedKeys,
        reviewId: id,
      });
      return workflowConflictResponse();
    }

    const committedKeys = readCommittedPreparedAssetKeys(
      finalized.decisionResult,
    );
    if (body.decision === "approved" && committedKeys) {
      const planCommitted = isSamePreparedAssetPlan(
        committedKeys,
        prepared.preparedKeys,
      );
      await settlePreparedAssetPlan({
        reviewId: id,
        fingerprint,
        operationId,
        state: planCommitted ? "committed" : "aborted",
        actorSubject: auth.user.subject,
        actorEmail: auth.user.email,
      });
      if (!planCommitted) {
        await cleanupPreparedAssets({
          keys: prepared.preparedKeys,
          reviewId: id,
        });
      }
    }

    await expirePriorAssets({ keys: oldAssetKeys, reviewId: id });
    return workflowSuccessResponse(finalized.submission);
  } catch (error) {
    logger.error("Failed to decide review submission", {
      reviewId: id,
      actorSubject: auth.user.subject,
      ...sanitizedWorkflowError(error),
    });
    return reviewerApiJson(
      { error: "Unable to complete review decision" },
      { status: 500 },
    );
  }
}
