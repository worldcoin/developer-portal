import { POST } from "@/api/_deactivate-deleted-app-rps";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const submitManagedRpDeactivationMock = jest.fn();
jest.mock("@/api/helpers/rp-registration-flows", () => ({
  submitManagedRpDeactivation: (...args: unknown[]) =>
    submitManagedRpDeactivationMock(...args),
}));

const GetDeletedAppRps = jest.fn();
jest.mock(
  "@/api/_deactivate-deleted-app-rps/graphql/get-deleted-app-rps.generated",
  () => ({ getSdk: () => ({ GetDeletedAppRps }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const createRequest = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_deactivate-deleted-app-rps", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });

const candidate = (n: number) => ({
  rp_id: `rp_000000000000000${n}`,
  app_id: `app_0000000000000000000000000000000${n}`,
  status: "registered",
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  GetDeletedAppRps.mockResolvedValue({ rp_registration: [] });
  submitManagedRpDeactivationMock.mockResolvedValue({
    ok: true,
    outcome: "submitted",
  });
});

// #region Auth
describe("/api/_deactivate-deleted-app-rps [auth]", () => {
  it("rejects requests without the internal secret", async () => {
    const res = (await POST(createRequest()))!;

    expect(res.status).toBe(403);
    expect(GetDeletedAppRps).not.toHaveBeenCalled();
    expect(submitManagedRpDeactivationMock).not.toHaveBeenCalled();
  });

  it("rejects requests with the wrong internal secret", async () => {
    const res = (await POST(createRequest("Bearer nope")))!;

    expect(res.status).toBe(403);
    expect(GetDeletedAppRps).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Reconciliation
describe("/api/_deactivate-deleted-app-rps [reconciliation]", () => {
  it("returns 204 without deactivating anything when there are no candidates", async () => {
    const res = (await POST(createRequest("Bearer internal-secret")))!;

    expect(res.status).toBe(204);
    expect(submitManagedRpDeactivationMock).not.toHaveBeenCalled();
  });

  it("deactivates each candidate RP and returns 204", async () => {
    GetDeletedAppRps.mockResolvedValue({
      rp_registration: [candidate(1), candidate(2)],
    });

    const res = (await POST(createRequest("Bearer internal-secret")))!;

    expect(res.status).toBe(204);
    expect(submitManagedRpDeactivationMock).toHaveBeenCalledTimes(2);
    expect(submitManagedRpDeactivationMock).toHaveBeenNthCalledWith(1, {
      client: expect.anything(),
      appId: candidate(1).app_id,
    });
    expect(submitManagedRpDeactivationMock).toHaveBeenNthCalledWith(2, {
      client: expect.anything(),
      appId: candidate(2).app_id,
    });
  });

  it("processes every candidate even when one fails", async () => {
    GetDeletedAppRps.mockResolvedValue({
      rp_registration: [candidate(1), candidate(2)],
    });
    submitManagedRpDeactivationMock
      .mockResolvedValueOnce({
        ok: false,
        code: "submission_error",
        detail: "x",
      })
      .mockResolvedValueOnce({ ok: true, outcome: "submitted" });

    const res = (await POST(createRequest("Bearer internal-secret")))!;

    expect(res.status).toBe(204);
    expect(submitManagedRpDeactivationMock).toHaveBeenCalledTimes(2);
  });

  it("continues to the next candidate when a deactivation throws", async () => {
    GetDeletedAppRps.mockResolvedValue({
      rp_registration: [candidate(1), candidate(2)],
    });
    submitManagedRpDeactivationMock
      .mockRejectedValueOnce(new Error("graphql exploded"))
      .mockResolvedValueOnce({ ok: true, outcome: "submitted" });

    const res = (await POST(createRequest("Bearer internal-secret")))!;

    // One bad row must not abort the run or skip the remaining candidates.
    expect(res.status).toBe(204);
    expect(submitManagedRpDeactivationMock).toHaveBeenCalledTimes(2);
  });
});
// #endregion
