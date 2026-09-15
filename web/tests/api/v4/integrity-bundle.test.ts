import {
  computeIntegritySignatureDigest,
  computeProofIntegrityDigest,
  normalizeIntegrityBundle,
  verifyIntegrityBundle,
} from "@/api/v4/verify/integrity-bundle";
import { logger } from "@/lib/logger";
import { p256 } from "@noble/curves/p256";
import { encode as encodeCbor } from "cbor-x";
import { createHash, generateKeyPairSync, KeyObject } from "crypto";
import { JWK, SignJWT } from "jose";

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const RP_ID = "rp_test_123";
const AG_KID = "ag-test-key";
const PRODUCTION_ISSUER = "attestation.worldcoin.org";
const PRODUCTION_JWKS_URL =
  "https://attestation.worldcoin.org/.well-known/jwks.json";
const STAGING_ISSUER = "attestation.worldcoin.dev";
const STAGING_JWKS_URL =
  "https://attestation.worldcoin.dev/.well-known/jwks.json";

type DeviceKey = {
  privateKey: Uint8Array;
  publicJwk: JWK;
};

type AgKey = {
  privateKey: KeyObject;
  publicJwk: JWK;
};

const response = {
  identifier: "face",
  signal_hash: "0x0",
  issuer_schema_id: "1",
  nullifier: "0x2",
  expires_at_min: "1772584197",
  proof: ["0x1", "0x2", "0x3", "0x4", "0x5"] as [
    string,
    string,
    string,
    string,
    string,
  ],
};

const selfieResponse = {
  ...response,
  identifier: "selfie",
  issuer_schema_id: "11",
  sybil_score: 10,
};

const { nullifier: _nullifier, ...sessionResponseFields } = selfieResponse;
const selfieSessionResponse = {
  ...sessionResponseFields,
  session_nullifier: ["0x3", `0x02${"0".repeat(61)}4`] as [string, string],
};

function createAgKey(): AgKey {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const publicJwk = publicKey.export({ format: "jwk" }) as JWK;
  publicJwk.alg = "ES256";
  publicJwk.kid = AG_KID;
  publicJwk.use = "sig";

  return { privateKey, publicJwk };
}

function createDeviceKey(): DeviceKey {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey, false);

  return {
    privateKey,
    publicJwk: {
      kty: "EC",
      crv: "P-256",
      x: Buffer.from(publicKey.slice(1, 33)).toString("base64url"),
      y: Buffer.from(publicKey.slice(33, 65)).toString("base64url"),
    },
  };
}

async function createIntegrityJwt(params: {
  agPrivateKey: KeyObject;
  rpId: string;
  devicePublicJwk: JWK;
  expirationTime?: number | string | Date;
  issuer?: string;
  pass?: boolean;
  platform: "android" | "ios";
}) {
  return await new SignJWT({
    pass: params.pass ?? true,
    platform: params.platform,
    cnf: {
      jwk: params.devicePublicJwk,
    },
  })
    .setProtectedHeader({ alg: "ES256", kid: AG_KID })
    .setIssuer(params.issuer ?? PRODUCTION_ISSUER)
    .setAudience(params.rpId)
    .setIssuedAt()
    .setExpirationTime(params.expirationTime ?? "5m")
    .sign(params.agPrivateKey);
}

async function createBundle(params?: {
  agKey?: AgKey;
  issuer?: string;
  rpId?: string;
  jwtExpirationTime?: number | string | Date;
  jwtPlatform?: "android" | "ios";
  pass?: boolean;
  signedNonce?: string;
  signedTimestamp?: number;
  signatureFormat?: "android_keystore" | "apple_app_attest";
  timestamp?: number;
  version?: 1 | 2;
  signedResponses?:
    | (typeof response)[]
    | (typeof selfieResponse)[]
    | (typeof selfieSessionResponse)[];
  signedDigest?: Buffer;
}) {
  const agKey = params?.agKey ?? createAgKey();
  const deviceKey = createDeviceKey();
  const nonce = params?.signedNonce ?? "0x01";
  const platform = params?.jwtPlatform ?? "android";
  const signatureFormat =
    params?.signatureFormat ??
    (platform === "ios" ? "apple_app_attest" : "android_keystore");

  const integrityJwt = await createIntegrityJwt({
    agPrivateKey: agKey.privateKey,
    rpId: params?.rpId ?? RP_ID,
    devicePublicJwk: deviceKey.publicJwk,
    expirationTime: params?.jwtExpirationTime,
    issuer: params?.issuer,
    pass: params?.pass,
    platform,
  });

  const digest =
    params?.signedDigest ??
    computeProofIntegrityDigest({
      integrityBundleVersion: params?.version,
      nonce,
      protocolVersion: "4.0",
      responses: params?.signedResponses ?? [response],
    });
  const timestamp = params?.timestamp ?? Math.floor(Date.now() / 1000);
  const signatureDigest = computeIntegritySignatureDigest({
    payloadDigest: digest,
    timestamp: params?.signedTimestamp ?? timestamp,
  });

  let signatureHex: string;
  if (signatureFormat === "apple_app_attest") {
    const authenticatorData = Buffer.from("test-authenticator-data");
    const assertionNonce = createHash("sha256")
      .update(Buffer.concat([authenticatorData, signatureDigest]))
      .digest();
    const signedDigest = createHash("sha256").update(assertionNonce).digest();
    const signature = p256.sign(signedDigest, deviceKey.privateKey, {
      lowS: false,
      prehash: false,
    });
    const assertion = encodeCbor({
      signature: Buffer.from(signature.toDERRawBytes()),
      authenticatorData,
    });
    signatureHex = Buffer.from(assertion).toString("hex");
  } else {
    const signature = p256.sign(signatureDigest, deviceKey.privateKey, {
      lowS: false,
      prehash: false,
    });
    signatureHex = Buffer.from(signature.toDERRawBytes()).toString("hex");
  }

  const integrityBundle = {
    version: params?.version ?? 1,
    signature_format: signatureFormat,
    timestamp,
    signature: signatureHex,
    jwt: integrityJwt,
  } as const;

  return {
    agPublicJwk: agKey.publicJwk,
    integrityBundle,
    nonce,
  };
}

describe("integrity bundle verification", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (global.RedisClient as any)?.flushall?.();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes a structured integrity bundle", () => {
    const parsed = normalizeIntegrityBundle({
      version: 1,
      signature_format: "android_keystore",
      timestamp: 1772638272,
      signature: "abcd",
      jwt: "aaa.bbb.ccc==",
    });

    expect(parsed).toMatchObject({
      version: 1,
      signatureFormat: "android_keystore",
      timestamp: 1772638272,
      signatureHex: "abcd",
      jwt: "aaa.bbb.ccc==",
    });
  });

  it("verifies a version 2 bundle over the Self Check sybil_score", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      version: 2,
      signedResponses: [selfieResponse],
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [selfieResponse],
      rpId: RP_ID,
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects a changed Self Check sybil_score in a version 2 bundle", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      version: 2,
      signedResponses: [selfieResponse],
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [{ ...selfieResponse, sybil_score: 11 }],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_device_signature",
    });
  });

  // #region Oxide v2 proof bindings
  // Golden vector from worldcoin/oxide#1217, commit 81f00010:
  // test_v4_claims_digest_binds_both_session_fields.
  const oxideNonce =
    "0x0173a589d3c9521737a63bb59a9839d9ff0aaf129b91ce4d6e28077bba919e91";
  const oxideSessionDigest =
    "7eb811a459b760caa1896abff47795f995ec0cfb6f8499d2bc91b3e09cbf8698";

  it("matches Oxide's session golden vector", () => {
    expect(
      computeProofIntegrityDigest({
        integrityBundleVersion: 2,
        nonce: oxideNonce,
        protocolVersion: "4.0",
        responses: [selfieSessionResponse],
      }).toString("hex"),
    ).toBe(oxideSessionDigest);
  });

  it.each(["android", "ios"] as const)(
    "verifies the Oxide session digest on %s and rejects changed bindings",
    async (platform) => {
      const { agPublicJwk, integrityBundle, nonce } = await createBundle({
        version: 2,
        jwtPlatform: platform,
        signedNonce: oxideNonce,
        signedDigest: Buffer.from(oxideSessionDigest, "hex"),
      });
      jest
        .spyOn(global, "fetch")
        .mockImplementation(
          async () => new Response(JSON.stringify({ keys: [agPublicJwk] })),
        );
      const params = {
        integrityBundle,
        nonce,
        protocolVersion: "4.0" as const,
        rpId: RP_ID,
      };

      await expect(
        verifyIntegrityBundle({
          ...params,
          responses: [selfieSessionResponse],
        }),
      ).resolves.toEqual({ success: true });

      for (const session_nullifier of [
        ["0x4", selfieSessionResponse.session_nullifier[1]],
        ["0x3", `0x02${"0".repeat(61)}5`],
      ] as [string, string][]) {
        await expect(
          verifyIntegrityBundle({
            ...params,
            responses: [{ ...selfieSessionResponse, session_nullifier }],
          }),
        ).resolves.toEqual({
          success: false,
          reason: "invalid_device_signature",
        });
      }

      await expect(
        verifyIntegrityBundle({
          ...params,
          responses: [{ ...selfieResponse, nullifier: "0x3" }],
        }),
      ).resolves.toEqual({
        success: false,
        reason: "invalid_device_signature",
      });
    },
  );

  it.each([selfieResponse, response])(
    "binds the $identifier uniqueness nullifier, including items without claims",
    async (item) => {
      const { agPublicJwk, integrityBundle, nonce } = await createBundle({
        version: 2,
        signedResponses: [item],
      });
      jest
        .spyOn(global, "fetch")
        .mockImplementation(
          async () => new Response(JSON.stringify({ keys: [agPublicJwk] })),
        );
      const params = {
        integrityBundle,
        nonce,
        protocolVersion: "4.0" as const,
        rpId: RP_ID,
      };
      await expect(
        verifyIntegrityBundle({ ...params, responses: [item] }),
      ).resolves.toEqual({ success: true });
      await expect(
        verifyIntegrityBundle({
          ...params,
          responses: [{ ...item, nullifier: "0x3" }],
        }),
      ).resolves.toEqual({
        success: false,
        reason: "invalid_device_signature",
      });
    },
  );

  it("binds every item in response order", async () => {
    const items = [selfieResponse, response];
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      version: 2,
      signedResponses: items,
    });
    jest
      .spyOn(global, "fetch")
      .mockImplementation(
        async () => new Response(JSON.stringify({ keys: [agPublicJwk] })),
      );
    const params = {
      integrityBundle,
      nonce,
      protocolVersion: "4.0" as const,
      rpId: RP_ID,
    };
    await expect(
      verifyIntegrityBundle({ ...params, responses: items }),
    ).resolves.toEqual({ success: true });
    for (const responses of [
      [response, selfieResponse],
      [selfieResponse],
      [selfieResponse, { ...response, nullifier: "0x3" }],
    ]) {
      await expect(
        verifyIntegrityBundle({ ...params, responses }),
      ).resolves.toEqual({
        success: false,
        reason: "invalid_device_signature",
      });
    }
  });

  it.each([false, true])(
    "rejects the previous v2 encoding (nullifier included as a claim: %s)",
    async (includeNullifier) => {
      const field = (value: number) =>
        Buffer.from(value.toString(16).padStart(64, "0"), "hex");
      const signedDigest = createHash("sha256")
        .update("worldcoin/proof-integrity/v4")
        .update(field(1))
        .update(Buffer.from("00000001", "hex"))
        .update(Buffer.from(includeNullifier ? "00000002" : "00000001", "hex"))
        .update(includeNullifier ? field(2) : Buffer.alloc(0))
        .update(field(10))
        .digest();
      const { agPublicJwk, integrityBundle, nonce } = await createBundle({
        version: 2,
        signedDigest,
      });
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify({ keys: [agPublicJwk] })),
        );
      await expect(
        verifyIntegrityBundle({
          integrityBundle,
          nonce,
          protocolVersion: "4.0",
          responses: [selfieResponse],
          rpId: RP_ID,
        }),
      ).resolves.toEqual({
        success: false,
        reason: "invalid_device_signature",
      });
    },
  );
  // #endregion

  it("verifies an android integrity bundle and caches the AG JWK", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle();
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const firstResult = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });
    const secondResult = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(firstResult).toEqual({ success: true });
    expect(secondResult).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(PRODUCTION_JWKS_URL);
  });

  it("does not refresh cached AG JWKs for expired integrity tokens", async () => {
    const agKey = createAgKey();
    const validBundle = await createBundle({ agKey });
    const expiredBundle = await createBundle({
      agKey,
      jwtExpirationTime: Math.floor(Date.now() / 1000) - 60,
    });
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agKey.publicJwk] }), {
        status: 200,
      }),
    );

    const firstResult = await verifyIntegrityBundle({
      integrityBundle: validBundle.integrityBundle,
      nonce: validBundle.nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });
    const expiredResult = await verifyIntegrityBundle({
      integrityBundle: expiredBundle.integrityBundle,
      nonce: expiredBundle.nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(firstResult).toEqual({ success: true });
    expect(expiredResult).toEqual({
      success: false,
      reason: "invalid_integrity_token",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("verifies an iOS App Attest assertion bundle", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      jwtPlatform: "ios",
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({ success: true });
  });

  it("uses the staging issuer and JWKS URL for staging requests", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      issuer: STAGING_ISSUER,
    });
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      environment: "staging",
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({ success: true });
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(STAGING_JWKS_URL);
  });

  it("defaults to the production issuer when environment is omitted", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      issuer: STAGING_ISSUER,
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_integrity_token",
    });
  });

  it("rejects a signature over a different nonce", async () => {
    const { agPublicJwk, integrityBundle } = await createBundle({
      signedNonce: "0x01",
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce: "0x02",
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_device_signature",
    });
  });

  it("rejects a client signature format that disagrees with JWT platform", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      jwtPlatform: "ios",
      signatureFormat: "android_keystore",
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "signature_format_platform_mismatch",
    });
  });

  it("rejects integrity tokens with pass=false", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      pass: false,
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "integrity_token_pass_failed",
    });
  });

  it("rejects bundles when the timestamp was not signed", async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 60;
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      signedTimestamp: timestamp,
      timestamp: timestamp + 1,
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_device_signature",
    });
  });

  it("logs and rejects integrity tokens with an unexpected audience", async () => {
    const { agPublicJwk, integrityBundle, nonce } = await createBundle({
      rpId: "unexpected-audience",
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [agPublicJwk] }), {
        status: 200,
      }),
    );

    const result = await verifyIntegrityBundle({
      integrityBundle,
      nonce,
      protocolVersion: "4.0",
      responses: [response],
      rpId: RP_ID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_integrity_token",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "Integrity bundle verification failed",
      expect.objectContaining({
        error: expect.stringContaining('unexpected "aud" claim value'),
        reason: "invalid_integrity_token",
        rp_id: RP_ID,
      }),
    );
  });
});
