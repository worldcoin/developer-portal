const ClaimLegacyVerificationAssetSettlements = jest.fn();
const CompleteLegacyVerificationAssetSettlement = jest.fn();
const deletePreparedReviewerAssets = jest.fn();
const expireVerifiedReviewerAssets = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({})),
}));
jest.mock("@/api/hasura/verify-app/graphql/assetSettlement.generated", () => ({
  getSdk: () => ({
    ClaimLegacyVerificationAssetSettlements,
    CompleteLegacyVerificationAssetSettlement,
  }),
}));
jest.mock("@/api/helpers/reviewer-decision-assets", () => ({
  deletePreparedReviewerAssets: (...args: unknown[]) =>
    deletePreparedReviewerAssets(...args),
  expireVerifiedReviewerAssets: (...args: unknown[]) =>
    expireVerifiedReviewerAssets(...args),
}));

import { settleLegacyVerificationAssets } from "@/api/helpers/legacy-verification-asset-settlement";

const settlement = (outcome: "committed" | "aborted") => ({
  operation_id: "11111111-1111-4111-8111-111111111111",
  app_id: "app_123",
  app_metadata_id: "meta_123",
  prepared_asset_keys: ["verified/app_123/prepared.png"],
  prior_asset_keys: ["verified/app_123/prior.png"],
  outcome,
  delivery_status: "processing",
  attempt_count: 1,
  locked_by: "worker-1",
});

describe("legacy verification asset settlement worker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deletePreparedReviewerAssets.mockResolvedValue(undefined);
    expireVerifiedReviewerAssets.mockResolvedValue([]);
    CompleteLegacyVerificationAssetSettlement.mockResolvedValue({
      complete_legacy_app_verification_asset_settlement: [
        { delivery_status: "delivered" },
      ],
    });
  });

  it("expires only prior keys for an exact committed operation", async () => {
    ClaimLegacyVerificationAssetSettlements.mockResolvedValue({
      reviewer_claim_legacy_app_verification_asset_settlements: [
        settlement("committed"),
      ],
    });

    await expect(
      settleLegacyVerificationAssets({ workerId: "worker-1", limit: 10 }),
    ).resolves.toEqual({
      claimed: 1,
      delivered: 1,
      failed: 0,
      finalizationPending: 0,
    });
    expect(expireVerifiedReviewerAssets).toHaveBeenCalledWith({
      keys: ["verified/app_123/prior.png"],
    });
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith({
      operation_id: "11111111-1111-4111-8111-111111111111",
      worker_id: "worker-1",
      expected_outcome: "committed",
      delivery_succeeded: true,
      error: null,
    });
  });

  it("deletes only prepared keys for an aborted operation", async () => {
    ClaimLegacyVerificationAssetSettlements.mockResolvedValue({
      reviewer_claim_legacy_app_verification_asset_settlements: [
        settlement("aborted"),
      ],
    });

    await settleLegacyVerificationAssets({ workerId: "worker-1", limit: 10 });

    expect(deletePreparedReviewerAssets).toHaveBeenCalledWith({
      keys: ["verified/app_123/prepared.png"],
    });
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("records S3 failures as retryable instead of completing delivery", async () => {
    ClaimLegacyVerificationAssetSettlements.mockResolvedValue({
      reviewer_claim_legacy_app_verification_asset_settlements: [
        settlement("committed"),
      ],
    });
    expireVerifiedReviewerAssets.mockResolvedValue([
      "verified/app_123/prior.png",
    ]);
    CompleteLegacyVerificationAssetSettlement.mockResolvedValue({
      complete_legacy_app_verification_asset_settlement: [
        { delivery_status: "failed" },
      ],
    });

    await expect(
      settleLegacyVerificationAssets({ workerId: "worker-1", limit: 10 }),
    ).resolves.toEqual({
      claimed: 1,
      delivered: 0,
      failed: 1,
      finalizationPending: 0,
    });
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_succeeded: false,
        error: "Legacy verification prior asset expiry failed.",
      }),
    );
  });

  it("rejects a claimed row whose key escapes its exact app prefix", async () => {
    ClaimLegacyVerificationAssetSettlements.mockResolvedValue({
      reviewer_claim_legacy_app_verification_asset_settlements: [
        {
          ...settlement("aborted"),
          prepared_asset_keys: ["verified/another_app/prepared.png"],
        },
      ],
    });
    CompleteLegacyVerificationAssetSettlement.mockResolvedValue({
      complete_legacy_app_verification_asset_settlement: [
        { delivery_status: "failed" },
      ],
    });

    await settleLegacyVerificationAssets({ workerId: "worker-1", limit: 10 });

    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_succeeded: false,
        error: "Legacy verification asset settlement keys are invalid.",
      }),
    );
  });
});
