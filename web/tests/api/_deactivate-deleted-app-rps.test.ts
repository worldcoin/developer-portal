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

const TouchDeletedAppRp = jest.fn();
jest.mock(
  "@/api/_deactivate-deleted-app-rps/graphql/touch-deleted-app-rp.generated",
  () => ({ getSdk: () => ({ TouchDeletedAppRp }) }),
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
  TouchDeletedAppRp.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: "rp_touched" },
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
    // Successful reconciliations already advance updated_at on-chain-side; no
    // cooldown touch needed.
    expect(TouchDeletedAppRp).not.toHaveBeenCalled();
  });

  it("processes every candidate even when one fails, and cools down the failed row", async () => {
    GetDeletedAppRps.mockResolvedValue({
      rp_registration: [candidate(1), candidate(2)],
    });
    submitManagedRpDeactivationMock
      .mockResolvedValueOnce({
        ok: false,
        code: "rpc_error",
        detail: "x",
      })
      .mockResolvedValueOnce({ ok: true, outcome: "submitted" });

    const res = (await POST(createRequest("Bearer internal-secret")))!;

    expect(res.status).toBe(204);
    expect(submitManagedRpDeactivationMock).toHaveBeenCalledTimes(2);
    // Only the failed row is touched (bumping updated_at) so it rotates to the
    // back of the batch instead of monopolizing it; the succeeded one is not.
    expect(TouchDeletedAppRp).toHaveBeenCalledTimes(1);
    expect(TouchDeletedAppRp).toHaveBeenCalledWith({
      rp_id: candidate(1).rp_id,
      now: expect.any(String),
    });
  });

  it("continues to the next candidate when a deactivation throws, and cools down the bad row", async () => {
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
    expect(TouchDeletedAppRp).toHaveBeenCalledTimes(1);
    expect(TouchDeletedAppRp).toHaveBeenCalledWith({
      rp_id: candidate(1).rp_id,
      now: expect.any(String),
    });
  });

  it("still returns 204 if the cooldown touch itself fails", async () => {
    GetDeletedAppRps.mockResolvedValue({ rp_registration: [candidate(1)] });
    submitManagedRpDeactivationMock.mockResolvedValue({
      ok: false,
      code: "rpc_error",
      detail: "x",
    });
    TouchDeletedAppRp.mockRejectedValue(new Error("touch failed"));

    const res = (await POST(createRequest("Bearer internal-secret")))!;

    // A failed touch is best-effort — it must not abort the run.
    expect(res.status).toBe(204);
    expect(TouchDeletedAppRp).toHaveBeenCalledTimes(1);
  });
});
// #endregion
