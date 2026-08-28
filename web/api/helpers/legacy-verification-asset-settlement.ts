import "server-only";

import { getSdk } from "@/api/hasura/verify-app/graphql/assetSettlement.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  deletePreparedReviewerAssets,
  expireVerifiedReviewerAssets,
} from "@/api/helpers/reviewer-decision-assets";

const SAFE_ID = /^[A-Za-z0-9_-]+$/;
const SAFE_ASSET_KEY =
  /^verified\/[A-Za-z0-9_-]+\/(?:[A-Za-z0-9_-]+\/)?[A-Za-z0-9_-]+\.(?:png|jpe?g)$/i;
const FINALIZATION_ATTEMPTS = 3;

type Outcome = "committed" | "aborted";

const exactAppKeys = ({ appId, keys }: { appId: string; keys: string[] }) =>
  SAFE_ID.test(appId) &&
  keys.length <= 1_000 &&
  new Set(keys).size === keys.length &&
  keys.every((key) => SAFE_ASSET_KEY.test(key) && key.split("/")[1] === appId);

export const settleLegacyVerificationAssets = async ({
  workerId,
  limit,
}: {
  workerId: string;
  limit: number;
}) => {
  if (!workerId.trim() || workerId.length > 200) {
    throw new Error("Legacy verification asset worker id is invalid.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new Error("Legacy verification asset worker limit is invalid.");
  }

  const client = await getAPIServiceGraphqlClient();
  const sdk = getSdk(client);
  const claimed = await sdk.ClaimLegacyVerificationAssetSettlements({
    worker_id: workerId,
    limit,
  });
  let delivered = 0;
  let failed = 0;
  let finalizationPending = 0;

  for (const settlement of claimed.reviewer_claim_legacy_app_verification_asset_settlements) {
    const outcome = settlement.outcome as Outcome;
    let deliverySucceeded = false;
    let error: string | null = null;

    if (
      (outcome !== "committed" && outcome !== "aborted") ||
      settlement.delivery_status !== "processing" ||
      settlement.locked_by !== workerId ||
      !exactAppKeys({
        appId: settlement.app_id,
        keys: settlement.prepared_asset_keys,
      }) ||
      settlement.prepared_asset_keys.length === 0 ||
      !exactAppKeys({
        appId: settlement.app_id,
        keys: settlement.prior_asset_keys,
      })
    ) {
      error = "Legacy verification asset settlement keys are invalid.";
    } else if (outcome === "committed") {
      try {
        const failedKeys = await expireVerifiedReviewerAssets({
          keys: settlement.prior_asset_keys,
        });
        deliverySucceeded = failedKeys.length === 0;
        if (!deliverySucceeded) {
          error = "Legacy verification prior asset expiry failed.";
        }
      } catch {
        error = "Legacy verification prior asset expiry failed.";
      }
    } else {
      try {
        await deletePreparedReviewerAssets({
          keys: settlement.prepared_asset_keys,
        });
        deliverySucceeded = true;
      } catch {
        error = "Legacy verification asset cleanup failed.";
      }
    }

    let completion:
      | Awaited<
          ReturnType<typeof sdk.CompleteLegacyVerificationAssetSettlement>
        >["complete_legacy_app_verification_asset_settlement"][number]
      | null = null;
    for (let attempt = 0; attempt < FINALIZATION_ATTEMPTS; attempt += 1) {
      try {
        const result = await sdk.CompleteLegacyVerificationAssetSettlement({
          operation_id: settlement.operation_id,
          worker_id: workerId,
          expected_outcome: outcome,
          delivery_succeeded: deliverySucceeded,
          error,
        });
        completion =
          result.complete_legacy_app_verification_asset_settlement[0] ?? null;
        if (completion) break;
      } catch {
        // Exact completion is idempotent. An expired processing lease will be
        // reclaimed by a later worker if every response remains ambiguous.
      }
    }

    if (!completion) {
      finalizationPending += 1;
    } else if (completion.delivery_status === "delivered") {
      delivered += 1;
    } else {
      failed += 1;
    }
  }

  return {
    claimed:
      claimed.reviewer_claim_legacy_app_verification_asset_settlements.length,
    delivered,
    failed,
    finalizationPending,
  };
};
