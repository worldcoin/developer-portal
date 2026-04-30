import {
  computeProofIntegrityDigest,
  parseIntegrityBundle,
  verifyIntegrityBundle,
} from "@/api/v4/verify/integrity-bundle";
import { p256 } from "@noble/curves/p256";
import { encode as encodeCbor } from "cbor-x";
import { createHash, generateKeyPairSync, KeyObject } from "crypto";
import { JWK, SignJWT } from "jose";

const RP_ID = "rp_test_123";
const AG_KID = "ag-test-key";
const JWKS_URL = "https://attestation.example/.well-known/jwks.json";
const ISSUER = "attestation.worldcoin.org";

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
  audience?: string;
  devicePublicJwk: JWK;
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
    .setIssuer(ISSUER)
    .setAudience(params.audience ?? RP_ID)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(params.agPrivateKey);
}

async function createBundle(params?: {
  jwtPlatform?: "android" | "ios";
  pass?: boolean;
  signedNonce?: string;
  signatureFormat?: "android_keystore" | "apple_app_attest";
}) {
  const agKey = createAgKey();
  const deviceKey = createDeviceKey();
  const nonce = params?.signedNonce ?? "0x01";
  const platform = params?.jwtPlatform ?? "android";
  const signatureFormat =
    params?.signatureFormat ??
    (platform === "ios" ? "apple_app_attest" : "android_keystore");

  const integrityJwt = await createIntegrityJwt({
    agPrivateKey: agKey.privateKey,
    devicePublicJwk: deviceKey.publicJwk,
    pass: params?.pass,
    platform,
  });

  const digest = computeProofIntegrityDigest({
    nonce,
    protocolVersion: "4.0",
    responses: [response],
  });

  let signatureHex: string;
  if (signatureFormat === "apple_app_attest") {
    const authenticatorData = Buffer.from("test-authenticator-data");
    const assertionNonce = createHash("sha256")
      .update(Buffer.concat([authenticatorData, digest]))
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
    const signature = p256.sign(digest, deviceKey.privateKey, {
      lowS: false,
      prehash: false,
    });
    signatureHex = Buffer.from(signature.toDERRawBytes()).toString("hex");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const integrityBundle = `v=1,sf=${signatureFormat},t=${timestamp},s=${signatureHex},jwt=${integrityJwt}`;

  return {
    agPublicJwk: agKey.publicJwk,
    integrityBundle,
    nonce,
  };
}

describe("integrity bundle verification", () => {
  beforeEach(async () => {
    process.env.INTEGRITY_BUNDLE_JWKS_URL = JWKS_URL;
    process.env.INTEGRITY_BUNDLE_EXPECTED_ISSUER = ISSUER;
    await (global.RedisClient as any)?.flushall?.();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.INTEGRITY_BUNDLE_JWKS_URL;
    delete process.env.INTEGRITY_BUNDLE_EXPECTED_ISSUER;
  });

  it("parses a bundle with jwt padding-safe key splitting", () => {
    const parsed = parseIntegrityBundle(
      "v=1,sf=android_keystore,t=1772638272,s=abcd,jwt=aaa.bbb.ccc==",
    );

    expect(parsed).toMatchObject({
      version: "1",
      signatureFormat: "android_keystore",
      timestamp: 1772638272,
      signatureHex: "abcd",
      jwt: "aaa.bbb.ccc==",
    });
  });

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
});
