import { POST } from "@/api/v2/verify";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { NextRequest } from "next/server";
import { semaphoreProofParamsMock } from "../__mocks__/proof.mock";

// #region Mocks
const FetchAppAction = jest.fn();
const AtomicUpsertNullifier = jest.fn();

jest.mock(
  "../../../api/v2/verify/graphql/fetch-app-action.generated",
  jest.fn(() => ({
    getSdk: () => ({
      FetchAppAction,
    }),
  })),
);

jest.mock(
  "../../../api/v2/verify/graphql/atomic-upsert-nullifier.generated",
  jest.fn(() => ({
    getSdk: () => ({
      AtomicUpsertNullifier,
    }),
  })),
);

jest.mock("../../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../../../services/posthogClient", () => ({
  captureEvent: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn(() => Promise.resolve({})),
    ok: true,
    status: 200,
  }),
) as jest.Mock;

const mockFetch = (params: {
  body: Record<string, any>;
  ok: boolean;
  status: number;
  text?: string;
}) => {
  (fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      json: jest.fn(() => Promise.resolve(params.body)),
      text: jest.fn(() => Promise.resolve(params.text ?? "")),
      ok: params.ok,
      status: params.status,
    }),
  );
};
// #endregion

// #region Test data
const getUrl = (app_id: string) =>
  new URL(`/api/v2/verify/${app_id}`, "http://localhost:3000");

const validBody = {
  ...semaphoreProofParamsMock,
  signal: undefined,
  action: "verify",
};

const createMockRequest = (
  url: URL | RequestInfo,
  body: Record<string, any>,
) => {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

const stagingAppId = "app_staging_112233445566778";
const stagingActionId = "action_staging_112233445566778";

const validNullifier = {
  uses: 0,
  nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
  created_at: "2023-08-12T20:00:00.000Z",
};

const validAction = {
  id: stagingActionId,
  action: "verify",
  max_verifications: 0,
  external_nullifier:
    "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
  status: "active",
  nullifiers: [validNullifier],
};

const validApp = {
  id: stagingAppId,
  is_staging: true,
  engine: "cloud",
  actions: [validAction],
};

const validOnchainApp = {
  id: stagingAppId,
  is_staging: true,
  engine: "onchain",
};

afterEach(() => {
  jest.resetAllMocks();
});
// #endregion

// #region Success cases
describe("/api/v2/verify", () => {
  it("can verify proof", async () => {
    const mockReq = createMockRequest(getUrl(stagingAppId), validBody);
    const ctx = { params: { app_id: stagingAppId } };

    const fetchAppResponse = {
      app: [
        {
          ...validApp,
          actions: [{ ...validAction, nullifiers: [] }],
        },
      ],
    };

    // NOTE: mock for the fetch in verifyProof
    mockFetch({
      body: { valid: true },
      ok: true,
      status: 200,
    });

    FetchAppAction.mockResolvedValue(fetchAppResponse);

    AtomicUpsertNullifier.mockResolvedValue({
      update_nullifier: {
        affected_rows: 1,
        returning: [
          {
            nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
            created_at: validNullifier.created_at,
            uses: 1,
          },
        ],
      },
    });

    const response = await POST(mockReq, ctx);
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      success: true,
      uses: 1,
      message: "Proof verified successfully",
      action: validBody.action,
      created_at: validNullifier.created_at,
      max_uses: 0,
      verification_level: VerificationLevel.Orb,
      nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
    });
  });

  it("can verify onchain action", async () => {
    const mockReq = createMockRequest(getUrl(stagingAppId), validBody);
    const ctx = { params: { app_id: stagingAppId } };

    const fetchAppResponse = {
      app: [
        {
          ...validOnchainApp,
          actions: [{ ...validAction, nullifiers: [] }],
        },
      ],
    };

    // NOTE: mock for the fetch in verifyProof
    mockFetch({
      body: { valid: true },
      ok: true,
      status: 200,
    });

    FetchAppAction.mockResolvedValue(fetchAppResponse);

    AtomicUpsertNullifier.mockResolvedValue({
      update_nullifier: {
        affected_rows: 1,
        returning: [
          {
            nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
            created_at: validNullifier.created_at,
            uses: 1,
          },
        ],
      },
    });

    const response = await POST(mockReq, ctx);
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      success: true,
      uses: 1,
      message: "This action runs on-chain and shouldn't be verified here.",
      action: validBody.action,
      created_at: validNullifier.created_at,
      max_uses: 0,
      verification_level: VerificationLevel.Orb,
      nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
    });
  });

  it("can verify without a signal", async () => {
    const mockReq = createMockRequest(getUrl(stagingAppId), {
      ...validBody,
      signal_hash: undefined,
    });

    const ctx = { params: { app_id: stagingAppId } };

    const fetchAppResponse = {
      app: [
        {
          ...validApp,
          actions: [{ ...validAction, nullifiers: [] }],
        },
      ],
    };

    FetchAppAction.mockResolvedValue(fetchAppResponse);

    // NOTE: mock for the fetch in verifyProof
    mockFetch({
      body: { valid: true },
      ok: true,
      status: 200,
    });

    AtomicUpsertNullifier.mockResolvedValue({
      update_nullifier: {
        affected_rows: 1,
        returning: [
          {
            nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
            created_at: validNullifier.created_at,
            uses: 1,
          },
        ],
      },
    });

    const response = await POST(mockReq, ctx);
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      success: true,
      uses: 1,
      action: validBody.action,
      message: "Proof verified successfully",
      created_at: validNullifier.created_at,
      max_uses: 0,
      verification_level: VerificationLevel.Orb,
      nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
    });
  });

  it("sets default value if signal_hash is not provided", async () => {
    // NOTE: We are assuming that default flow will finish successfully if default value is provided instead of undefined

    const mockReq = createMockRequest(getUrl(stagingAppId), {
      ...validBody,
      signal_hash: undefined,
    });

    const ctx = { params: { app_id: stagingAppId } };

    const fetchAppResponse = {
      app: [
        {
          ...validApp,
          actions: [{ ...validAction, nullifiers: [] }],
        },
      ],
    };

    FetchAppAction.mockResolvedValue(fetchAppResponse);

    // NOTE: mock for the fetch in verifyProof
    mockFetch({
      body: { valid: true },
      ok: true,
      status: 200,
    });

    AtomicUpsertNullifier.mockResolvedValue({
      update_nullifier: {
        affected_rows: 1,
        returning: [
          {
            nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
            created_at: validNullifier.created_at,
            uses: 1,
          },
        ],
      },
    });

    const response = await POST(mockReq, ctx);
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      success: true,
      uses: 1,
      message: "Proof verified successfully",
      action: validBody.action,
      created_at: validNullifier.created_at,
      max_uses: 0,
      verification_level: VerificationLevel.Orb,
      nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
    });
  });
});
// #endregion

// #endregion
