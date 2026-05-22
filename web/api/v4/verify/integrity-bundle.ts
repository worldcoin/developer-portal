import "server-only";

import { logger } from "@/lib/logger";
import { p256 } from "@noble/curves/p256";
import { decode as decodeCbor } from "cbor-x";
import { createHash } from "crypto";
import {
  decodeProtectedHeader,
  importJWK,
  JWK,
  JWTPayload,
  jwtVerify,
} from "jose";
import { JWSSignatureVerificationFailed } from "jose/errors";
import {
  IntegrityBundle,
  SessionResponseItem,
  UniquenessProofResponseV3,
  UniquenessProofResponseV4,
} from "./request-schema";

const PROOF_INTEGRITY_V3_DOMAIN = "worldcoin/proof-integrity/v3";
const PROOF_INTEGRITY_V4_DOMAIN = "worldcoin/proof-integrity/v4";
const INTEGRITY_BUNDLE_VERSION = 1;
const JWKS_CACHE_TTL_SECONDS = 24 * 60 * 60;
const SIGNATURE_TIMESTAMP_THRESHOLD_SECONDS = 5 * 60;
const JWKS_FETCH_TIMEOUT_MS = 4_000;

type IntegrityEnvironment = "production" | "staging";

const DEFAULT_INTEGRITY_ENVIRONMENT: IntegrityEnvironment = "production";
const INTEGRITY_ATTESTATION_CONFIG_BY_ENVIRONMENT: Record<
  IntegrityEnvironment,
  { issuer: string; jwksUrl: string }
> = {
  production: {
    issuer: "attestation.worldcoin.org",
    jwksUrl: "https://attestation.worldcoin.org/.well-known/jwks.json",
  },
  staging: {
    issuer: "attestation.worldcoin.dev",
    jwksUrl: "https://attestation.worldcoin.dev/.well-known/jwks.json",
  },
};

export const INTEGRITY_VERIFICATION_ERROR_CODE =
  "integrity_verification_failed";

type SignatureFormat = "apple_app_attest" | "android_keystore";
type IntegrityPlatform = "ios" | "android";

type ParsedIntegrityBundle = {
  version: number;
  signatureFormat: SignatureFormat;
  timestamp: number;
  signatureHex: string;
  jwt: string;
};

type IntegrityTokenClaims = JWTPayload & {
  pass?: unknown;
  platform?: unknown;
  cnf?: unknown;
};

type IntegrityVerificationParams = {
  environment?: IntegrityEnvironment;
  integrityBundle: IntegrityBundle;
  nonce: string;
  protocolVersion: "3.0" | "4.0";
  responses:
    | UniquenessProofResponseV3[]
    | UniquenessProofResponseV4[]
    | SessionResponseItem[];
  rpId: string;
};

export type IntegrityVerificationResult =
  | { success: true }
  | {
      success: false;
      reason: string;
    };

class IntegrityBundleError extends Error {
  constructor(
    readonly reason: string,
    message = reason,
  ) {
    super(message);
  }
}

const signatureFormatPlatform: Record<SignatureFormat, IntegrityPlatform> = {
  apple_app_attest: "ios",
  android_keystore: "android",
};

const sha256 = (data: Uint8Array | Buffer | string) =>
  createHash("sha256").update(data).digest();

const u32be = (value: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
};

const i64be = (value: number) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(value));
  return buffer;
};

const resolveIntegrityAttestationConfig = (
  environment: IntegrityEnvironment = DEFAULT_INTEGRITY_ENVIRONMENT,
) => INTEGRITY_ATTESTATION_CONFIG_BY_ENVIRONMENT[environment];

export function normalizeIntegrityBundle(
  integrityBundle: IntegrityBundle,
): ParsedIntegrityBundle {
  if (typeof integrityBundle !== "object" || integrityBundle === null) {
    throw new IntegrityBundleError("malformed_bundle");
  }

  const version = integrityBundle.version;
  const signatureFormat = integrityBundle.signature_format;
  const timestamp = integrityBundle.timestamp;
  const signatureHex = integrityBundle.signature;
  const jwt = integrityBundle.jwt;

  if (
    version === undefined ||
    !signatureFormat ||
    timestamp === undefined ||
    !signatureHex ||
    !jwt
  ) {
    throw new IntegrityBundleError("missing_bundle_field");
  }

  if (version !== INTEGRITY_BUNDLE_VERSION) {
    throw new IntegrityBundleError("unsupported_bundle_version");
  }

  if (
    signatureFormat !== "apple_app_attest" &&
    signatureFormat !== "android_keystore"
  ) {
    throw new IntegrityBundleError("unsupported_signature_format");
  }

  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new IntegrityBundleError("invalid_timestamp");
  }

  if (
    signatureHex.length === 0 ||
    signatureHex.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(signatureHex)
  ) {
    throw new IntegrityBundleError("invalid_signature_encoding");
  }

  return {
    version,
    signatureFormat,
    timestamp,
    signatureHex,
    jwt,
  };
}

function validateTimestamp(timestamp: number) {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (timestamp > nowSeconds) {
    throw new IntegrityBundleError("timestamp_in_future");
  }

  if (nowSeconds - timestamp > SIGNATURE_TIMESTAMP_THRESHOLD_SECONDS) {
    throw new IntegrityBundleError("timestamp_too_old");
  }
}

function parseNonceToFieldBytes(nonce: string) {
  let value: bigint;
  try {
    value = BigInt(nonce);
  } catch {
    throw new IntegrityBundleError("invalid_nonce");
  }

  if (value < 0n || value >= 1n << 256n) {
    throw new IntegrityBundleError("invalid_nonce");
  }

  return Buffer.from(value.toString(16).padStart(64, "0"), "hex");
}

function addLengthPrefixedString(
  hasher: ReturnType<typeof createHash>,
  value: string,
) {
  const bytes = Buffer.from(value, "utf8");

  if (bytes.length > 0xffffffff) {
    throw new IntegrityBundleError("proof_too_large");
  }

  hasher.update(u32be(bytes.length));
  hasher.update(bytes);
}

export function computeProofIntegrityDigest(params: {
  nonce: string;
  protocolVersion: "3.0" | "4.0";
  responses:
    | UniquenessProofResponseV3[]
    | UniquenessProofResponseV4[]
    | SessionResponseItem[];
}) {
  if (params.protocolVersion === "4.0") {
    const hasher = createHash("sha256");
    hasher.update(PROOF_INTEGRITY_V4_DOMAIN);
    hasher.update(parseNonceToFieldBytes(params.nonce));
    return hasher.digest();
  }

  const responses = params.responses as UniquenessProofResponseV3[];
  const hasher = createHash("sha256");
  hasher.update(PROOF_INTEGRITY_V3_DOMAIN);
  hasher.update(u32be(responses.length));

  for (const response of responses) {
    addLengthPrefixedString(hasher, response.proof);
  }

  return hasher.digest();
}

export function computeIntegritySignatureDigest(params: {
  payloadDigest: Uint8Array;
  timestamp: number;
}) {
  const hasher = createHash("sha256");
  hasher.update(i64be(params.timestamp));
  hasher.update(params.payloadDigest);
  return hasher.digest();
}

function jwksCacheKey(jwksUrl: string, kid: string) {
  const urlHash = createHash("sha256")
    .update(jwksUrl)
    .digest("hex")
    .slice(0, 16);
  return `integrity_jwks:v1:${urlHash}:${kid}`;
}

async function readCachedJwk(jwksUrl: string, kid: string) {
  const redis = global.RedisClient;
  if (!redis) {
    return null;
  }

  const cacheKey = jwksCacheKey(jwksUrl, kid);

  try {
    const cached = await redis.get(cacheKey);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as JWK;
  } catch (error) {
    logger.warn("Failed to read cached integrity JWK", {
      error: error instanceof Error ? error.message : String(error),
      kid,
    });
    return null;
  }
}

async function cacheJwks(jwksUrl: string, jwks: JWK[]) {
  const redis = global.RedisClient;
  if (!redis) {
    return;
  }

  await Promise.all(
    jwks.map(async (jwk) => {
      if (typeof jwk.kid !== "string" || jwk.kid.length === 0) {
        return;
      }

      try {
        await redis.set(
          jwksCacheKey(jwksUrl, jwk.kid),
          JSON.stringify(jwk),
          "EX",
          JWKS_CACHE_TTL_SECONDS,
        );
      } catch (error) {
        logger.warn("Failed to cache integrity JWK", {
          error: error instanceof Error ? error.message : String(error),
          kid: jwk.kid,
        });
      }
    }),
  );
}

async function fetchJwks(jwksUrl: string) {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JWKS_FETCH_TIMEOUT_MS);

  try {
    response = await fetch(jwksUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    throw new IntegrityBundleError(
      "jwks_fetch_failed",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new IntegrityBundleError("jwks_fetch_failed");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new IntegrityBundleError("invalid_jwks_response");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { keys?: unknown }).keys)
  ) {
    throw new IntegrityBundleError("invalid_jwks_response");
  }

  const keys = (body as { keys: unknown[] }).keys.filter(
    (key): key is JWK => typeof key === "object" && key !== null,
  );

  await cacheJwks(jwksUrl, keys);
  return keys;
}

async function getJwkForKid(params: {
  forceRefresh?: boolean;
  jwksUrl: string;
  kid: string;
}) {
  if (!params.forceRefresh) {
    const cached = await readCachedJwk(params.jwksUrl, params.kid);
    if (cached) {
      return { jwk: cached, fromCache: true };
    }
  }

  const jwks = await fetchJwks(params.jwksUrl);
  const jwk = jwks.find((candidate) => candidate.kid === params.kid);

  if (!jwk) {
    throw new IntegrityBundleError("jwk_not_found");
  }

  return { jwk, fromCache: false };
}

function decodeBase64UrlCoordinate(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new IntegrityBundleError("invalid_device_public_key");
  }

  const bytes = Buffer.from(value, "base64url");

  if (bytes.length === 0 || bytes.length > 32) {
    throw new IntegrityBundleError("invalid_device_public_key");
  }

  if (bytes.length === 32) {
    return bytes;
  }

  return Buffer.concat([Buffer.alloc(32 - bytes.length), bytes]);
}

function extractDevicePublicKey(payload: IntegrityTokenClaims) {
  const cnf = payload.cnf;
  if (typeof cnf !== "object" || cnf === null) {
    throw new IntegrityBundleError("missing_device_public_key");
  }

  const jwk = (cnf as { jwk?: unknown }).jwk;
  if (typeof jwk !== "object" || jwk === null) {
    throw new IntegrityBundleError("missing_device_public_key");
  }

  const { kty, crv, x, y } = jwk as Record<string, unknown>;
  if (kty !== "EC" || crv !== "P-256") {
    throw new IntegrityBundleError("invalid_device_public_key");
  }

  if (typeof x !== "string" || typeof y !== "string") {
    throw new IntegrityBundleError("invalid_device_public_key");
  }

  const publicKey = Buffer.concat([
    Buffer.from([0x04]),
    decodeBase64UrlCoordinate(x),
    decodeBase64UrlCoordinate(y),
  ]);

  try {
    p256.ProjectivePoint.fromHex(publicKey);
  } catch {
    throw new IntegrityBundleError("invalid_device_public_key");
  }

  return publicKey;
}

async function verifyJwtWithJwk(params: {
  expectedIssuer: string;
  integrityJwt: string;
  jwk: JWK;
  rpId: string;
}) {
  const publicKey = await importJWK(params.jwk, "ES256");
  const { payload } = await jwtVerify(params.integrityJwt, publicKey, {
    algorithms: ["ES256"],
    issuer: params.expectedIssuer,
    audience: params.rpId,
    requiredClaims: ["cnf", "exp", "platform", "pass"],
  });

  return payload as IntegrityTokenClaims;
}

function shouldRefreshJwksAfterJwtFailure(error: unknown) {
  return error instanceof JWSSignatureVerificationFailed;
}

async function verifyIntegrityToken(params: {
  environment?: IntegrityEnvironment;
  integrityJwt: string;
  rpId: string;
  signatureFormat: SignatureFormat;
}) {
  let protectedHeader: ReturnType<typeof decodeProtectedHeader>;
  try {
    protectedHeader = decodeProtectedHeader(params.integrityJwt);
  } catch {
    throw new IntegrityBundleError("invalid_integrity_token");
  }

  if (protectedHeader.alg !== "ES256") {
    throw new IntegrityBundleError("invalid_integrity_token_algorithm");
  }

  if (typeof protectedHeader.kid !== "string" || !protectedHeader.kid) {
    throw new IntegrityBundleError("missing_integrity_token_kid");
  }

  const attestationConfig = resolveIntegrityAttestationConfig(
    params.environment,
  );
  const jwksUrl = attestationConfig.jwksUrl;
  let keyResult = await getJwkForKid({
    jwksUrl,
    kid: protectedHeader.kid,
  });

  let payload: IntegrityTokenClaims;
  try {
    payload = await verifyJwtWithJwk({
      expectedIssuer: attestationConfig.issuer,
      integrityJwt: params.integrityJwt,
      jwk: keyResult.jwk,
      rpId: params.rpId,
    });
  } catch (error) {
    if (!keyResult.fromCache || !shouldRefreshJwksAfterJwtFailure(error)) {
      throw new IntegrityBundleError(
        "invalid_integrity_token",
        error instanceof Error ? error.message : String(error),
      );
    }

    keyResult = await getJwkForKid({
      forceRefresh: true,
      jwksUrl,
      kid: protectedHeader.kid,
    });

    try {
      payload = await verifyJwtWithJwk({
        expectedIssuer: attestationConfig.issuer,
        integrityJwt: params.integrityJwt,
        jwk: keyResult.jwk,
        rpId: params.rpId,
      });
    } catch (retryError) {
      throw new IntegrityBundleError(
        "invalid_integrity_token",
        retryError instanceof Error ? retryError.message : String(retryError),
      );
    }
  }

  if (payload.pass !== true) {
    throw new IntegrityBundleError("integrity_token_pass_failed");
  }

  if (payload.platform !== signatureFormatPlatform[params.signatureFormat]) {
    throw new IntegrityBundleError("signature_format_platform_mismatch");
  }

  return {
    devicePublicKey: extractDevicePublicKey(payload),
    platform: payload.platform as IntegrityPlatform,
  };
}

function verifyAndroidSignature(params: {
  devicePublicKey: Uint8Array;
  digest: Uint8Array;
  signatureHex: string;
}) {
  const signature = Buffer.from(params.signatureHex, "hex");
  const isValid = p256.verify(
    signature,
    params.digest,
    params.devicePublicKey,
    {
      lowS: false,
      prehash: false,
    },
  );

  if (!isValid) {
    throw new IntegrityBundleError("invalid_device_signature");
  }
}

function toBytes(value: unknown, field: string) {
  if (!(value instanceof Uint8Array)) {
    throw new IntegrityBundleError(`invalid_ios_assertion_${field}`);
  }

  if (value.length === 0) {
    throw new IntegrityBundleError(`invalid_ios_assertion_${field}`);
  }

  return value;
}

function verifyIOSSignature(params: {
  devicePublicKey: Uint8Array;
  digest: Uint8Array;
  signatureHex: string;
}) {
  let assertion: unknown;
  try {
    assertion = decodeCbor(Buffer.from(params.signatureHex, "hex"));
  } catch {
    throw new IntegrityBundleError("invalid_ios_assertion");
  }

  if (typeof assertion !== "object" || assertion === null) {
    throw new IntegrityBundleError("invalid_ios_assertion");
  }

  const signature = toBytes(
    (assertion as { signature?: unknown }).signature,
    "signature",
  );
  const authenticatorData = toBytes(
    (assertion as { authenticatorData?: unknown }).authenticatorData,
    "authenticator_data",
  );

  const nonce = sha256(Buffer.concat([authenticatorData, params.digest]));
  const signedDigest = sha256(nonce);

  const isValid = p256.verify(signature, signedDigest, params.devicePublicKey, {
    lowS: false,
    prehash: false,
  });

  if (!isValid) {
    throw new IntegrityBundleError("invalid_device_signature");
  }
}

export async function verifyIntegrityBundle(
  params: IntegrityVerificationParams,
): Promise<IntegrityVerificationResult> {
  try {
    const bundle = normalizeIntegrityBundle(params.integrityBundle);
    validateTimestamp(bundle.timestamp);

    const { devicePublicKey, platform } = await verifyIntegrityToken({
      environment: params.environment,
      integrityJwt: bundle.jwt,
      rpId: params.rpId,
      signatureFormat: bundle.signatureFormat,
    });

    const payloadDigest = computeProofIntegrityDigest({
      nonce: params.nonce,
      protocolVersion: params.protocolVersion,
      responses: params.responses,
    });
    const signatureDigest = computeIntegritySignatureDigest({
      payloadDigest,
      timestamp: bundle.timestamp,
    });

    if (platform === "android") {
      verifyAndroidSignature({
        devicePublicKey,
        digest: signatureDigest,
        signatureHex: bundle.signatureHex,
      });
    } else {
      verifyIOSSignature({
        devicePublicKey,
        digest: signatureDigest,
        signatureHex: bundle.signatureHex,
      });
    }

    return { success: true };
  } catch (error) {
    const reason =
      error instanceof IntegrityBundleError
        ? error.reason
        : "internal_integrity_error";

    logger.warn("Integrity bundle verification failed", {
      error: error instanceof Error ? error.message : String(error),
      environment: params.environment ?? DEFAULT_INTEGRITY_ENVIRONMENT,
      reason,
      protocol_version: params.protocolVersion,
      rp_id: params.rpId,
    });

    return { success: false, reason };
  }
}
