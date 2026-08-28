const request = jest.fn();
const snapshotReviewerSubmissionAssets = jest.fn();
const tryDeleteReviewerSubmissionAssetSnapshot = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request })),
}));
jest.mock("@/api/helpers/reviewer-submission-assets", () => ({
  snapshotReviewerSubmissionAssets: (...args: unknown[]) =>
    snapshotReviewerSubmissionAssets(...args),
  tryDeleteReviewerSubmissionAssetSnapshot: (...args: unknown[]) =>
    tryDeleteReviewerSubmissionAssetSnapshot(...args),
}));

import { repairReviewerAssetSnapshots } from "@/api/helpers/reviewer-asset-snapshot-repair";

const candidate = {
  id: "11111111-1111-4111-8111-111111111111",
  app_id: "app_123",
  app_metadata_id: "meta_123",
  review_version: 3,
  asset_snapshot_repair_attempt_count: 0,
  metadata_snapshot: { logo_img_url: "logo_img.png" },
  localizations_snapshot: [],
};
const manifest = {
  version: 1,
  prefix:
    "review-submissions/app_123/meta_123/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/",
  objects: {
    "unverified/app_123/logo_img.png":
      "review-submissions/app_123/meta_123/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/logo_img.png",
  },
};

describe("reviewer asset snapshot repair", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    snapshotReviewerSubmissionAssets.mockResolvedValue(manifest);
    tryDeleteReviewerSubmissionAssetSnapshot.mockResolvedValue(undefined);
  });

  it("snapshots and CAS-persists a legacy active submission", async () => {
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      })
      .mockResolvedValueOnce({
        reviewer_set_app_review_asset_snapshot: [{ id: candidate.id }],
      });

    await expect(repairReviewerAssetSnapshots({ limit: 10 })).resolves.toEqual({
      attempted: 1,
      repaired: 1,
      skipped: 0,
      failed: 0,
      deadLettered: 0,
    });
    expect(snapshotReviewerSubmissionAssets).toHaveBeenCalledWith({
      appId: candidate.app_id,
      appMetadataId: candidate.app_metadata_id,
      metadataSnapshot: candidate.metadata_snapshot,
      localizationsSnapshot: candidate.localizations_snapshot,
    });
    expect(request.mock.calls[1][1]).toEqual({
      submission_id: candidate.id,
      expected_review_version: candidate.review_version,
      expected_attempt_count: 0,
      operation_id: expect.stringMatching(/^[0-9a-f-]{36}$/i),
    });
    expect(request.mock.calls[2][1]).toEqual({
      submission_id: candidate.id,
      expected_review_version: candidate.review_version,
      asset_snapshot: manifest,
    });
    expect(tryDeleteReviewerSubmissionAssetSnapshot).not.toHaveBeenCalled();
  });

  it("deletes its losing manifest when another worker wins the CAS", async () => {
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      })
      .mockResolvedValueOnce({ reviewer_set_app_review_asset_snapshot: [] });

    await expect(repairReviewerAssetSnapshots({ limit: 10 })).resolves.toEqual({
      attempted: 1,
      repaired: 0,
      skipped: 1,
      failed: 0,
      deadLettered: 0,
    });
    expect(tryDeleteReviewerSubmissionAssetSnapshot).toHaveBeenCalledWith({
      appId: candidate.app_id,
      appMetadataId: candidate.app_metadata_id,
      assetSnapshot: manifest,
    });
  });

  it("keeps exact snapshot objects when persistence commits but its response is lost", async () => {
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      })
      .mockRejectedValueOnce(new Error("response lost after commit"))
      .mockResolvedValueOnce({
        reconcile_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      });

    await expect(repairReviewerAssetSnapshots({ limit: 10 })).resolves.toEqual({
      attempted: 1,
      repaired: 1,
      skipped: 0,
      failed: 0,
      deadLettered: 0,
    });
    expect(request.mock.calls[3][1]).toEqual({
      submission_id: candidate.id,
      asset_snapshot: manifest,
    });
    expect(tryDeleteReviewerSubmissionAssetSnapshot).not.toHaveBeenCalled();
  });

  it("compensates a manifest when persistence fails", async () => {
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      })
      .mockRejectedValueOnce(new Error("Hasura unavailable"))
      .mockResolvedValueOnce({
        reconcile_app_review_asset_snapshot_repair: [],
      })
      .mockResolvedValueOnce({
        reviewer_fail_app_review_asset_snapshot_repair: [
          {
            id: candidate.id,
            asset_snapshot_repair_attempt_count: 1,
            asset_snapshot_repair_dead_lettered_at: null,
          },
        ],
      });

    await expect(repairReviewerAssetSnapshots({ limit: 10 })).resolves.toEqual({
      attempted: 1,
      repaired: 0,
      skipped: 0,
      failed: 1,
      deadLettered: 0,
    });
    expect(tryDeleteReviewerSubmissionAssetSnapshot).toHaveBeenCalledWith({
      appId: candidate.app_id,
      appMetadataId: candidate.app_metadata_id,
      assetSnapshot: manifest,
    });
    expect(request.mock.calls[4][1]).toEqual({
      submission_id: candidate.id,
      expected_review_version: candidate.review_version,
      expected_attempt_count: 0,
      error: "Reviewer submission asset snapshot failed.",
    });
  });

  it("backs off an irreparable oldest row so a later submission enters the next batch", async () => {
    const laterCandidate = {
      ...candidate,
      id: "22222222-2222-4222-8222-222222222222",
      app_id: "app_456",
      app_metadata_id: "meta_456",
    };
    snapshotReviewerSubmissionAssets
      .mockRejectedValueOnce(new Error("source object missing"))
      .mockResolvedValueOnce(manifest);
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [{ id: candidate.id }],
      })
      .mockResolvedValueOnce({
        reviewer_fail_app_review_asset_snapshot_repair: [
          {
            id: candidate.id,
            asset_snapshot_repair_attempt_count: 1,
            asset_snapshot_repair_dead_lettered_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ app_review_submission: [laterCandidate] })
      .mockResolvedValueOnce({
        reviewer_begin_app_review_asset_snapshot_repair: [
          { id: laterCandidate.id },
        ],
      })
      .mockResolvedValueOnce({
        reviewer_set_app_review_asset_snapshot: [{ id: laterCandidate.id }],
      });

    await expect(repairReviewerAssetSnapshots({ limit: 1 })).resolves.toEqual({
      attempted: 1,
      repaired: 0,
      skipped: 0,
      failed: 1,
      deadLettered: 0,
    });
    await expect(repairReviewerAssetSnapshots({ limit: 1 })).resolves.toEqual({
      attempted: 1,
      repaired: 1,
      skipped: 0,
      failed: 0,
      deadLettered: 0,
    });

    const candidateQuery = String(request.mock.calls[0][0]);
    expect(candidateQuery).toContain("asset_snapshot_repair_next_at");
    expect(candidateQuery).toContain("asset_snapshot_repair_dead_lettered_at");
    expect(snapshotReviewerSubmissionAssets).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        appId: laterCandidate.app_id,
        appMetadataId: laterCandidate.app_metadata_id,
      }),
    );
  });

  it("does no storage work unless the immutable attempt audit is durable", async () => {
    request
      .mockResolvedValueOnce({ app_review_submission: [candidate] })
      .mockRejectedValueOnce(new Error("response lost"))
      .mockRejectedValueOnce(new Error("reconciliation unavailable"));

    await expect(repairReviewerAssetSnapshots({ limit: 10 })).resolves.toEqual({
      attempted: 0,
      repaired: 0,
      skipped: 1,
      failed: 0,
      deadLettered: 0,
    });
    const operationIds = request.mock.calls
      .slice(1)
      .map(([, variables]) => variables.operation_id);
    expect(operationIds[0]).toBe(operationIds[1]);
    expect(snapshotReviewerSubmissionAssets).not.toHaveBeenCalled();
  });
});
