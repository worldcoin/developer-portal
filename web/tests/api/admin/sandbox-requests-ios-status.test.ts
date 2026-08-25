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

const transitionResult = (status: RequestStatus, affectedRows = 1) => ({
  update_sandbox_access_request_ios: {
    affected_rows: affectedRows,
    returning: affectedRows ? [{ status }] : [],
  },
});

const mockTransitions = (...statuses: RequestStatus[]) => {
  UpdateSandboxRequestIosStatus.mockReset();
  statuses.forEach((status) =>
    UpdateSandboxRequestIosStatus.mockResolvedValueOnce(
      transitionResult(status),
    ),
  );
  UpdateSandboxRequestIosStatus.mockResolvedValue(
    transitionResult(statuses.at(-1) ?? "approved"),
  );
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
  mockRequestStatuses("pending", "approved");
  mockTransitions("approved");
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

  it("rejects invalid ids, statuses, and oversized rejection reasons", async () => {
    const invalidId = await POST(
      createRequest(),
      createContext("sbxreq_abc123"),
    );
    const invalidStatus = await POST(
      createRequest({ status: "pending" }),
      createContext(),
    );
    const invalidReason = await POST(
      createRequest({ status: "rejected", reason: "x".repeat(501) }),
      createContext(),
    );

    expect(invalidId.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(invalidReason.status).toBe(400);
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
      from_status: "pending",
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
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(2);
  });

  it("rejects in Hasura only and stores a sanitized optional reason", async () => {
    mockRequestStatuses("pending", "rejected");
    mockTransitions("rejected");

    const response = await POST(
      createRequest({
        status: "rejected",
        reason: "  Wrong\u0000Apple account  ",
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "pending",
      set: {
        status: "rejected",
        rejection_reason: "Wrong Apple account",
      },
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(2);
  });

  it("locks, removes from Apple, then records the revocation time", async () => {
    mockRequestStatuses("approved", "revoked");
    mockTransitions("revoking", "revoked");

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
    expect(UpdateSandboxRequestIosStatus).toHaveBeenNthCalledWith(1, {
      id: REQUEST_ID,
      from_status: "approved",
      set: { status: "revoking" },
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenNthCalledWith(2, {
      id: REQUEST_ID,
      from_status: "revoking",
      set: {
        status: "revoked",
        revoked_at: expect.any(String),
      },
    });
    expect(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(removeSandboxBetaTester.mock.invocationCallOrder[0]);
    expect(removeSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[1],
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

// #region Idempotency and races
describe("POST /api/admin/sandbox-requests-ios/[id]/status [concurrency]", () => {
  it("repairs an already-approved request and rechecks its status", async () => {
    mockRequestStatuses("approved", "approved");

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "approved",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(2);
  });

  it("undoes a stale approval when revocation starts concurrently", async () => {
    mockRequestStatuses("approved", "revoking", "revoking");

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "revoking",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      removeSandboxBetaTester.mock.invocationCallOrder[0],
    );
  });

  it("reconciles Apple when rejection wins the approval CAS", async () => {
    mockRequestStatuses("pending", "rejected", "rejected");
    UpdateSandboxRequestIosStatus.mockReset().mockResolvedValue(
      transitionResult("pending", 0),
    );

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "rejected",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("resumes a revoking request after an interrupted attempt", async () => {
    mockRequestStatuses("revoking", "revoked");
    mockTransitions("revoked");

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "revoking",
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

    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "portal_status_update",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("rolls a confirmed Apple removal failure back to approved", async () => {
    mockRequestStatuses("approved");
    mockTransitions("revoking", "approved");
    removeSandboxBetaTester.mockRejectedValue(appStoreError(403));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
      status: "approved",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenNthCalledWith(2, {
      id: REQUEST_ID,
      from_status: "revoking",
      set: { status: "approved" },
    });
  });

  it("keeps an ambiguous Apple failure retryable as revoking", async () => {
    mockRequestStatuses("approved");
    mockTransitions("revoking");
    removeSandboxBetaTester.mockRejectedValue(appStoreError(503));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
      status: "revoking",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
  });

  it("reports finalization failure after Apple removal", async () => {
    mockRequestStatuses("approved");
    UpdateSandboxRequestIosStatus.mockReset().mockResolvedValueOnce(
      transitionResult("revoking"),
    );
    UpdateSandboxRequestIosStatus.mockRejectedValueOnce(
      new Error("Hasura unavailable"),
    );

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "revocation_finalize",
      status: "revoking",
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("reports a failed post-change status check", async () => {
    GetSandboxRequestIosForProcessing.mockReset()
      .mockResolvedValueOnce(dbRequest("pending"))
      .mockRejectedValueOnce(new Error("Hasura recheck failed"));

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "status_recheck",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalled();
  });
});
// #endregion
