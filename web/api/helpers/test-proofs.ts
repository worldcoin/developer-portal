import "server-only";

import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import tracer from "dd-trace";
import type { VerifyProofResult } from "./temporal-rpc";
import { VERIFIER_ERROR_MAP } from "./verifier-errors";

export const TEST_VERIFICATION_OUTCOMES = [
  "success",
  "expired",
  "invalid_proof",
] as const;

export type TestVerificationOutcome =
  (typeof TEST_VERIFICATION_OUTCOMES)[number];

const TEST_PROOF_TTL_SECONDS = 600;
const ZERO_FIELD_ELEMENT = `0x${"0".repeat(64)}`;

class TestVerificationFailure extends Error {
  constructor(
    readonly category:
      | "timeout"
      | "redis_unavailable"
      | "store_refused"
      | "malformed_record",
    message: string,
  ) {
    super(message);
  }
}

const failureCategory = (error: unknown): string => {
  if (error instanceof TestVerificationFailure) return error.category;
  if (error instanceof SyntaxError) return "malformed_record";
  return "redis_error";
};

export type TestVerificationPayload = {
  protocol_version: "4.0";
  environment: "staging";
  action: string;
  nonce: string;
  responses: [
    {
      identifier: "proof_of_human";
      issuer_schema_id: number;
      nullifier: string;
      signal_hash: string;
      expires_at_min: number;
      credential_genesis_issued_at_min: number;
      proof: [string, string, string, string, string];
    },
  ];
};

type TestProofRecord = {
  rp_id: string;
  action: string;
  team_id: string;
  outcome: TestVerificationOutcome;
  expires_at: string;
};

const isOutcome = (value: unknown): value is TestVerificationOutcome =>
  TEST_VERIFICATION_OUTCOMES.some((outcome) => outcome === value);

export async function withTestVerificationTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 1000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new TestVerificationFailure(
                "timeout",
                "Test verification operation timed out",
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function recordTestVerificationMetric(
  outcome: string,
  result: string,
  toolMode: string,
): void {
  try {
    tracer.dogstatsd.increment("world_id.test_verification", 1, {
      outcome,
      result,
      tool_mode: toolMode,
    });
  } catch {
    logger.warn("Failed to record test verification metric", {
      error_category: "metric_error",
    });
  }
}

export async function mintTestProof(params: {
  rpId: string;
  action: string;
  teamId: string;
  outcome: TestVerificationOutcome;
}): Promise<{ payload: TestVerificationPayload; expires_at: string }> {
  if (
    !/^rp_[\da-f]{16}$/i.test(params.rpId) ||
    !params.action ||
    !params.teamId ||
    !isOutcome(params.outcome)
  ) {
    throw new Error("Invalid test verification parameters");
  }

  const expiresAt = Date.now() + TEST_PROOF_TTL_SECONDS * 1000;
  const expires_at = new Date(expiresAt).toISOString();
  // Keep 248 random bits within the field, encoded as a full 32-byte value.
  const nullifier = `0x00${randomBytes(31).toString("hex")}`;
  const record: TestProofRecord = {
    rp_id: params.rpId.toLowerCase(),
    action: params.action,
    team_id: params.teamId,
    outcome: params.outcome,
    expires_at,
  };

  try {
    const redis = global.RedisClient;
    if (!redis) {
      throw new TestVerificationFailure(
        "redis_unavailable",
        "Redis is unavailable",
      );
    }
    const saved = await withTestVerificationTimeout(
      redis.set(
        `test_proof:${BigInt(nullifier).toString()}`,
        JSON.stringify(record),
        "EX",
        TEST_PROOF_TTL_SECONDS,
        "NX",
      ),
    );
    if (saved !== "OK") {
      throw new TestVerificationFailure(
        "store_refused",
        "Test nullifier already exists",
      );
    }
  } catch (error) {
    recordTestVerificationMetric(params.outcome, "store_error", "mint");
    logger.warn("Failed to store test verification", {
      rp_id: record.rp_id,
      team_id: params.teamId,
      error_category: failureCategory(error),
    });
    throw new Error("Test verification storage is unavailable");
  }

  return {
    expires_at,
    payload: {
      protocol_version: "4.0",
      environment: "staging",
      action: params.action,
      nonce: `0x00${randomBytes(31).toString("hex")}`,
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          nullifier,
          signal_hash: "0x0",
          expires_at_min: Math.floor(expiresAt / 1000),
          credential_genesis_issued_at_min: 0,
          proof: [
            ZERO_FIELD_ELEMENT,
            ZERO_FIELD_ELEMENT,
            ZERO_FIELD_ELEMENT,
            ZERO_FIELD_ELEMENT,
            ZERO_FIELD_ELEMENT,
          ],
        },
      ],
    },
  };
}

export async function getTestProofVerdict(params: {
  rpId: bigint;
  action: string;
  nullifier: bigint;
  environment: string | undefined;
}): Promise<(VerifyProofResult & { test: true }) | null> {
  if (params.environment !== "staging") {
    return null;
  }

  const rpId = `rp_${params.rpId.toString(16).padStart(16, "0")}`;
  try {
    const redis = global.RedisClient;
    if (!redis) {
      throw new TestVerificationFailure(
        "redis_unavailable",
        "Redis is unavailable",
      );
    }
    const value = await withTestVerificationTimeout(
      redis.get(`test_proof:${params.nullifier.toString()}`),
    );
    if (value === null) return null;

    const record: unknown = JSON.parse(value);
    if (
      !record ||
      typeof record !== "object" ||
      !("rp_id" in record) ||
      typeof record.rp_id !== "string" ||
      !/^rp_[\da-f]{16}$/.test(record.rp_id) ||
      !("action" in record) ||
      typeof record.action !== "string" ||
      !record.action ||
      !("team_id" in record) ||
      typeof record.team_id !== "string" ||
      !record.team_id ||
      !("outcome" in record) ||
      !isOutcome(record.outcome) ||
      !("expires_at" in record) ||
      typeof record.expires_at !== "string" ||
      !Number.isFinite(Date.parse(record.expires_at))
    ) {
      throw new TestVerificationFailure(
        "malformed_record",
        "Malformed test verification record",
      );
    }

    const expiresAt = Date.parse(record.expires_at);
    if (
      record.rp_id !== rpId ||
      record.action !== params.action ||
      expiresAt <= Date.now()
    ) {
      return null;
    }

    recordTestVerificationMetric(record.outcome, "matched", "accept");
    if (record.outcome === "success") return { success: true, test: true };

    return {
      success: false,
      test: true,
      error:
        record.outcome === "expired"
          ? VERIFIER_ERROR_MAP.OutdatedNullifier
          : VERIFIER_ERROR_MAP.ProofInvalid,
    };
  } catch (error) {
    recordTestVerificationMetric("unknown", "lookup_error", "accept");
    logger.warn(
      "Failed to look up test verification; using on-chain verification",
      {
        rp_id: rpId,
        error_category: failureCategory(error),
      },
    );
    return null;
  }
}
