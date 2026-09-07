import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetSandboxRequestIosForProcessing = jest.fn();
const TransitionSandboxRequestIosStatus = jest.fn();
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
    getSdk: () => ({ TransitionSandboxRequestIosStatus }),
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
  | "approving"
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

const transitionResult = (status: RequestStatus, affectedRows = 1) => ({
  update_sandbox_access_request_ios: {
    affected_rows: affectedRows,
    returning: affectedRows === 1 ? [{ asc_email: TESTER_EMAIL, status }] : [],
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

const mockTransitions = () => {
  TransitionSandboxRequestIosStatus.mockReset().mockImplementation(
    ({ set }: { set: { status: RequestStatus } }) =>
      Promise.resolve(transitionResult(set.status)),
  );
};

const mockTransitionConflict = () => {
  TransitionSandboxRequestIosStatus.mockReset().mockResolvedValue(
    transitionResult("pending", 0),
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
    expect(TransitionSandboxRequestIosStatus).not.toHaveBeenCalled();
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
    expect(TransitionSandboxRequestIosStatus).not.toHaveBeenCalled();
  });

  it("accepts 500 rejection characters and rejects 501", async () => {
    const acceptedReason = "x".repeat(500);
    const accepted = await POST(
      createRequest({ status: "rejected", reason: acceptedReason }),
      createContext(),
    );

    expect(accepted.status).toBe(200);
    expect(TransitionSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from: "pending",
      set: { status: "rejected", rejection_reason: acceptedReason },
    });

    TransitionSandboxRequestIosStatus.mockClear();
    const rejected = await POST(
      createRequest({ status: "rejected", reason: "x".repeat(501) }),
      createContext(),
    );

    expect(rejected.status).toBe(400);
    expect(TransitionSandboxRequestIosStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region State transitions
describe("POST /api/admin/sandbox-requests-ios/[id]/status [transitions]", () => {
  it("claims approval before Apple and finalizes it afterward", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      changed: true,
      status: "approved",
    });
    expect(TransitionSandboxRequestIosStatus).toHaveBeenNthCalledWith(1, {
      id: REQUEST_ID,
      from: "pending",
      set: { status: "approving" },
    });
    expect(TransitionSandboxRequestIosStatus).toHaveBeenNthCalledWith(2, {
      id: REQUEST_ID,
      from: "approving",
      set: {
        status: "approved",
        approved_at: expect.any(String),
      },
    });
    const approvedAt =
      TransitionSandboxRequestIosStatus.mock.calls[1][0].set.approved_at;
    expect(Number.isNaN(Date.parse(approvedAt))).toBe(false);
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(
      TransitionSandboxRequestIosStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(addSandboxBetaTester.mock.invocationCallOrder[0]);
    expect(addSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      TransitionSandboxRequestIosStatus.mock.invocationCallOrder[1],
    );
    expect(GetSandboxRequestIosForProcessing).not.toHaveBeenCalled();
  });

  it("rejects atomically and stores a sanitized optional reason", async () => {
    const response = await POST(
      createRequest({
        status: "rejected",
        reason: `  Wrong${String.fromCharCode(0)}Apple account  `,
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(TransitionSandboxRequestIosStatus).toHaveBeenCalledWith({
      id: REQUEST_ID,
      from: "pending",
      set: {
        status: "rejected",
        rejection_reason: "Wrong Apple account",
      },
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).not.toHaveBeenCalled();
  });

  it("claims revocation before Apple and finalizes it afterward", async () => {
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
    expect(TransitionSandboxRequestIosStatus).toHaveBeenNthCalledWith(1, {
      id: REQUEST_ID,
      from: "approved",
      set: { status: "revoking" },
    });
    expect(TransitionSandboxRequestIosStatus).toHaveBeenNthCalledWith(2, {
      id: REQUEST_ID,
      from: "revoking",
      set: {
        status: "revoked",
        revoked_at: expect.any(String),
      },
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
    expect(
      TransitionSandboxRequestIosStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(removeSandboxBetaTester.mock.invocationCallOrder[0]);
    expect(removeSandboxBetaTester.mock.invocationCallOrder[0]).toBeLessThan(
      TransitionSandboxRequestIosStatus.mock.invocationCallOrder[1],
    );
  });

  it("returns the current state when a terminal transition loses its claim", async () => {
    mockTransitionConflict();
    mockRequestStatuses("rejected");

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Unsupported status transition",
      status: "rejected",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Concurrency and recovery
describe("POST /api/admin/sandbox-requests-ios/[id]/status [concurrency]", () => {
  it("prevents rejection while an approval owns the processing state", async () => {
    let storedStatus: RequestStatus = "pending";
    let releaseApple!: () => void;
    let signalAppleStarted!: () => void;
    const appleStarted = new Promise<void>((resolve) => {
      signalAppleStarted = resolve;
    });
    const appleReleased = new Promise<void>((resolve) => {
      releaseApple = resolve;
    });

    TransitionSandboxRequestIosStatus.mockImplementation(
      ({
        from,
        set,
      }: {
        from: RequestStatus;
        set: { status: RequestStatus };
      }) => {
        if (storedStatus !== from) {
          return Promise.resolve(transitionResult(storedStatus, 0));
        }
        storedStatus = set.status;
        return Promise.resolve(transitionResult(storedStatus));
      },
    );
    GetSandboxRequestIosForProcessing.mockReset().mockImplementation(() =>
      Promise.resolve(dbRequest(storedStatus)),
    );
    addSandboxBetaTester.mockImplementation(async () => {
      signalAppleStarted();
      await appleReleased;
    });

    const approvalPromise = POST(createRequest(), createContext());
    await appleStarted;

    const rejection = await POST(
      createRequest({ status: "rejected", reason: "Wrong account" }),
      createContext(),
    );

    expect(rejection.status).toBe(409);
    expect(await rejection.json()).toEqual({
      error: "Unsupported status transition",
      status: "approving",
    });
    expect(storedStatus).toBe("approving");

    releaseApple();
    const approval = await approvalPromise;

    expect(approval.status).toBe(200);
    expect(storedStatus).toBe("approved");
  });

  it("resumes an approval left in approving after an Apple failure", async () => {
    let storedStatus: RequestStatus = "pending";
    TransitionSandboxRequestIosStatus.mockImplementation(
      ({
        from,
        set,
      }: {
        from: RequestStatus;
        set: { status: RequestStatus };
      }) => {
        if (storedStatus !== from) {
          return Promise.resolve(transitionResult(storedStatus, 0));
        }
        storedStatus = set.status;
        return Promise.resolve(transitionResult(storedStatus));
      },
    );
    GetSandboxRequestIosForProcessing.mockReset().mockImplementation(() =>
      Promise.resolve(dbRequest(storedStatus)),
    );
    addSandboxBetaTester.mockRejectedValueOnce(appStoreError(503));

    const failed = await POST(createRequest(), createContext());

    expect(failed.status).toBe(503);
    expect(await failed.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
      status: "approving",
    });
    expect(storedStatus).toBe("approving");

    const retried = await POST(createRequest(), createContext());

    expect(retried.status).toBe(200);
    expect(storedStatus).toBe("approved");
    expect(addSandboxBetaTester).toHaveBeenCalledTimes(2);
  });
});
// #endregion

// #region Idempotency
describe("POST /api/admin/sandbox-requests-ios/[id]/status [idempotency]", () => {
  it("does not call Apple again for an already-approved request", async () => {
    mockTransitionConflict();
    mockRequestStatuses("approved");

    const response = await POST(createRequest(), createContext());

    expect(await response.json()).toEqual({
      success: true,
      changed: false,
      status: "approved",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
    expect(GetSandboxRequestIosForProcessing).toHaveBeenCalledTimes(1);
  });

  it("does not call Apple again for an already-revoked request", async () => {
    mockTransitionConflict();
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
    expect(removeSandboxBetaTester).not.toHaveBeenCalled();
  });

  it("resumes a revoking request", async () => {
    TransitionSandboxRequestIosStatus.mockReset()
      .mockResolvedValueOnce(transitionResult("approved", 0))
      .mockResolvedValueOnce(transitionResult("revoked"));
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
    expect(TransitionSandboxRequestIosStatus).toHaveBeenNthCalledWith(2, {
      id: REQUEST_ID,
      from: "revoking",
      set: {
        status: "revoked",
        revoked_at: expect.any(String),
      },
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("treats a missing request as an idempotent success", async () => {
    mockTransitionConflict();
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
  });
});
// #endregion

// #region Stage-specific failures
describe("POST /api/admin/sandbox-requests-ios/[id]/status [failures]", () => {
  it("identifies an approval-claim failure", async () => {
    TransitionSandboxRequestIosStatus.mockRejectedValue(
      new Error("Hasura unavailable"),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "approval_claim",
    });
    expect(addSandboxBetaTester).not.toHaveBeenCalled();
  });

  it("identifies a status read failure after a lost claim", async () => {
    mockTransitionConflict();
    GetSandboxRequestIosForProcessing.mockReset().mockRejectedValue(
      new Error("Hasura unavailable"),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "status_check",
    });
  });

  it("leaves approval recoverable when enrollment fails", async () => {
    addSandboxBetaTester.mockRejectedValue(appStoreError(503));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
      status: "approving",
    });
    expect(TransitionSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
  });

  it("reports an approval-finalization failure after enrollment", async () => {
    TransitionSandboxRequestIosStatus.mockReset()
      .mockResolvedValueOnce(transitionResult("approving"))
      .mockRejectedValueOnce(new Error("Hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "approval_finalize",
      status: "approving",
    });
    expect(addSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });

  it("leaves revocation recoverable when Apple removal fails", async () => {
    removeSandboxBetaTester.mockRejectedValue(appStoreError(503));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "testflight_update",
      status: "revoking",
    });
    expect(TransitionSandboxRequestIosStatus).toHaveBeenCalledTimes(1);
  });

  it("reports a revocation-finalization failure after Apple removal", async () => {
    TransitionSandboxRequestIosStatus.mockReset()
      .mockResolvedValueOnce(transitionResult("revoking"))
      .mockRejectedValueOnce(new Error("Hasura unavailable"));

    const response = await POST(
      createRequest({ status: "revoked" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update iOS sandbox request",
      failureStage: "revocation_finalize",
      status: "revoking",
    });
    expect(removeSandboxBetaTester).toHaveBeenCalledWith(TESTER_EMAIL);
  });
});
// #endregion
