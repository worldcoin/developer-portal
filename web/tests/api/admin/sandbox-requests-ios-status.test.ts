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
const REQUEST_ID = "sbx_req_abc123";
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
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  authenticateAdminRequest.mockResolvedValue(admin);
  GetSandboxRequestIosForProcessing.mockResolvedValue({
    sandbox_access_request_ios_by_pk: {
      asc_email: "tester@example.com",
      status: "pending",
    },
  });
  addSandboxBetaTester.mockResolvedValue(undefined);
  removeSandboxBetaTester.mockResolvedValue(undefined);
  UpdateSandboxRequestIosStatus.mockResolvedValue({
    update_sandbox_access_request_ios: {
      affected_rows: 1,
      returning: [{ status: "approved", updated_at: "2026-08-21T00:00:00Z" }],
    },
  });
});

// #region POST /api/admin/sandbox-requests-ios/[id]/status
describe("POST /api/admin/sandbox-requests-ios/[id]/status", () => {
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
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

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
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    );
  });

  it("removes the tester before rejecting a pending request", async () => {
    UpdateSandboxRequestIosStatus.mockResolvedValue({
      update_sandbox_access_request_ios: {
        affected_rows: 1,
        returning: [{ status: "rejected", updated_at: "2026-08-21T00:00:00Z" }],
      },
    });

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
    expect(removeSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "pending",
      status: "rejected",
    });
  });

  it("removes the tester before revoking an approved request", async () => {
    GetSandboxRequestIosForProcessing.mockResolvedValue({
      sandbox_access_request_ios_by_pk: {
        asc_email: "tester@example.com",
        status: "approved",
      },
    });
    UpdateSandboxRequestIosStatus.mockResolvedValue({
      update_sandbox_access_request_ios: {
        affected_rows: 1,
        returning: [{ status: "rejected", updated_at: "2026-08-21T00:00:00Z" }],
      },
    });

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
    expect(removeSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from_status: "approved",
      status: "rejected",
    });
    expect(removeSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      UpdateSandboxRequestIosStatus.mock.invocationCallOrder[0],
    );
  });

  it("rejects approving an already-rejected request", async () => {
    GetSandboxRequestIosForProcessing.mockResolvedValue({
      sandbox_access_request_ios_by_pk: {
        asc_email: "tester@example.com",
        status: "rejected",
      },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Unsupported status transition",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("repairs Apple state for an already-final request", async () => {
    GetSandboxRequestIosForProcessing.mockResolvedValue({
      sandbox_access_request_ios_by_pk: {
        asc_email: "tester@example.com",
        status: "approved",
      },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(addSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("treats a missing request as an idempotent success", async () => {
    GetSandboxRequestIosForProcessing.mockResolvedValue({
      sandbox_access_request_ios_by_pk: null,
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("reconciles Apple to the final status when another admin wins the race", async () => {
    GetSandboxRequestIosForProcessing.mockResolvedValueOnce({
      sandbox_access_request_ios_by_pk: {
        asc_email: "tester@example.com",
        status: "pending",
      },
    }).mockResolvedValueOnce({
      sandbox_access_request_ios_by_pk: {
        asc_email: "tester@example.com",
        status: "rejected",
      },
    });
    UpdateSandboxRequestIosStatus.mockResolvedValue({
      update_sandbox_access_request_ios: { affected_rows: 0, returning: [] },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(addSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
    expect(removeSandboxBetaTester).toHaveBeenCalledWith("tester@example.com");
  });

  it("returns 503 and leaves the request pending when enrollment fails", async () => {
    addSandboxBetaTester.mockRejectedValue(new Error("Apple unavailable"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
    });
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("returns 503 without contacting Apple when the request lookup fails", async () => {
    GetSandboxRequestIosForProcessing.mockRejectedValue(
      new Error("Hasura unavailable"),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(UpdateSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("returns 503 when Hasura fails", async () => {
    UpdateSandboxRequestIosStatus.mockRejectedValue(new Error("hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
    });
  });
});
// #endregion
