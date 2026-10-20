import { POST } from "@/api/v4/verify";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// #region Mocks
const mockResolveRpRegistration = jest.fn();
const mockVerifyIntegrityBundle = jest.fn();
const mockGenerateRpIdString = jest.fn();
const mockHandleUniquenessProofVerification = jest.fn();
const mockHandleSessionProofVerification = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../api/helpers/rp-utils", () => ({
  generateRpIdString: (...args: unknown[]) => mockGenerateRpIdString(...args),
  RpRegistrationStatus: { Registered: "registered" },
  resolveRpRegistration: (...args: unknown[]) =>
    mockResolveRpRegistration(...args),
}));

jest.mock("../../../api/v4/verify/integrity-bundle", () => ({
  INTEGRITY_VERIFICATION_ERROR_CODE: "integrity_verification_failed",
  verifyIntegrityBundle: (...args: unknown[]) =>
    mockVerifyIntegrityBundle(...args),
}));

jest.mock("../../../api/v4/verify/uniqueness-proof/handler", () => ({
  handleUniquenessProofVerification: (...args: unknown[]) =>
    mockHandleUniquenessProofVerification(...args),
}));

jest.mock("../../../api/v4/verify/session-proof/handler", () => ({
  handleSessionProofVerification: (...args: unknown[]) =>
    mockHandleSessionProofVerification(...args),
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const rpId = "rp_0123456789abcdef";

const integrityBundle = {
  version: 1,
  signature_format: "android_keystore",
  timestamp: 1772638272,
  signature: "abcd",
  jwt: "aaa.bbb.ccc",
};

const v4Response = {
  identifier: "proof_of_human",
  signal_hash: "0x0",
  issuer_schema_id: 1,
  nullifier: "0x2",
  expires_at_min: 1772584197,
  proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
};

const selfieCheckV4Response = {
  ...v4Response,
  identifier: "selfie",
  issuer_schema_id: 11,
  sybil_score: 10,
};

const v3Response = {
  identifier: "orb",
  merkle_root: "0x01",
  nullifier: "0x02",
  proof: "0x03",
};

const createRequest = (body: Record<string, unknown>) =>
  new NextRequest(new URL(`/api/v4/verify/${appId}`, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveRpRegistration.mockResolvedValue({
    success: true,
    registration: {
      app_id: appId,
      rp_id: rpId,
      status: "registered",
      app: {
        status: "active",
        is_archived: false,
        deleted_at: null,
      },
    },
  });
  mockVerifyIntegrityBundle.mockResolvedValue({ success: true });
  mockGenerateRpIdString.mockReturnValue("rp_legacy00000001");
  mockHandleUniquenessProofVerification.mockResolvedValue(
    NextResponse.json({ success: true }),
  );
});

// #region Sandbox verification diagnostics
describe("/api/v4/verify [Sandbox diagnostics]", () => {
  const originalEnabled = process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED;

  beforeEach(() => {
    process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED = "true";
  });

  afterEach(() => {
    if (originalEnabled === undefined)
      delete process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED;
    else process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED = originalEnabled;
  });

  const sandboxRequest = () =>
    createRequest({
      protocol_version: "4.0",
      nonce: "private-nonce",
      action: "verify",
      environment: "sandbox",
      responses: [
        { ...v4Response, proof: ["secret-proof", "a", "b", "c", "d"] },
      ],
    });

  it("records a successful attempt without proof or nonce values", async () => {
    const response = await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: appId }),
    });

    expect(response.status).toBe(200);
    expect(logger.info).toHaveBeenCalledWith(
      "Sandbox verification diagnostic",
      expect.objectContaining({
        app_or_rp_id: appId,
        request: expect.objectContaining({
          action: "verify",
          proof_count: 1,
          credential_types: ["proof_of_human"],
        }),
        response: expect.objectContaining({ status: 200 }),
      }),
    );
    const diagnostic = JSON.stringify((logger.info as jest.Mock).mock.calls);
    expect(diagnostic).not.toContain("private-nonce");
    expect(diagnostic).not.toContain("secret-proof");
  });

  it("records the failure stage and public error code", async () => {
    mockHandleUniquenessProofVerification.mockResolvedValue(
      NextResponse.json(
        { success: false, code: "all_verifications_failed" },
        { status: 400 },
      ),
    );

    await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: appId }),
    });

    expect(logger.info).toHaveBeenCalledWith(
      "Sandbox verification diagnostic",
      expect.objectContaining({
        response: expect.objectContaining({
          status: 400,
          code: "all_verifications_failed",
          failure_stage: "uniqueness_verification",
        }),
      }),
    );
  });

  it("attributes a missing Self Check integrity bundle to its guard", async () => {
    const response = await POST(
      createRequest({
        protocol_version: "4.0",
        nonce: "private-nonce",
        action: "verify",
        environment: "sandbox",
        responses: [selfieCheckV4Response],
      }),
      { params: Promise.resolve({ app_id: appId }) },
    );

    expect(response.status).toBe(403);
    expect(logger.info).toHaveBeenCalledWith(
      "Sandbox verification diagnostic",
      expect.objectContaining({
        response: expect.objectContaining({
          failure_stage: "selfie_integrity_requirement",
        }),
      }),
    );
  });

  it("records bounded per-proof outcomes without private result fields", async () => {
    mockHandleUniquenessProofVerification.mockResolvedValue(
      NextResponse.json({
        success: true,
        results: [
          {
            identifier: "proof_of_human",
            success: false,
            code: "verification_error",
            detail: "private-detail",
            nullifier: "private-nullifier",
          },
          ...Array.from({ length: 9 }, () => ({
            identifier: "selfie",
            success: true,
            nullifier: "private-nullifier",
          })),
          {
            identifier: "selfie",
            success: false,
            code: "environment_mismatch",
            detail: "private-detail",
          },
        ],
      }),
    );

    await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: appId }),
    });

    const summary = (logger.info as jest.Mock).mock.calls[0][1].response;
    expect(summary.success).toBe(true);
    expect(summary.result_count).toBe(11);
    expect(summary.failed_result_count).toBe(2);
    expect(summary.results).toHaveLength(10);
    expect(summary.results[0]).toEqual({
      identifier: "proof_of_human",
      success: false,
      code: "verification_error",
    });
    expect(JSON.stringify(summary)).not.toContain("private-detail");
    expect(JSON.stringify(summary)).not.toContain("private-nullifier");
  });

  it("does not enable diagnostics from the request environment alone", async () => {
    delete process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED;
    await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: appId }),
    });
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("leaves malformed Sandbox requests to standard error telemetry", async () => {
    const response = await POST(
      createRequest({ environment: "sandbox", responses: [] }),
      { params: Promise.resolve({ app_id: appId }) },
    );
    expect(response.status).toBe(400);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("logs Sandbox requests for other integrations", async () => {
    await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: rpId }),
    });
    expect(logger.info).toHaveBeenCalledWith(
      "Sandbox verification diagnostic",
      expect.objectContaining({ app_or_rp_id: rpId }),
    );
  });

  it("does not log an untrusted route ID", async () => {
    const untrustedId = "sensitive-id-" + "x".repeat(100);
    await POST(sandboxRequest(), {
      params: Promise.resolve({ app_id: untrustedId }),
    });
    const diagnostic = JSON.stringify((logger.info as jest.Mock).mock.calls);
    expect(diagnostic).not.toContain(untrustedId);
    expect(logger.info).toHaveBeenCalledWith(
      "Sandbox verification diagnostic",
      expect.objectContaining({ app_or_rp_id: undefined }),
    );
  });

  it.each(["staging", "production"])(
    "does not log a %s request",
    async (environment) => {
      await POST(
        createRequest({
          protocol_version: "4.0",
          nonce: "private-nonce",
          action: "verify",
          environment,
          responses: [v4Response],
        }),
        { params: Promise.resolve({ app_id: appId }) },
      );
      expect(logger.info).not.toHaveBeenCalled();
    },
  );

  it("preserves the verifier result when diagnostic logging fails", async () => {
    (logger.info as jest.Mock).mockRejectedValueOnce(new Error("log outage"));
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    try {
      const response = await POST(sandboxRequest(), {
        params: Promise.resolve({ app_id: appId }),
      });
      expect(response.status).toBe(200);
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to emit Sandbox verification diagnostic",
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
// #endregion

// #region Uniqueness nullifier width
describe("/api/v4/verify [uniqueness nullifier width]", () => {
  it.each(["3.0", "4.0"] as const)(
    "accepts a 32-byte %s nullifier and rejects an appended byte before verification",
    async (protocolVersion) => {
      const validNullifier = `0x08${"00".repeat(31)}`;
      const response = protocolVersion === "3.0" ? v3Response : v4Response;
      const body = {
        protocol_version: protocolVersion,
        nonce: "1",
        action: "verify",
        responses: [{ ...response, nullifier: validNullifier }],
      };

      const valid = await POST(createRequest(body), {
        params: Promise.resolve({ app_id: appId }),
      });

      expect(valid.status).toBe(200);
      expect(mockHandleUniquenessProofVerification).toHaveBeenCalledTimes(1);

      const overWidth = await POST(
        createRequest({
          ...body,
          responses: [{ ...response, nullifier: `${validNullifier}00` }],
        }),
        { params: Promise.resolve({ app_id: appId }) },
      );

      expect(overWidth.status).toBe(400);
      await expect(overWidth.json()).resolves.toMatchObject({
        code: "validation_error",
      });
      expect(mockHandleUniquenessProofVerification).toHaveBeenCalledTimes(1);
    },
  );
});
// #endregion

// #region Integrity bundle environment
describe("/api/v4/verify [integrity bundle]", () => {
  it('uses the sandbox attestation issuer for "sandbox"', async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      environment: "sandbox",
      integrity_bundle: integrityBundle,
      responses: [v4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockVerifyIntegrityBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: "sandbox",
        integrityBundle,
        nonce: "1",
        protocolVersion: "4.0",
        rpId,
      }),
    );
    expect(
      mockVerifyIntegrityBundle.mock.calls[0][0].legacyRpId,
    ).toBeUndefined();
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalledWith(
      expect.anything(),
      rpId,
      appId,
      expect.objectContaining({ environment: "sandbox" }),
      req,
    );
    expect(mockHandleSessionProofVerification).not.toHaveBeenCalled();
  });

  it("adds the server-derived legacy audience for protocol 3.0", async () => {
    const req = createRequest({
      protocol_version: "3.0",
      nonce: "1",
      action: "verify",
      integrity_bundle: integrityBundle,
      responses: [v3Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockGenerateRpIdString).toHaveBeenCalledWith(appId);
    expect(mockVerifyIntegrityBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        legacyRpId: "rp_legacy00000001",
        protocolVersion: "3.0",
        rpId,
      }),
    );
  });

  it("rejects Self Check 4.0 responses without an integrity bundle", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      responses: [selfieCheckV4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      code: "integrity_verification_failed",
      attribute: "integrity_bundle",
    });
    expect(mockVerifyIntegrityBundle).not.toHaveBeenCalled();
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });

  it("rejects Self Check 4.0 responses with an integrity version 1 bundle", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      integrity_bundle: integrityBundle,
      responses: [selfieCheckV4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(403);
    expect(mockVerifyIntegrityBundle).not.toHaveBeenCalled();
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });

  it("verifies Self Check 4.0 responses with an integrity version 2 bundle", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      integrity_bundle: { ...integrityBundle, version: 2 },
      responses: [selfieCheckV4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockVerifyIntegrityBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        integrityBundle: { ...integrityBundle, version: 2 },
        responses: [selfieCheckV4Response],
      }),
    );
  });
});
// #endregion

// #region Staging verification
// The request selects the proof environment without a separate window or token.
describe("/api/v4/verify [staging environment]", () => {
  const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    mockHandleSessionProofVerification.mockResolvedValue(
      NextResponse.json({ success: true }),
    );
  });

  afterEach(() => {
    if (originalAppEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
    }
  });

  it("accepts a staging uniqueness proof without a window or token", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      environment: "staging",
      responses: [v4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalledWith(
      expect.anything(),
      rpId,
      appId,
      expect.objectContaining({ environment: "staging" }),
      req,
    );
    expect(mockHandleSessionProofVerification).not.toHaveBeenCalled();
  });

  it("accepts a staging session proof without a window or token", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      session_id: "session_1",
      environment: "staging",
      responses: [
        {
          identifier: "proof_of_human",
          signal_hash: "0x0",
          issuer_schema_id: 1,
          session_nullifier: ["0x1", "0x2"],
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockHandleSessionProofVerification).toHaveBeenCalledWith(
      rpId,
      appId,
      expect.objectContaining({ environment: "staging" }),
    );
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Protocol version floor
describe("/api/v4/verify [min_protocol_version]", () => {
  it("rejects a 3.0 proof when the relying party requires 4.0", async () => {
    const req = createRequest({
      protocol_version: "3.0",
      min_protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      responses: [v3Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "protocol_version_not_allowed",
      attribute: "protocol_version",
    });
    // The floor is enforced before any verification work is done.
    expect(mockResolveRpRegistration).not.toHaveBeenCalled();
    expect(mockVerifyIntegrityBundle).not.toHaveBeenCalled();
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });

  it("accepts a 3.0 proof when the relying party still allows 3.0", async () => {
    const req = createRequest({
      protocol_version: "3.0",
      min_protocol_version: "3.0",
      nonce: "1",
      action: "verify",
      responses: [v3Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalledWith(
      expect.anything(),
      rpId,
      appId,
      expect.objectContaining({ protocol_version: "3.0" }),
      req,
    );
  });

  it("accepts a 3.0 proof when no floor is declared", async () => {
    const req = createRequest({
      protocol_version: "3.0",
      nonce: "1",
      action: "verify",
      responses: [v3Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalled();
  });

  it("accepts a 4.0 proof when the relying party requires 4.0", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      min_protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      responses: [v4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalledWith(
      expect.anything(),
      rpId,
      appId,
      expect.objectContaining({ protocol_version: "4.0" }),
      req,
    );
  });
});
// #endregion
