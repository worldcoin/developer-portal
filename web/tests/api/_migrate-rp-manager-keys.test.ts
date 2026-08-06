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

const { logger: mockLogger } = jest.requireMock("@/lib/logger") as {
  logger: { info: jest.Mock };
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

function arrangeCandidate(value: typeof candidate | null = candidate): void {
  graphqlRequestMock.mockResolvedValueOnce({
    rp_registration: value ? [value] : [],
  });
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
  it("migrates exactly one candidate with deployment-local configuration", async () => {
    arrangeCandidate();

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(migrateRpManagersToSharedKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rpIds: [RP_ID],
        sharedManagerKeyId: SHARED_KEY,
        pollIntervalMs: 2_000,
        confirmationTimeoutMs: 15_000,
        attemptId: expect.any(String),
      }),
    );
    const attemptId = migrateRpManagersToSharedKeyMock.mock.calls[0][0]
      .attemptId as string;
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration attempt started",
      expect.objectContaining({ attempt_id: attemptId, rp_id: RP_ID }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key migration attempt finished",
      expect.objectContaining({ attempt_id: attemptId, rp_id: RP_ID }),
    );
    expect(graphqlRequestMock).toHaveBeenCalledTimes(1);
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
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

  it("touches a failed candidate so it cools down for 15 minutes", async () => {
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
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBe(
      "other-owner",
    );
  });

  it("holds the per-RP lock for the duration of the migration and releases it", async () => {
    arrangeCandidate();
    migrateRpManagersToSharedKeyMock.mockImplementation(async () => {
      await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toEqual(
        expect.any(String),
      );
      return { candidateCount: 1, results: [successResult] };
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
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
      rp_id: RP_ID,
      outcome: "ineligible",
      operation_hashes: {},
    });
    await expect(global.RedisClient?.get(RP_LOCK_KEY)).resolves.toBeNull();
  });
});

// #endregion
