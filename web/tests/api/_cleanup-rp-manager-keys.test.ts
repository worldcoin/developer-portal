import { NextRequest, NextResponse } from "next/server";

// #region Mocks

jest.mock("server-only", () => ({}));

const protectInternalEndpointMock = jest.fn();
jest.mock("@/api/helpers/utils", () => ({
  protectInternalEndpoint: (...args: unknown[]) =>
    protectInternalEndpointMock(...args),
}));

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

const cleanupRpManagerKeysMock = jest.fn();
jest.mock("../../scripts/cleanup-rp-manager-keys", () => ({
  cleanupRpManagerKeys: (...args: unknown[]) =>
    cleanupRpManagerKeysMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "@/api/_cleanup-rp-manager-keys";

const { logger: mockLogger } = jest.requireMock("@/lib/logger") as {
  logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock };
};

// #endregion

// #region Test data

const RP_ID = "rp_1234567890abcdef";
const APP_ID = "app_1234567890abcdef1234567890abcdef";
const OLD_KEY_ARN = "arn:aws:kms:eu-west-1:111111111111:key/old-key";
const GLOBAL_LOCK_KEY = "rp-manager-key-cleanup:run";
const PRIMARY_CONFIG = {
  kmsRegion: "eu-west-1",
  contractAddress: "0x1111111111111111111111111111111111111111",
};
const STAGING_CONFIG = {
  kmsRegion: "eu-west-1",
  contractAddress: "0x2222222222222222222222222222222222222222",
};

const successResult = {
  rpId: RP_ID,
  appId: APP_ID,
  oldManagerKeyArn: OLD_KEY_ARN,
  status: "deletion_scheduled",
  expectedDeletionAt: "2026-09-11T12:00:00.000Z",
};

const secondSuccessResult = {
  rpId: "rp_abcdef1234567890",
  appId: "app_abcdef1234567890abcdef1234567890",
  oldManagerKeyArn: "arn:aws:kms:eu-west-1:111111111111:key/old-key-2",
  status: "deletion_scheduled",
  expectedDeletionAt: "2026-09-11T12:00:00.000Z",
};

const blockedResult = {
  rpId: "rp_fedcba0987654321",
  appId: "app_fedcba0987654321fedcba0987654321",
  oldManagerKeyArn: "arn:aws:kms:eu-west-1:111111111111:key/old-key-3",
  status: "blocked",
  detail: "RP still uses the old manager in registry primary",
};

const request = () =>
  new NextRequest("http://localhost/api/_cleanup-rp-manager-keys", {
    method: "POST",
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  process.env.ENABLE_RP_MANAGER_KEY_CLEANUP = "true";
  process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = "false";
  process.env.NEXT_PUBLIC_APP_ENV = "staging";

  protectInternalEndpointMock.mockReturnValue({ isAuthenticated: true });
  getAPIServiceGraphqlClientMock.mockResolvedValue({});
  getRpRegistryConfigMock.mockReturnValue(PRIMARY_CONFIG);
  getStagingRpRegistryConfigMock.mockReturnValue(null);
  getKMSClientMock.mockResolvedValue({});
  cleanupRpManagerKeysMock.mockResolvedValue({
    candidateCount: 3,
    results: [successResult, secondSuccessResult, blockedResult],
  });
});

// #endregion

// #region Guards

describe("/_cleanup-rp-manager-keys [guards]", () => {
  it("returns the internal authentication error", async () => {
    protectInternalEndpointMock.mockReturnValue({
      isAuthenticated: false,
      errorResponse: new NextResponse(null, { status: 403 }),
    });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(cleanupRpManagerKeysMock).not.toHaveBeenCalled();
  });

  it("returns 204 when cleanup is disabled", async () => {
    process.env.ENABLE_RP_MANAGER_KEY_CLEANUP = "false";

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(cleanupRpManagerKeysMock).not.toHaveBeenCalled();
  });

  it("returns 204 when migration is still enabled", async () => {
    process.env.ENABLE_RP_MANAGER_KEY_MIGRATION = "true";

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(cleanupRpManagerKeysMock).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key cleanup skipped because migration is enabled",
    );
  });

  it("returns 204 when another invocation owns the global lock", async () => {
    await global.RedisClient?.set(GLOBAL_LOCK_KEY, "another-owner");

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(cleanupRpManagerKeysMock).not.toHaveBeenCalled();
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
    expect(cleanupRpManagerKeysMock).not.toHaveBeenCalled();
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });
});

// #endregion

// #region Cleanup attempt

describe("/_cleanup-rp-manager-keys [attempt]", () => {
  it("cleans up a batch with deployment-local configuration", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      candidate_count: 3,
      result_count: 3,
      counts_by_status: {
        deletion_scheduled: 2,
        blocked: 1,
      },
    });
    expect(cleanupRpManagerKeysMock).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryRegistry: { name: "primary", config: PRIMARY_CONFIG },
        limit: 15,
      }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "RP manager key cleanup attempt finished",
      expect.objectContaining({
        candidate_count: 3,
        result_count: 3,
        counts_by_status: {
          deletion_scheduled: 2,
          blocked: 1,
        },
      }),
    );
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });

  it("passes the staging mirror to cleanup in production", async () => {
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    getStagingRpRegistryConfigMock.mockReturnValue(STAGING_CONFIG);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(cleanupRpManagerKeysMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stagingMirrorRegistry: {
          name: "staging",
          config: STAGING_CONFIG,
        },
        limit: 15,
      }),
    );
  });

  it("returns 204 when there is no cleanup candidate", async () => {
    cleanupRpManagerKeysMock.mockResolvedValue({
      candidateCount: 0,
      results: [],
    });

    const response = await POST(request());

    expect(response.status).toBe(204);
    await expect(global.RedisClient?.get(GLOBAL_LOCK_KEY)).resolves.toBeNull();
  });
});

// #endregion
