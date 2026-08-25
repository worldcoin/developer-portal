import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetSandboxRequestIosForProcessing = jest.fn();
const UpdateSandboxRequestIosStatus = jest.fn();
const addSandboxBetaTester = jest.fn();
const removeSandboxBetaTester = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClientForUser: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/app-store-connect/beta-tester-handler", () => ({
  addSandboxBetaTester: (...args: unknown[]) => addSandboxBetaTester(...args),
  removeSandboxBetaTester: (...args: unknown[]) =>
    removeSandboxBetaTester(...args),
}));

jest.mock(
  "../../../api/admin/sandbox-requests-ios/[id]/status/graphql/get-sandbox-request-ios-for-processing.generated",
  () => ({
    getSdk: () => ({ GetSandboxRequestIosForProcessing }),
  }),
);

jest.mock(
  "../../../api/admin/sandbox-requests-ios/[id]/status/graphql/update-sandbox-request-ios-status.generated",
  () => ({
    getSdk: () => ({ UpdateSandboxRequestIosStatus }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/sandbox-requests-ios/[id]/status";

// #region Test Data
type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revoking"
  | "revoked";

const REQUEST_ID = "sbx_req_abc123";
const TESTER_EMAIL = "tester@example.com";
const admin = {
  email: "admin@example.com",
  role: "internal_dashboard_readonly",
  subject: "admin-subject",
};

const createRequest = (body: unknown = { status: "approved" }) =>
  new NextRequest(
    `http://localhost/api/admin/sandbox-requests-ios/${REQUEST_ID}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

const createContext = (id = REQUEST_ID) => ({
  params: Promise.resolve({ id }),
});

const dbRequest = (status: RequestStatus) => ({
  sandbox_access_request_ios_by_pk: {
    asc_email: TESTER_EMAIL,
    status,
  },
});

const mockRequestStatuses = (...statuses: RequestStatus[]) => {
  GetSandboxRequestIosForProcessing.mockReset();
  statuses.forEach((status) =>
    GetSandboxRequestIosForProcessing.mockResolvedValueOnce(dbRequest(status)),
  );
  GetSandboxRequestIosForProcessing.mockResolvedValue(
    dbRequest(statuses.at(-1) ?? "pending"),
  );
};

// The handler ignores the mutation response, so the mock only needs to resolve.
const mockTransitions = () => {
  UpdateSandboxRequestIosStatus.mockReset();
  UpdateSandboxRequestIosStatus.mockResolvedValue({
    update_sandbox_access_request_ios: { affected_rows: 1 },
  });
};

const appStoreError = (status?: number) =>
  Object.assign(new Error("App Store Connect failed"), {
    name: "AppStoreConnectRequestError",
    status,
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  authenticateAdminRequest.mockResolvedValue(admin);
  mockRequestStatuses("pending");
  mockTransitions();
  addSandboxBetaTester.mockResolvedValue(undefined);
  removeSandboxBetaTester.mockResolvedValue(undefined);
});

// #region Authentication and input validation
describe("POST /api/admin/sandbox-requests-ios/[id]/status [validation]", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("rejects invalid ids and statuses", async () => {
    const invalidId = await POST(
      createRequest(),
      createContext("sbxreq_abc123"),
    );
    const invalidStatus = await POST(
      createRequest({ status: "pending" }),
      createContext(),
    );

    expect(invalidId.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region State transitions
describe("POST /api/admin/sandbox-requests-ios/[id]/status [transitions]", () => {
  it("enrolls before approving and records the approval time", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: true,
      status: "approved",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      set: {
        status: "approved",
        approved_at: expect.any(String),
      },
    });
    const approvedAt =
      UpdateSandboxRequestIosStatus.mock.calls[0][0].set.approved_at;
    expect(Number.isNaN(Date.parse(approvedAt))).toBe(false);
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    );
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(1);
  });

  it("rejects in Hasura only and stores a sanitized optional reason", async () => {
    mockRequestStatuses("pending");

    const response = await POST(
      createRequest({
        status: "rejected",
        reason: `  Wrong${String.fromCharCode(0)}Apple account  `,
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      set: {
        status: "rejected",
        rejection_reason: "Wrong Apple account",
      },
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(1);
  });

  it("stores a long rejection reason now that the length cap is removed", async () => {
    mockRequestStatuses("pending");
    const longReason = "x".repeat(1000);

    const response = await POST(
      createRequest({ status: "rejected", reason: longReason }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      set: {
        status: "rejected",
        rejection_reason: longReason,
      },
    });
  });

  it("removes from Apple, then records the revocation time", async () => {
    mockRequestStatuses("approved");

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: true,
      status: "revoked",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      set: {
        status: "revoked",
        revoked_at: expect.any(String),
      },
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    );
  });

  it("rejects transitions from an incompatible terminal state", async () => {
    mockRequestStatuses("rejected");

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(400);
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Idempotency
describe("POST /api/admin/sandbox-requests-ios/[id]/status [idempotency]", () => {
  it("re-ensures Apple for an already-approved request", async () => {
    mockRequestStatuses("approved");

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "approved",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(1);
  });

  it("re-ensures Apple removal for an already-revoked request", async () => {
    mockRequestStatuses("revoked");

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "revoked",
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("resumes a revoking request left by the previous implementation", async () => {
    mockRequestStatuses("revoking");

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: true,
      status: "revoked",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      set: {
        status: "revoked",
        revoked_at: expect.any(String),
      },
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("treats a missing request as an idempotent success", async () => {
    GetSandboxRequestIosForProcessing.mockReset().mockResolvedValue({
      sandbox_access_request_ios_by_pk: null,
    });

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: null,
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Stage-specific failures
describe("POST /api/admin/sandbox-requests-ios/[id]/status [failures]", () => {
  it("identifies an initial Hasura lookup failure", async () => {
    GetSandboxRequestIosForProcessing.mockReset().mockRejectedValue(
      new Error("Hasura unavailable"),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "status_check",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
  });

  it("does not persist approval when enrollment fails", async () => {
    addSandboxBetaTester.mockRejectedValue(appStoreError(503));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
    });
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("reports a portal failure after TestFlight enrollment", async () => {
    UpdateSandboxRequestIosStatus.mockReset().mockRejectedValue(
      new Error("Hasura down"),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "portal_status_update",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("returns 503 and leaves the row unchanged when Apple removal fails", async () => {
    mockRequestStatuses("approved");
    removeSandboxBetaTester.mockRejectedValue(appStoreError(503));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
    });
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("reports a finalization failure after Apple removal", async () => {
    mockRequestStatuses("approved");
    UpdateSandboxRequestIosStatus.mockReset().mockRejectedValue(
      new Error("Hasura unavailable"),
    );

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "revocation_finalize",
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });
});
// #endregion
