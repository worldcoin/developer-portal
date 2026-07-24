import { logPortalEvent } from "@/api/helpers/portal-events";
import { encodeNullifierForStorage } from "@/api/helpers/verify";
import { handleUniquenessProofVerification } from "@/api/v4/verify/uniqueness-proof/handler";
import { logger } from "@/lib/logger";
import { GraphQLClient } from "graphql-request";
import { NextRequest } from "next/server";
import { captureEvent } from "../../../services/posthogClient";

// #region Mocks
const FetchActionV4 = jest.fn();
jest.mock("../../../api/v4/verify/graphql/fetch-action-v4.generated", () => ({
  getSdk: () => ({ FetchActionV4 }),
}));

const CreateActionV4 = jest.fn();
jest.mock("../../../api/v4/verify/graphql/create-action-v4.generated", () => ({
  getSdk: () => ({ CreateActionV4 }),
}));

const AtomicUpsertNullifierV4 = jest.fn();
jest.mock(
  "../../../api/v4/verify/graphql/atomic-upsert-nullifier-v4.generated",
  () => ({
    getSdk: () => ({ AtomicUpsertNullifierV4 }),
  }),
);

const mockProcessUniquenessProofV3 = jest.fn();
jest.mock("../../../api/v4/verify/uniqueness-proof/verify-v3", () => ({
  processUniquenessProofV3: (...args: unknown[]) =>
    mockProcessUniquenessProofV3(...args),
}));

const mockProcessUniquenessProofV4 = jest.fn();
jest.mock("../../../api/v4/verify/uniqueness-proof/verify-v4", () => ({
  processUniquenessProofV4: (...args: unknown[]) =>
    mockProcessUniquenessProofV4(...args),
}));

jest.mock("../../../services/posthogClient", () => ({
  captureEvent: jest.fn(),
}));

jest.mock("@/api/helpers/portal-events", () => ({
  logPortalEvent: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const rpId = "rp_0123456789abcdef";
const appId = "app_0123456789abcdef0123456789abcdef";
const action = "test-action";
const actionV4Id = "action_v4_x";
const nullifier = "0x0abc1234";
const createdAt = "2026-07-23T12:00:00.000Z";
const updatedAt = "2026-07-23T12:01:00.000Z";
const client = {} as GraphQLClient;

const v3Response = {
  identifier: "orb",
  signal_hash: "0x0",
  merkle_root: "0x1",
  nullifier: "0x2",
  proof: "proof",
};

const makeParsedParams = (responses = [v3Response]) => ({
  action,
  protocol_version: "3.0" as const,
  responses,
  environment: "production" as const,
});

const createRequest = () =>
  new NextRequest(`http://localhost:3000/api/v4/verify/${appId}`, {
    method: "POST",
  });

const newNullifierResult = {
  insert_nullifier_v4_one: { id: "nil_v4_1" },
  update_nullifier_v4: {
    affected_rows: 1,
    returning: [
      {
        id: "nil_v4_1",
        uses: 1,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ],
  },
};

const reusedNullifierResult = {
  insert_nullifier_v4_one: null,
  update_nullifier_v4: {
    affected_rows: 1,
    returning: [
      {
        id: "nil_v4_1",
        uses: 2,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ],
  },
};

const crossActionResult = {
  insert_nullifier_v4_one: null,
  update_nullifier_v4: {
    affected_rows: 0,
    returning: [],
  },
};

const expectSuccessEvents = (nullifierReused: boolean) => {
  expect(captureEvent).toHaveBeenCalledTimes(1);
  expect(captureEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "action_verify_v4_success",
      properties: expect.objectContaining({
        nullifier_reused: nullifierReused,
      }),
    }),
  );
  expect(logPortalEvent).toHaveBeenCalledTimes(1);
  expect(logPortalEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "action_verification",
      metadata: expect.objectContaining({
        nullifier_reused: nullifierReused,
      }),
    }),
  );
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  FetchActionV4.mockResolvedValue({
    action_v4: [
      {
        id: actionV4Id,
        rp_id: rpId,
        action,
        environment: "production",
      },
    ],
  });
  mockProcessUniquenessProofV3.mockResolvedValue([
    { identifier: "0", success: true, nullifier },
  ]);
  AtomicUpsertNullifierV4.mockResolvedValue(newNullifierResult);
});

// #region Atomic nullifier upsert
describe("handleUniquenessProofVerification [atomic nullifier upsert]", () => {
  it("does not write a nullifier when all proofs fail", async () => {
    mockProcessUniquenessProofV3.mockResolvedValueOnce([
      { identifier: "0", success: false, code: "invalid_proof" },
    ]);

    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(),
      createRequest(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("all_verifications_failed");
    expect(AtomicUpsertNullifierV4).not.toHaveBeenCalled();
  });

  it("inserts and counts a new nullifier", async () => {
    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(),
      createRequest(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Proof verified successfully");
    expect(body.created_at).toBe(createdAt);
    expect(AtomicUpsertNullifierV4).toHaveBeenCalledTimes(1);
    expect(AtomicUpsertNullifierV4).toHaveBeenCalledWith({
      action_v4_id: actionV4Id,
      nullifier: encodeNullifierForStorage(nullifier),
    });
    expectSuccessEvents(false);
  });

  it("counts a reused nullifier and reports the reuse", async () => {
    AtomicUpsertNullifierV4.mockResolvedValueOnce(reusedNullifierResult);

    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(),
      createRequest(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toMatch(/\(nullifier reuse\)$/);
    expectSuccessEvents(true);
    expect(logger.info).toHaveBeenCalledWith(
      "Nullifier reused",
      expect.objectContaining({
        nullifier: encodeNullifierForStorage(nullifier),
        uses: 2,
      }),
    );
  });

  it("returns an internal error for a cross-action nullifier conflict", async () => {
    AtomicUpsertNullifierV4.mockResolvedValueOnce(crossActionResult);

    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(),
      createRequest(),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("internal_error");
    expect(logger.error).toHaveBeenCalled();
    expect(captureEvent).not.toHaveBeenCalled();
    expect(logPortalEvent).not.toHaveBeenCalled();
  });

  it("upserts only the first successful result in a multi-proof request", async () => {
    const firstSuccessfulNullifier = "0x00ff";
    const responses = [
      v3Response,
      { ...v3Response, identifier: "device" },
      { ...v3Response, identifier: "face" },
    ];
    mockProcessUniquenessProofV3.mockResolvedValueOnce([
      { identifier: "0", success: false, code: "invalid_proof" },
      {
        identifier: "1",
        success: true,
        nullifier: firstSuccessfulNullifier,
      },
      { identifier: "2", success: true, nullifier: "0x1234" },
    ]);

    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(responses),
      createRequest(),
    );

    expect(response.status).toBe(200);
    expect(mockProcessUniquenessProofV3).toHaveBeenCalledWith(
      appId,
      action,
      responses,
      false,
    );
    expect(AtomicUpsertNullifierV4).toHaveBeenCalledTimes(1);
    expect(AtomicUpsertNullifierV4).toHaveBeenCalledWith({
      action_v4_id: actionV4Id,
      nullifier: encodeNullifierForStorage(firstSuccessfulNullifier),
    });
  });

  it("returns an internal error when the atomic upsert rejects", async () => {
    AtomicUpsertNullifierV4.mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    const response = await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      makeParsedParams(),
      createRequest(),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("internal_error");
    expect(captureEvent).not.toHaveBeenCalled();
    expect(logPortalEvent).not.toHaveBeenCalled();
  });
});
// #endregion
