import { NextRequest, NextResponse } from "next/server";

// #region Mocks

jest.mock("server-only", () => ({}));

const protectInternalEndpointMock = jest.fn();
jest.mock("@/api/helpers/utils", () => ({
  protectInternalEndpoint: (...args: unknown[]) =>
    protectInternalEndpointMock(...args),
}));

const graphqlRequestMock = jest.fn();
const getAPIServiceGraphqlClientMock = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClientMock(...args),
}));

const getKMSClientMock = jest.fn();
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: (...args: unknown[]) => getKMSClientMock(...args),
}));

const getRpRegistryConfigMock = jest.fn();
const getStagingRpRegistryConfigMock = jest.fn();
jest.mock("@/api/helpers/rp-utils", () => ({
  getRpRegistryConfig: (...args: unknown[]) => getRpRegistryConfigMock(...args),
  getStagingRpRegistryConfig: (...args: unknown[]) =>
    getStagingRpRegistryConfigMock(...args),
}));

const migrateRpManagersToSharedKeyMock = jest.fn();
jest.mock("../../scripts/migrate-rp-manager-to-shared-key", () => ({
  migrateRpManagersToSharedKey: (...args: unknown[]) =>
    migrateRpManagersToSharedKeyMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "@/api/_migrate-rp-manager-keys";
import { RP_MIGRATION_LOCK_TTL_MS } from "@/api/helpers/rp-manager-key-migration";

const { logger: mockLogger } = jest.requireMock("@/lib/logger") as {
  logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock };
};

// #endregion

// #region Test data

const RP_ID = "rp_1234567890abcdef";
const APP_ID = "app_1234567890abcdef1234567890abcdef";
const OLD_KEY = "arn:aws:kms:eu-west-1:111111111111:key/old";
const SHARED_KEY = "arn:aws:kms:eu-west-1:111111111111:key/shared";
const GLOBAL_LOCK_KEY = "rp-manager-key-migration:run";
const RP_LOCK_KEY = `rp-manager-key-migration:rp:${RP_ID}`;
const STAGING_CONFIG = {
  kmsRegion: "eu-west-1",
  contractAddress: "0x2222222222222222222222222222222222222222",
};

const candidate = {
  rp_id: RP_ID,
  app_id: APP_ID,
  manager_kms_key_id: OLD_KEY,
};

const successResult = {
  rpId: RP_ID,
  appId: APP_ID,
  oldManagerKeyId: OLD_KEY,
  operationHashes: { primary: "0xoperation" },
  skippedRegistries: [],
  eligibleForCleanup: true,
  status: "migrated" as const,
};

const request = () =>
  new NextRequest("http://localhost/api/_migrate-rp-manager-keys", {
    method: "POST",
  });

function arrangeCandidates(
  values: Array<typeof candidate> | null = [candidate],
): void {
  graphqlRequestMock.mockResolvedValueOnce({
    rp_registration: values ?? [],
  });
}

function arrangeCandidate(value: typeof candidate | null = candidate): void {
  arrangeCandidates(value ? [value] : null);
}

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = "true";
  process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID = SHARED_KEY;
  process.env.NEXT_PUBLIC_APP_ENV = "staging";

  protectInternalEndpointMock.mockReturnValue({ isAuthenticated: true });
  getAPIServiceGraphqlClientMock.mockResolvedValue({
    request: graphqlRequestMock,
  });
  getRpRegistryConfigMock.mockReturnValue({
    kmsRegion: "eu-west-1",
    contractAddress: "0x1111111111111111111111111111111111111111",
  });
  getStagingRpRegistryConfigMock.mockReturnValue(null);
  getKMSClientMock.mockResolvedValue({});
  migrateRpManagersToSharedKeyMock.mockResolvedValue({
    candidateCount: 1,
    results: [successResult],
  });
});

// #endregion

// #region Guards

describe("/_migrate-rp-manager-keys [guards]", () => {
  it("returns the internal authentication error", async () => {
    protectInternalEndpointMock.mockReturnValue({
      isAuthenticated: false,
      errorResponse: new NextResponse(null, { status: 403 }),
    });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(getAPIServiceGraphqlClientMock).not.toHaveBeenCalled();
  });

  it("returns 204 when disabled", async () => {
    process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = "false";

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(getAPIServiceGraphqlClientMock).not.toHaveBeenCalled();
  });

  it("returns 204 when another invocation owns the global lock", async () => {
    await global.RedisClient?.set(GLOBAL_LOCK_KEY, "another-owner");

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(getAPIServiceGraphqlClientMock).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration skipped, global lock held",
    );
  });

  it("fails closed when Redis is unavailable", async () => {
    const redis = global.RedisClient;
    global.RedisClient = undefined;

    const response = await POST(request());

    expect(response.status).toBe(503);
    global.RedisClient = redis;
  });

  it("fails closed when the staging registry config is missing in production", async () => {
    process.env.NEXT_PUBLIC_APP_ENV = "production";

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(getStagingRpRegistryConfigMock).toHaveBeenCalledTimes(1);
    expect(getAPIServiceGraphqlClientMock).not.toHaveBeenCalled();
    expect(migrateRpManagersToSharedKeyMock).not.toHaveBeenCalled();
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });

  it("returns 204 when no candidate is outside the cooldown", async () => {
    arrangeCandidate(null);

    const response = await POST(request());

    expect(response.status).toBe(204);
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });
});

// #endregion

// #region Migration attempt

describe("/_migrate-rp-manager-keys [attempt]", () => {
  it("migrates locked candidates with deployment-local configuration", async () => {
    arrangeCandidate();

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(migrateRpManagersToSharedKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rpIds: [RP_ID],
        sharedManagerKeyId: SHARED_KEY,
        pollIntervalMs: 2_000,
        confirmationTimeoutMs: 15_000,
        concurrency: 15,
        attemptId: expect.any(String),
      }),
    );
    const attemptId = migrateRpManagersToSharedKeyMock.mock.calls[0][0]
      .attemptId as string;
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration batch started",
      expect.objectContaining({
        attempt_id: attemptId,
        rp_ids: [RP_ID],
        candidates: [
          {
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
          },
        ],
      }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration batch finished",
      expect.objectContaining({
        attempt_id: attemptId,
        batch_outcome: "all_succeeded",
        rp_ids: [RP_ID],
        succeeded_rp_ids: [RP_ID],
        failed_rp_ids: [],
        results: [
          expect.objectContaining({
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "migrated",
            operation_hashes: { primary: "0xoperation" },
          }),
        ],
      }),
    );
    expect(graphqlRequestMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          rp_id: RP_ID,
          outcome: "migrated",
          operation_hashes: { primary: "0xoperation" },
        },
      ],
    });
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });

  it("keeps failed candidates out of the query while their full lock TTL is active", async () => {
    arrangeCandidate();

    await POST(request());

    const variables = graphqlRequestMock.mock.calls[0][1] as {
      before: string;
      limit: number;
    };
    expect(variables.limit).toBe(20);
    const cooldownMs = Date.now() - Date.parse(variables.before);
    expect(cooldownMs).toBeGreaterThanOrEqual(RP_MIGRATION_LOCK_TTL_MS);
  });

  it("passes the staging mirror to the migration in production", async () => {
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    getStagingRpRegistryConfigMock.mockReturnValue(STAGING_CONFIG);
    arrangeCandidate();

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(migrateRpManagersToSharedKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stagingMirrorRegistry: {
          name: "staging",
          config: STAGING_CONFIG,
        },
      }),
    );
  });

  it("touches a failed candidate so it cools down before the next attempt", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 1,
      results: [
        {
          ...successResult,
          status: "failed",
          eligibleForCleanup: false,
          failure: { stage: "read_registry", detail: "RPC unavailable" },
        },
      ],
    });
    graphqlRequestMock.mockResolvedValueOnce({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(graphqlRequestMock.mock.calls[1][1]).toEqual({
      rp_id: RP_ID,
      updated_at: expect.any(String),
    });
  });

  it("does not delete a lock whose owner changed during the run", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockImplementation(async () => {
      await global.RedisClient?.set(GLOBAL_LOCK_KEY, "replacement-owner");
      return { candidateCount: 1, results: [successResult] };
    });

    await POST(request());

    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBe(
      "replacement-owner",
    );
  });

  it("returns 204 when the per-RP migration lock is already held", async () => {
    await global.RedisClient?.set(RP_LOCK_KEY, "other-owner");
    arrangeCandidate();

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(migrateRpManagersToSharedKeyMock).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "No unlocked RP manager migration candidate available",
      expect.objectContaining({
        candidate_count: 1,
        locked_candidates_skipped: 1,
      }),
    );
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBe(
      "other-owner",
    );
  });

  it("skips a busy per-RP lock and migrates the next unlocked candidate", async () => {
    const secondRpId = "rp_abcdef1234567890";
    const secondAppId = "app_abcdef1234567890abcdef1234567890";
    const secondLockKey = `rp-manager-key-migration:rp:${secondRpId}`;
    const secondCandidate = {
      rp_id: secondRpId,
      app_id: secondAppId,
      manager_kms_key_id: OLD_KEY,
    };

    await global.RedisClient?.set(RP_LOCK_KEY, "other-owner");
    arrangeCandidates([candidate, secondCandidate]);
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 1,
      results: [
        {
          ...successResult,
          rpId: secondRpId,
          appId: secondAppId,
        },
      ],
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(migrateRpManagersToSharedKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({ rpIds: [secondRpId], concurrency: 15 }),
    );
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          rp_id: secondRpId,
          outcome: "migrated",
          operation_hashes: { primary: "0xoperation" },
        },
      ],
    });
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBe(
      "other-owner",
    );
    await expect(global.RedisClient?.get(secondLockKey)).resolves.toBeNull();
  });

  it("migrates every unlocked candidate in one invocation", async () => {
    const secondRpId = "rp_abcdef1234567890";
    const secondAppId = "app_abcdef1234567890abcdef1234567890";
    const secondLockKey = `rp-manager-key-migration:rp:${secondRpId}`;
    const secondCandidate = {
      rp_id: secondRpId,
      app_id: secondAppId,
      manager_kms_key_id: OLD_KEY,
    };

    arrangeCandidates([candidate, secondCandidate]);
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 2,
      results: [
        successResult,
        {
          ...successResult,
          rpId: secondRpId,
          appId: secondAppId,
        },
      ],
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(migrateRpManagersToSharedKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rpIds: [RP_ID, secondRpId],
        concurrency: 15,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          rp_id: RP_ID,
          outcome: "migrated",
          operation_hashes: { primary: "0xoperation" },
        },
        {
          rp_id: secondRpId,
          outcome: "migrated",
          operation_hashes: { primary: "0xoperation" },
        },
      ],
    });
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
    await expect(global.RedisClient?.get(secondLockKey)).resolves.toBeNull();
  });

  it("releases, retains, or cools down per-RP locks independently in a mixed batch", async () => {
    const pendingRpId = "rp_abcdef1234567890";
    const pendingAppId = "app_abcdef1234567890abcdef1234567890";
    const failedRpId = "rp_aaaabbbbccccdddd";
    const failedAppId = "app_aaaabbbbccccddddaaaabbbbccccdddd";
    const pendingLockKey = `rp-manager-key-migration:rp:${pendingRpId}`;
    const failedLockKey = `rp-manager-key-migration:rp:${failedRpId}`;

    arrangeCandidates([
      candidate,
      {
        rp_id: pendingRpId,
        app_id: pendingAppId,
        manager_kms_key_id: OLD_KEY,
      },
      {
        rp_id: failedRpId,
        app_id: failedAppId,
        manager_kms_key_id: OLD_KEY,
      },
    ]);
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 3,
      results: [
        successResult,
        {
          ...successResult,
          rpId: pendingRpId,
          appId: pendingAppId,
          status: "failed" as const,
          eligibleForCleanup: false,
          operationHashes: { primary: "0xpending" },
          failure: {
            stage: "wait_for_confirmation",
            detail: "Timed out waiting for manager update",
          },
        },
        {
          ...successResult,
          rpId: failedRpId,
          appId: failedAppId,
          status: "failed" as const,
          eligibleForCleanup: false,
          operationHashes: {},
          failure: { stage: "read_registry", detail: "RPC unavailable" },
        },
      ],
    });
    graphqlRequestMock.mockResolvedValue({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
    await expect(global.RedisClient?.get(pendingLockKey)).resolves.toEqual(
      expect.any(String),
    );
    await expect(global.RedisClient?.get(failedLockKey)).resolves.toBeNull();
    const cooldownCalls = graphqlRequestMock.mock.calls.slice(1);
    expect(cooldownCalls.map((call) => call[1])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rp_id: pendingRpId }),
        expect.objectContaining({ rp_id: failedRpId }),
      ]),
    );
    expect(cooldownCalls).toHaveLength(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "RP manager key migration batch finished",
      expect.objectContaining({
        batch_outcome: "partial_failure",
        succeeded_rp_ids: [RP_ID],
        failed_rp_ids: [pendingRpId, failedRpId],
        results: expect.arrayContaining([
          expect.objectContaining({
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "migrated",
          }),
          expect.objectContaining({
            rp_id: pendingRpId,
            app_id: pendingAppId,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "failed",
            operation_hashes: { primary: "0xpending" },
            retain_rp_lock: true,
            failure: expect.objectContaining({
              stage: "wait_for_confirmation",
            }),
          }),
          expect.objectContaining({
            rp_id: failedRpId,
            app_id: failedAppId,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "failed",
            retain_rp_lock: false,
            failure: expect.objectContaining({ stage: "read_registry" }),
          }),
        ]),
      }),
    );
  });

  it("holds the per-RP lock for the duration of the migration and releases it", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockImplementation(async () => {
      await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toEqual(
        expect.any(String),
      );
      const ttlMs = await global.RedisClient?.pttl(RP_LOCK_KEY);
      expect(ttlMs).toBeGreaterThan(30 * 60 * 1000);
      return { candidateCount: 1, results: [successResult] };
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
  });

  it("retains the per-RP lock when a transfer was submitted but not confirmed", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 1,
      results: [
        {
          ...successResult,
          status: "failed" as const,
          eligibleForCleanup: false,
          operationHashes: { primary: "0xpending" },
          failure: {
            stage: "wait_for_confirmation",
            detail: "Timed out waiting for manager update",
          },
        },
      ],
    });
    graphqlRequestMock.mockResolvedValueOnce({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toEqual(
      expect.any(String),
    );
    const ttlMs = await global.RedisClient?.pttl(RP_LOCK_KEY);
    expect(ttlMs).toBeGreaterThan(30 * 60 * 1000);
  });

  it("retains every per-RP lock when the migration invocation throws", async () => {
    const secondRpId = "rp_abcdef1234567890";
    const secondAppId = "app_abcdef1234567890abcdef1234567890";
    const secondLockKey = `rp-manager-key-migration:rp:${secondRpId}`;

    arrangeCandidates([
      candidate,
      {
        rp_id: secondRpId,
        app_id: secondAppId,
        manager_kms_key_id: OLD_KEY,
      },
    ]);
    migrateRpManagersToSharedKeyMock.mockRejectedValue(
      new Error("unexpected migration failure"),
    );
    graphqlRequestMock.mockResolvedValue({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toEqual(
      expect.any(String),
    );
    await expect(global.RedisClient?.get(secondLockKey)).resolves.toEqual(
      expect.any(String),
    );
    const ttlMs = await global.RedisClient?.pttl(RP_LOCK_KEY);
    expect(ttlMs).toBeGreaterThan(30 * 60 * 1000);
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unexpected RP manager migration cron failure",
      expect.objectContaining({
        rp_ids: [RP_ID, secondRpId],
        candidates: [
          {
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
          },
          {
            rp_id: secondRpId,
            app_id: secondAppId,
            old_manager_kms_key_id: OLD_KEY,
          },
        ],
        migration_invocation_started: true,
      }),
    );
  });

  it("releases the per-RP lock when failure happens before any transfer submit", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 1,
      results: [
        {
          ...successResult,
          status: "failed",
          eligibleForCleanup: false,
          operationHashes: {},
          failure: { stage: "read_registry", detail: "RPC unavailable" },
        },
      ],
    });
    graphqlRequestMock.mockResolvedValueOnce({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "RP manager key migration batch finished",
      expect.objectContaining({
        batch_outcome: "all_failed",
        failed_rp_ids: [RP_ID],
        succeeded_rp_ids: [],
        results: [
          expect.objectContaining({
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "failed",
            failure: expect.objectContaining({ stage: "read_registry" }),
          }),
        ],
      }),
    );
  });

  it("reports ineligible when the candidate is no longer eligible after the lock", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockResolvedValue({
      candidateCount: 0,
      results: [],
    });
    graphqlRequestMock.mockResolvedValueOnce({
      update_rp_registration: { affected_rows: 1 },
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      results: [
        {
          rp_id: RP_ID,
          outcome: "ineligible",
          operation_hashes: {},
        },
      ],
    });
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "RP manager key migration batch finished",
      expect.objectContaining({
        batch_outcome: "all_failed",
        ineligible_rp_ids: [RP_ID],
        results: [
          expect.objectContaining({
            rp_id: RP_ID,
            app_id: APP_ID,
            old_manager_kms_key_id: OLD_KEY,
            outcome: "ineligible",
          }),
        ],
      }),
    );
  });
});

// #endregion
