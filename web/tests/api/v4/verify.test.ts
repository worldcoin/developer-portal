import { POST } from "@/api/v4/verify";
import { NextRequest, NextResponse } from "next/server";

// #region Mocks
const mockResolveRpRegistration = jest.fn();
const mockVerifyIntegrityBundle = jest.fn();
const mockHandleUniquenessProofVerification = jest.fn();
const mockHandleSessionProofVerification = jest.fn();
const mockVerifyApiKey = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../api/helpers/rp-utils", () => ({
  RpRegistrationStatus: { Registered: "registered" },
  resolveRpRegistration: (...args: unknown[]) =>
    mockResolveRpRegistration(...args),
}));

jest.mock("../../../api/helpers/auth/verify-api-key", () => ({
  verifyApiKey: (...args: unknown[]) => mockVerifyApiKey(...args),
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
  identifier: "face",
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

const apiKey = "api_YTpi";

const createRequest = (
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) =>
  new NextRequest(new URL(`/api/v4/verify/${appId}`, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
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
  mockHandleUniquenessProofVerification.mockResolvedValue(
    NextResponse.json({ success: true }),
  );
  mockHandleSessionProofVerification.mockResolvedValue(
    NextResponse.json({ success: true }),
  );
  mockVerifyApiKey.mockResolvedValue({ success: true, teamId: "team_1" });
});

// #region Integrity bundle environment
describe("/api/v4/verify [integrity bundle]", () => {
  it('normalizes "sandbox" only for integrity verification', async () => {
    const req = createRequest(
      {
        protocol_version: "4.0",
        nonce: "1",
        action: "verify",
        environment: "sandbox",
        integrity_bundle: integrityBundle,
        responses: [v4Response],
      },
      { authorization: `Bearer ${apiKey}` },
    );

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockVerifyIntegrityBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: "staging",
        integrityBundle,
        nonce: "1",
        protocolVersion: "4.0",
        rpId,
      }),
    );
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalledWith(
      expect.anything(),
      rpId,
      appId,
      expect.objectContaining({ environment: "sandbox" }),
      req,
    );
    expect(mockHandleSessionProofVerification).not.toHaveBeenCalled();
    expect(mockVerifyApiKey).toHaveBeenCalledWith({ req, appId });
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

// #region Staging environment access
describe("/api/v4/verify [staging environment]", () => {
  it("refuses a staging verification from an unauthenticated caller", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      environment: "staging",
      integrity_bundle: integrityBundle,
      responses: [v4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      code: "environment_not_allowed",
      attribute: "environment",
    });
    expect(mockVerifyApiKey).not.toHaveBeenCalled();
    expect(mockVerifyIntegrityBundle).not.toHaveBeenCalled();
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });

  it("refuses a sandbox verification when the API key is not valid for the app", async () => {
    mockVerifyApiKey.mockResolvedValue({
      success: false,
      errorResponse: NextResponse.json(
        { code: "invalid_app", detail: "API key is not valid for this app." },
        { status: 403 },
      ),
    });

    const req = createRequest(
      {
        protocol_version: "4.0",
        nonce: "1",
        action: "verify",
        environment: "sandbox",
        responses: [v4Response],
      },
      { authorization: `Bearer ${apiKey}` },
    );

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_app" });
    expect(mockHandleUniquenessProofVerification).not.toHaveBeenCalled();
  });

  it("refuses a staging session proof from an unauthenticated caller", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      session_id: "session_1",
      environment: "staging",
      responses: [
        {
          identifier: "face",
          signal_hash: "0x0",
          issuer_schema_id: 1,
          session_nullifier: ["0x1", "0x2"],
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      code: "environment_not_allowed",
    });
    expect(mockHandleSessionProofVerification).not.toHaveBeenCalled();
  });

  it("verifies a session proof in staging for an authenticated developer", async () => {
    const req = createRequest(
      {
        protocol_version: "4.0",
        nonce: "1",
        session_id: "session_1",
        environment: "staging",
        responses: [
          {
            identifier: "face",
            signal_hash: "0x0",
            issuer_schema_id: 1,
            session_nullifier: ["0x1", "0x2"],
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      },
      { authorization: `Bearer ${apiKey}` },
    );

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockVerifyApiKey).toHaveBeenCalledWith({ req, appId });
    expect(mockHandleSessionProofVerification).toHaveBeenCalledWith(
      rpId,
      appId,
      expect.objectContaining({ environment: "staging" }),
    );
  });

  it("leaves production verification unauthenticated", async () => {
    const req = createRequest({
      protocol_version: "4.0",
      nonce: "1",
      action: "verify",
      responses: [v4Response],
    });

    const res = await POST(req, { params: Promise.resolve({ app_id: appId }) });

    expect(res.status).toBe(200);
    expect(mockVerifyApiKey).not.toHaveBeenCalled();
    expect(mockHandleUniquenessProofVerification).toHaveBeenCalled();
  });
});
// #endregion
