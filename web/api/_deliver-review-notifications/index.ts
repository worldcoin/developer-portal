import { protectInternalEndpoint } from "@/api/helpers/utils";
import { settleLegacyVerificationAssets } from "@/api/helpers/legacy-verification-asset-settlement";
import { repairReviewerAssetSnapshots } from "@/api/helpers/reviewer-asset-snapshot-repair";
import { deliverReviewNotification } from "@/api/helpers/reviewer-notification-delivery";
import {
  claimReviewNotifications,
  completeReviewNotification,
  fetchReviewNotificationContext,
} from "@/api/helpers/reviewer-notifications";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// A one-minute cron must absorb normal submission bursts without placing
// Slack alerts behind decision/publication work. SQL prioritizes Slack and
// this remains a hard upper bound on provider concurrency.
const BATCH_SIZE = 50;
const FINALIZATION_ATTEMPTS = 3;
const LEASE_DURATION_MS = 5 * 60_000;
const DELIVERY_HEADROOM_MS = 60_000;

type DeliveryCount =
  | "deadLetter"
  | "deferred"
  | "delivered"
  | "failed"
  | "finalizationPending";

const finalize = async (
  input: Parameters<typeof completeReviewNotification>[0],
) => {
  for (let attempt = 0; attempt < FINALIZATION_ATTEMPTS; attempt += 1) {
    try {
      const result = await completeReviewNotification(input);
      if (result) return result;
    } catch {
      // Retrying this idempotent completion is safe. In particular, a
      // provider-success outcome is never rewritten as a delivery failure.
    }
  }
  return null;
};

const processNotification = async ({
  notificationId,
  workerId,
}: {
  notificationId: string;
  workerId: string;
}): Promise<DeliveryCount> => {
  let delivery: {
    outcome: "delivered" | "deferred";
    providerMessageId: string | null;
  } | null = null;
  try {
    const context = await fetchReviewNotificationContext(notificationId);
    if (!context) throw new Error("Notification context is unavailable.");
    const lockedAt = Date.parse(context.notification.lockedAt ?? "");
    if (
      context.notification.id !== notificationId ||
      context.notification.status !== "processing" ||
      context.notification.lockedBy !== workerId ||
      !Number.isFinite(lockedAt) ||
      lockedAt <= Date.now() - (LEASE_DURATION_MS - DELIVERY_HEADROOM_MS)
    ) {
      logger.warn("Reviewer notification lease changed before delivery", {
        notificationId,
        workerId,
      });
      return "finalizationPending";
    }
    delivery = await deliverReviewNotification(context);
  } catch {
    const completion = await finalize({
      notificationId,
      workerId,
      outcome: "failed",
      providerMessageId: null,
      error: "Review notification delivery failed.",
    });
    if (!completion) {
      logger.error("Reviewer notification failure could not be finalized", {
        notificationId,
        workerId,
      });
      return "finalizationPending";
    }
    return completion.status === "dead_letter" ? "deadLetter" : "failed";
  }

  const completion = await finalize({
    notificationId,
    workerId,
    outcome: delivery.outcome,
    providerMessageId: delivery.providerMessageId,
    error:
      delivery.outcome === "deferred"
        ? "Prepared asset settlement remains ambiguous."
        : null,
  });
  if (!completion) {
    logger.error("Reviewer notification success could not be finalized", {
      notificationId,
      workerId,
      outcome: delivery.outcome,
    });
    return "finalizationPending";
  }
  if (completion.status === "dead_letter") return "deadLetter";
  return delivery.outcome === "deferred" ? "deferred" : "delivered";
};

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return (
      errorResponse ??
      NextResponse.json({ error: "Forbidden" }, { status: 403 })
    );
  }

  const workerId = `review-outbox-${randomUUID()}`;
  try {
    const claimed = await claimReviewNotifications({
      workerId,
      limit: BATCH_SIZE,
    });
    const outcomes = await Promise.all(
      claimed.map(({ id }) =>
        processNotification({ notificationId: id, workerId }),
      ),
    );
    const count = (outcome: DeliveryCount) =>
      outcomes.filter((candidate) => candidate === outcome).length;
    const assetSnapshots = await repairReviewerAssetSnapshots({ limit: 10 });
    const legacyVerificationAssets = await settleLegacyVerificationAssets({
      workerId,
      limit: 10,
    });
    return NextResponse.json({
      success: true,
      claimed: claimed.length,
      delivered: count("delivered"),
      deferred: count("deferred"),
      failed: count("failed") + count("deadLetter"),
      deadLetter: count("deadLetter"),
      finalizationPending: count("finalizationPending"),
      assetSnapshots,
      legacyVerificationAssets,
    });
  } catch {
    logger.error("Reviewer notification worker failed before delivery", {
      workerId,
    });
    return NextResponse.json(
      { success: false, error: "Unable to process review notifications" },
      { status: 500 },
    );
  }
}
