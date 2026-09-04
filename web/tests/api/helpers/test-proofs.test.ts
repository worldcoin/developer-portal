import {
  getTestProofVerdict,
  mintTestProof,
  recordTestVerificationMetric,
  TestVerificationPayload,
  withTestVerificationTimeout,
} from "@/api/helpers/test-proofs";
import { toUniquenessProofParams } from "@/api/helpers/uniqueness-proof-params";
import { VERIFIER_ERROR_MAP } from "@/api/helpers/verifier-errors";
import { schema } from "@/api/v4/verify/request-schema";
import { logger } from "@/lib/logger";
import tracer from "dd-trace";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("dd-trace", () => ({ dogstatsd: { increment: jest.fn() } }));
// #endregion

// #region Test Data
const redis = global.RedisClient!;
const params = {
  rpId: "rp_1234567890abcdef",
  action: "test-action",
  teamId: "team_1234567890abcdef1234567890abcdef",
  outcome: "success" as const,
};
const lookup = (payload?: TestVerificationPayload) => ({
  action: params.action,
  environment: "staging",
  proofParams: toUniquenessProofParams(
    BigInt(`0x${params.rpId.slice(3)}`),
    payload?.nonce ?? "0x1",
    params.action,
    payload?.responses[0] ?? {
      nullifier: "0x1",
      signal_hash: "0x0",
      expires_at_min: 0,
      issuer_schema_id: 1,
      proof: ["0x0", "0x0", "0x0", "0x0", "0x0"],
    },
  ),
});
const storeKey = (nullifier: string) =>
  `test_proof:${BigInt(nullifier).toString()}`;
// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  global.RedisClient = redis;
  await redis.flushall();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  global.RedisClient = redis;
});

// #region Minting and immutable verdicts
describe("test proof minting", () => {
  it("mints a schema-valid staging payload with a canonical, expiring record", async () => {
    const before = Date.now();
    const minted = await mintTestProof({
      ...params,
      rpId: params.rpId.toUpperCase().replace("RP_", "rp_"),
    });
    const response = minted.payload.responses[0];
    const key = storeKey(response.nullifier);

    await expect(schema.validate(minted.payload)).resolves.toMatchObject({
      protocol_version: "4.0",
      environment: "staging",
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          proof: response.proof,
        },
      ],
    });
    expect(response.proof).toHaveLength(5);
    expect(response.nullifier).toMatch(/^0x[\da-f]{64}$/);
    expect(minted.payload.nonce).toMatch(/^0x[\da-f]{64}$/);
    for (const element of response.proof) {
      expect(element).toMatch(/^0x[\da-f]{64}$/);
    }
    expect(BigInt(minted.payload.nonce)).toBeGreaterThanOrEqual(0n);
    expect(Date.parse(minted.expires_at)).toBeGreaterThanOrEqual(
      before + 600_000,
    );
    expect(Date.parse(minted.expires_at)).toBeLessThanOrEqual(
      Date.now() + 600_000,
    );
    const wireExpiryMs = response.expires_at_min * 1000;
    expect(wireExpiryMs).toBeGreaterThan(before);
    expect(Date.parse(minted.expires_at) - wireExpiryMs).toBeGreaterThanOrEqual(
      0,
    );
    expect(Date.parse(minted.expires_at) - wireExpiryMs).toBeLessThan(1000);
    expect(await redis.ttl(key)).toBeGreaterThan(0);
    expect(await redis.ttl(key)).toBeLessThanOrEqual(600);
    expect(JSON.parse((await redis.get(key))!)).toEqual({
      rp_id: params.rpId,
      action: params.action,
      team_id: params.teamId,
      outcome: "success",
      expires_at: minted.expires_at,
      proof_digest: expect.stringMatching(/^[\da-f]{64}$/),
    });
  });

  it("returns the same verdict on repeated canonical lookups without consuming or extending the record", async () => {
    const { payload } = await mintTestProof(params);
    const nullifier = payload.responses[0].nullifier;
    const key = storeKey(nullifier);
    const record = await redis.get(key);
    const ttl = await redis.pttl(key);

    await expect(getTestProofVerdict(lookup(payload))).resolves.toEqual({
      success: true,
      test: true,
    });
    await expect(
      getTestProofVerdict({
        ...lookup(payload),
        proofParams: {
          ...lookup(payload).proofParams,
          nullifier: BigInt(`0x000${nullifier.slice(2).toUpperCase()}`),
        },
      }),
    ).resolves.toEqual({ success: true, test: true });
    expect(await redis.get(key)).toBe(record);
    expect(await redis.pttl(key)).toBeLessThanOrEqual(ttl);
    expect(await redis.pttl(key)).toBeGreaterThan(0);
  });

  it.each([
    ["expired", VERIFIER_ERROR_MAP.OutdatedNullifier],
    ["invalid_proof", VERIFIER_ERROR_MAP.ProofInvalid],
  ] as const)(
    "maps %s to the actual verifier error",
    async (outcome, error) => {
      const { payload } = await mintTestProof({ ...params, outcome });
      const request = lookup(payload);
      const expected = { success: false, test: true, error };
      await expect(getTestProofVerdict(request)).resolves.toEqual(expected);
      await expect(getTestProofVerdict(request)).resolves.toEqual(expected);
    },
  );

  it("does not overwrite an existing key when the atomic insert is refused", async () => {
    const set = jest.spyOn(redis, "set").mockResolvedValueOnce(null);
    await expect(mintTestProof(params)).rejects.toThrow(
      "storage is unavailable",
    );
    expect(set).toHaveBeenCalledWith(
      expect.stringMatching(/^test_proof:\d+$/),
      expect.any(String),
      "EX",
      600,
      "NX",
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to store test verification",
      expect.objectContaining({ error_category: "store_refused" }),
    );
  });

  it("refuses malformed RP IDs and unsupported outcomes before writing", async () => {
    const set = jest.spyOn(redis, "set");
    await expect(mintTestProof({ ...params, rpId: "rp_bad" })).rejects.toThrow(
      "Invalid test verification parameters",
    );
    await expect(
      mintTestProof({ ...params, outcome: "unsupported" as "success" }),
    ).rejects.toThrow("Invalid test verification parameters");
    expect(set).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Fences and lookup failures
describe("test proof acceptance fences", () => {
  it("does not read Redis outside the exact staging environment", async () => {
    const get = jest.spyOn(redis, "get");
    for (const environment of ["production", "sandbox", undefined]) {
      await expect(
        getTestProofVerdict({ ...lookup(), environment }),
      ).resolves.toBeNull();
    }
    expect(get).not.toHaveBeenCalled();
  });

  it("returns a miss without treating real proofs as lookup errors", async () => {
    await expect(getTestProofVerdict(lookup())).resolves.toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("refuses another RP or an action with a different exact spelling", async () => {
    const { payload } = await mintTestProof(params);
    const request = lookup(payload);
    await expect(
      getTestProofVerdict({
        ...request,
        proofParams: {
          ...request.proofParams,
          rpId: request.proofParams.rpId + 1n,
        },
      }),
    ).resolves.toBeNull();
    await expect(
      getTestProofVerdict({ ...request, action: params.action.toUpperCase() }),
    ).resolves.toBeNull();
    await expect(getTestProofVerdict(request)).resolves.toMatchObject({
      test: true,
    });
  });

  it("honors absolute expiry even when the Redis key survives beyond its TTL", async () => {
    const { payload } = await mintTestProof(params);
    const request = lookup(payload);
    const key = storeKey(payload.responses[0].nullifier);
    const record = JSON.parse((await redis.get(key))!);
    const now = Date.now();
    await redis.set(
      key,
      JSON.stringify({ ...record, expires_at: new Date(now).toISOString() }),
    );
    jest.spyOn(Date, "now").mockReturnValue(now);
    await expect(getTestProofVerdict(request)).resolves.toBeNull();
    expect(await redis.get(key)).not.toBeNull();
  });

  it.each([undefined, "not-a-digest", "a".repeat(64)])(
    "falls through for a missing, malformed or mismatched proof digest: %s",
    async (proof_digest) => {
      const { payload } = await mintTestProof(params);
      const key = storeKey(payload.responses[0].nullifier);
      const record = JSON.parse((await redis.get(key))!);
      await redis.set(key, JSON.stringify({ ...record, proof_digest }));
      await expect(getTestProofVerdict(lookup(payload))).resolves.toBeNull();
    },
  );

  it("binds the converted action even when the raw action scope is unchanged", async () => {
    const { payload } = await mintTestProof(params);
    const request = lookup(payload);
    request.proofParams.action += 1n;
    await expect(getTestProofVerdict(request)).resolves.toBeNull();
  });

  it("binds the nullifier even if its record is copied to another Redis key", async () => {
    const { payload } = await mintTestProof(params);
    const request = lookup(payload);
    const record = (await redis.get(storeKey(payload.responses[0].nullifier)))!;
    request.proofParams.nullifier += 1n;
    await redis.set(
      storeKey(`0x${request.proofParams.nullifier.toString(16)}`),
      record,
    );
    await expect(getTestProofVerdict(request)).resolves.toBeNull();
  });

  it.each([
    "not JSON",
    "null",
    JSON.stringify({ outcome: "success" }),
    "invalid-outcome",
  ])("falls through safely for malformed stored data: %s", async (value) => {
    const { payload } = await mintTestProof(params);
    const key = storeKey(payload.responses[0].nullifier);
    const stored =
      value === "invalid-outcome"
        ? JSON.stringify({
            ...JSON.parse((await redis.get(key))!),
            outcome: "invalid_rp_signature",
          })
        : value;
    await redis.set(key, stored);
    await expect(getTestProofVerdict(lookup(payload))).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error_category: "malformed_record" }),
    );
    expect(tracer.dogstatsd.increment).toHaveBeenCalledWith(
      "world_id.test_verification",
      1,
      { outcome: "unknown", result: "lookup_error", tool_mode: "accept" },
    );
  });

  it("fails mint but falls through on accept when Redis is missing", async () => {
    global.RedisClient = undefined;
    await expect(mintTestProof(params)).rejects.toThrow(
      "storage is unavailable",
    );
    await expect(getTestProofVerdict(lookup())).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ error_category: "redis_unavailable" }),
    );
  });

  it("does not expose Redis error details while falling through on lookup failure", async () => {
    const secret = "redis://private-credential@host";
    jest.spyOn(redis, "get").mockRejectedValueOnce(new Error(secret));
    await expect(getTestProofVerdict(lookup())).resolves.toBeNull();
    expect(JSON.stringify(jest.mocked(logger.warn).mock.calls)).not.toContain(
      secret,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error_category: "redis_error" }),
    );
  });

  it("bounds a stuck Redis lookup to one second", async () => {
    jest.useFakeTimers();
    jest.spyOn(redis, "get").mockReturnValueOnce(new Promise(() => {}));
    const result = getTestProofVerdict(lookup());
    await jest.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error_category: "timeout" }),
    );
  });

  it("fails rather than returning a payload when a Redis write times out", async () => {
    jest.useFakeTimers();
    jest.spyOn(redis, "set").mockReturnValueOnce(new Promise(() => {}));
    const assertion = expect(mintTestProof(params)).rejects.toThrow(
      "storage is unavailable",
    );
    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error_category: "timeout" }),
    );
  });
});
// #endregion

// #region Shared timeout and observability
describe("test proof infrastructure", () => {
  it("clears timeout timers after both success and rejection", async () => {
    jest.useFakeTimers();
    await expect(withTestVerificationTimeout(Promise.resolve(1))).resolves.toBe(
      1,
    );
    await expect(
      withTestVerificationTimeout(Promise.reject(new Error("failed"))),
    ).rejects.toThrow("failed");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not make verification depend on metric delivery", () => {
    jest.mocked(tracer.dogstatsd.increment).mockImplementationOnce(() => {
      throw new Error("metrics unavailable");
    });
    expect(() =>
      recordTestVerificationMetric("success", "matched", "accept"),
    ).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to record test verification metric",
      { error_category: "metric_error" },
    );
  });
});
// #endregion
