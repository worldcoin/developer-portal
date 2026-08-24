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
type RequestStatus = "pending" | "approved" | "rejected" | "revoked";

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

const mockSuccessfulUpdate = (status: Exclude<RequestStatus, "pending">) => {
  UpdateSandboxRequestIosStatus.mockResolvedValue({
    update_sandbox_access_request_ios: {
      affected_rows: 1,
      returning: [
        {
          status,
          updated_at: "2026-08-21T00:00:00Z",
          revoked_at: status === "revoked" ? "2026-08-24T22:00:00.000Z" : null,
          revoked_by: status === "revoked" ? admin.subject : null,
        },
      ],
    },
  });
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  authenticateAdminRequest.mockResolvedValue(admin);
  mockRequestStatuses("pending", "approved");
  addSandboxBetaTester.mockResolvedValue(undefined);
  removeSandboxBetaTester.mockResolvedValue(undefined);
  mockSuccessfulUpdate("approved");
});

// #region Authentication and input validation
describe("POST /api/admin/sandbox-requests-ios/[id]/status [validation]", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid iOS sandbox request id", async () => {
    const response = await POST(
      createRequest(),
      createContext("sbxreq_abc123"),
    );

    expect(response.status).toBe(400);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("rejects a non-final status", async () => {
    const response = await POST(
      createRequest({ status: "pending" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Status must be approved, rejected, or revoked",
    });
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region State transitions
describe("POST /api/admin/sandbox-requests-ios/[id]/status [transitions]", () => {
  it("enrolls the tester before approving a pending request", async () => {
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
      status: "approved",
      revoked_at: null,
      revoked_by: null,
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    );
  });

  it("persists a pending rejection before ensuring the tester is absent", async () => {
    mockRequestStatuses("pending", "rejected");
    mockSuccessfulUpdate("rejected");

    const response = await POST(
      createRequest({ status: "rejected" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: true,
      status: "rejected",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "pending",
      status: "rejected",
      revoked_at: null,
      revoked_by: null,
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(removeSandboxBetaTester.mock.invocationCallOrder[0]);
  });

  it("revokes an approved request and records who revoked it and when", async () => {
    mockRequestStatuses("approved", "revoked");
    mockSuccessfulUpdate("revoked");

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
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "approved",
      status: "revoked",
      revoked_at: expect.any(String),
      revoked_by: admin.subject,
    });
    const updateVariables = UpdateSandboxRequestIosStatus.mock.calls[0][0];
    expect(Number.isNaN(Date.parse(updateVariables.revoked_at))).toBe(false);
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(removeSandboxBetaTester.mock.invocationCallOrder[0]);
  });

  it("rejects transitions out of a terminal rejected request", async () => {
    mockRequestStatuses("rejected");

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Unsupported status transition",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("does not treat rejecting an approved request as revocation", async () => {
    mockRequestStatuses("approved");

    const response = await POST(
      createRequest({ status: "rejected" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Idempotency and races
describe("POST /api/admin/sandbox-requests-ios/[id]/status [concurrency]", () => {
  it("repairs TestFlight for an already-approved request and rechecks status", async () => {
    mockRequestStatuses("approved", "approved");

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "approved",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(2);
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("undoes a stale approval repair when a concurrent revocation wins", async () => {
    mockRequestStatuses("approved", "revoked");

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "revoked",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      removeSandboxBetaTester.mock.invocationCallOrder[0],
    );
  });

  it("reconciles TestFlight to the final status when another admin wins the CAS", async () => {
    mockRequestStatuses("pending", "revoked", "revoked");
    UpdateSandboxRequestIosStatus.mockResolvedValue({
      update_sandbox_access_request_ios: { affected_rows: 0, returning: [] },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "revoked",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(3);
  });

  it("treats a missing request as an idempotent success", async () => {
    GetSandboxRequestIosForProcessing.mockReset().mockResolvedValue({
      sandbox_access_request_ios_by_pk: null,
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: null,
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
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
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("identifies enrollment failure before approval is persisted", async () => {
    addSandboxBetaTester.mockRejectedValue(new Error("Apple unavailable"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
    });
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("identifies a portal update failure after TestFlight enrollment", async () => {
    UpdateSandboxRequestIosStatus.mockRejectedValue(new Error("Hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "portal_status_update",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("identifies a failed final status recheck", async () => {
    GetSandboxRequestIosForProcessing.mockReset()
      .mockResolvedValueOnce(dbRequest("pending"))
      .mockRejectedValueOnce(new Error("Hasura recheck failed"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "status_recheck",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalled();
  });

  it("identifies ASC removal failure after revocation was persisted", async () => {
    mockRequestStatuses("approved");
    mockSuccessfulUpdate("revoked");
    removeSandboxBetaTester.mockRejectedValue(new Error("Apple unavailable"));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_reconciliation",
    });
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "approved",
      status: "revoked",
      revoked_at: expect.any(String),
      revoked_by: admin.subject,
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });
});
// #endregion
