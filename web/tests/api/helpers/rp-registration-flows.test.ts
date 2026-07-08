import {
  submitManagedRpDeactivation,
  submitManagedSignerRotation,
} from "@/api/helpers/rp-registration-flows";

// #region Mocks
const GetRpRegistration = jest.fn();
jest.mock(
  "@/api/hasura/rotate-signer-key/graphql/get-rp-registration.generated",
  () => ({ getSdk: () => ({ GetRpRegistration }) }),
);

const ClaimToggleSlot = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/claim-toggle-slot.generated",
  () => ({ getSdk: () => ({ ClaimToggleSlot }) }),
);

const ResetStalePendingRp = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/reset-stale-pending-rp.generated",
  () => ({ getSdk: () => ({ ResetStalePendingRp }) }),
);

const RevertToggleStatus = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/revert-toggle-status.generated",
  () => ({ getSdk: () => ({ RevertToggleStatus }) }),
);

const UpdateToggleResult = jest.fn();
jest.mock(
  "@/api/hasura/toggle-rp-active/graphql/update-toggle-result.generated",
  () => ({ getSdk: () => ({ UpdateToggleResult }) }),
);

const UpdateRpStatus = jest.fn();
jest.mock(
  "@/api/v4/rp-status/[rp_id]/graphql/update-rp-status.generated",
  () => ({
    getSdk: () => ({ UpdateRpStatus }),
  }),
);

const UpdateStagingStatus = jest.fn();
jest.mock(
  "@/api/v4/rp-status/[rp_id]/graphql/update-staging-status.generated",
  () => ({
    getSdk: () => ({ UpdateStagingStatus }),
  }),
);

// Rotation slot mutation — only needed to confirm it is NOT reached by the
// app-state guard.
const ClaimRotationSlot = jest.fn();
jest.mock(
  "@/api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated",
  () => ({ getSdk: () => ({ ClaimRotationSlot }) }),
);

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

const submitToggleRpActiveTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitToggleRpActiveTransaction: (...args: unknown[]) =>
    submitToggleRpActiveTransactionMock(...args),
  submitRegisterRpTransaction: jest.fn(),
  submitRotateSignerTransaction: jest.fn(),
}));

jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
  scheduleKeyDeletion: jest.fn(),
}));

jest.mock("@/api/helpers/kms-eth", () => ({ createManagerKey: jest.fn() }));

const mockGetRpRegistryConfig = jest.fn();
const mockGetStagingRpRegistryConfig = jest.fn();
jest.mock("@/api/helpers/rp-utils", () => {
  const actual = jest.requireActual("@/api/helpers/rp-utils");
  return {
    ...actual,
    getRpRegistryConfig: () => mockGetRpRegistryConfig(),
    getStagingRpRegistryConfig: () => mockGetStagingRpRegistryConfig(),
    parseRpId: () => 123n,
  };
});

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const client = {} as never;
const appId = "app_00000000000000000000000000000001";
const rpId = "rp_0123456789abcdef";

const makeRegistration = (overrides: Record<string, unknown> = {}) => ({
  rp_id: rpId,
  app_id: appId,
  mode: "managed",
  status: "registered",
  signer_address: "0x1111111111111111111111111111111111111111",
  manager_kms_key_id: "kms-key-123",
  operation_hash: null,
  staging_status: null,
  // Stale by default; pending-specific tests override to a fresh timestamp.
  updated_at: "2020-01-01T00:00:00.000Z",
  app: {
    team_id: "team_00000000000000000000000000000001",
    deleted_at: null,
    status: "active",
    is_archived: false,
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Non-production by default so the staging mirror is out of scope; the
  // staging suite opts in explicitly.
  process.env.NEXT_PUBLIC_APP_ENV = "test";
  mockGetRpRegistryConfig.mockReturnValue({
    contractAddress: "0xcontract",
    kmsRegion: "us-east-1",
  });
  mockGetStagingRpRegistryConfig.mockReturnValue(null);
  GetRpRegistration.mockResolvedValue({
    rp_registration: [makeRegistration()],
  });
  getRpFromContractMock.mockResolvedValue({
    initialized: true,
    active: true,
    signer: "0x1111111111111111111111111111111111111111",
  });
  ClaimToggleSlot.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  ResetStalePendingRp.mockResolvedValue({
    update_rp_registration: { affected_rows: 1 },
  });
  submitToggleRpActiveTransactionMock.mockResolvedValue("0xophash");
  UpdateToggleResult.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
  UpdateRpStatus.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
  UpdateStagingStatus.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
});

// #region submitManagedRpDeactivation
describe("submitManagedRpDeactivation", () => {
  it("returns config_error when RP Registry config is missing", async () => {
    mockGetRpRegistryConfig.mockReturnValue(null);

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toEqual({
      ok: false,
      code: "config_error",
      detail: expect.any(String),
    });
    expect(GetRpRegistration).not.toHaveBeenCalled();
  });

  it("skips when the app has no RP registration", async () => {
    GetRpRegistration.mockResolvedValue({ rp_registration: [] });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toEqual({ ok: true, outcome: "skipped", reason: "no_rp" });
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(ClaimToggleSlot).not.toHaveBeenCalled();
  });

  it("skips self-managed RPs (the developer owns the on-chain lifecycle)", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({ mode: "self_managed", manager_kms_key_id: null }),
      ],
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "self_managed",
    });
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("does not submit a tx when the RP is already inactive on-chain, and converges the DB", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: false,
      signer: "0x0",
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "already_inactive",
    });
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: "deactivated",
    });
    expect(ClaimToggleSlot).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("does not rewrite the DB when an inactive RP is already marked deactivated", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [makeRegistration({ status: "deactivated" })],
    });
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: false,
      signer: "0x0",
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "already_inactive",
    });
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("submits an on-chain deactivation when the RP is active", async () => {
    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "submitted",
      rpIdString: rpId,
      operationHash: "0xophash",
    });
    expect(ClaimToggleSlot).toHaveBeenCalledWith({
      rp_id: rpId,
      current_status: "registered",
    });
    expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(1);
    expect(UpdateToggleResult).toHaveBeenCalledWith({
      rp_id: rpId,
      operation_hash: "0xophash",
      staging_operation_hash: null,
    });
    expect(RevertToggleStatus).not.toHaveBeenCalled();
  });

  it("skips a freshly-pending RP without submitting a second toggle", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "pending",
          updated_at: new Date().toISOString(),
        }),
      ],
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "in_flight",
    });
    // Must not read on-chain or submit while a toggle is genuinely in flight.
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("skips a pending RP still inside its on-chain validity window (op not provably dead yet)", async () => {
    // Older than a naive settle window but younger than the 30-min UserOp
    // validity: the in-flight op can still land, so we must not read chain
    // state or act on it yet.
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "pending",
          updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        }),
      ],
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "in_flight",
    });
    // Crucially: a still-valid register op must not be read-then-marked
    // `deactivated`, or a late-landing op would strand the RP active on-chain.
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(UpdateRpStatus).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("marks a long-stale pending registration that never initialized on-chain as deactivated", async () => {
    // Well past the UserOp validity window and never landed on-chain: the
    // register op is provably dead, so converging to `deactivated` cannot
    // strand a registration that could still flip the RP active.
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "pending",
          updated_at: "2020-01-01T00:00:00.000Z",
        }),
      ],
    });
    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
      signer: "0x0",
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "already_inactive",
    });
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: "deactivated",
    });
    // No transaction: there is nothing live on-chain to toggle.
    expect(ClaimToggleSlot).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("skips a recently-failed registration whose register op may still be in flight", async () => {
    // rp-status flips pending→failed after 5 min, but the register op is valid
    // for 30. A failed row inside the grace window must be treated as in-flight
    // so we don't finalize it before the op is provably dead.
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "failed",
          updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        }),
      ],
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "in_flight",
    });
    // A still-valid register op must not be read-then-finalized.
    expect(getRpFromContractMock).not.toHaveBeenCalled();
    expect(UpdateRpStatus).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("finalizes a long-failed registration once its register op has expired", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "failed",
          updated_at: "2020-01-01T00:00:00.000Z",
        }),
      ],
    });
    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
      signer: "0x0",
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "already_inactive",
    });
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: "deactivated",
    });
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("resubmits a stale pending RP whose tx never settled (still active on-chain)", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "pending",
          updated_at: "2020-01-01T00:00:00.000Z",
        }),
      ],
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({ ok: true, outcome: "submitted" });
    // Stale pending is first reset to `registered` (real CAS scoped to the
    // observed row version), then the claim transitions registered → pending —
    // never a non-serializing pending claim.
    expect(ResetStalePendingRp).toHaveBeenCalledWith({
      rp_id: rpId,
      updated_at: "2020-01-01T00:00:00.000Z",
    });
    expect(ClaimToggleSlot).toHaveBeenCalledWith({
      rp_id: rpId,
      current_status: "registered",
    });
    expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("skips a stale pending RP when another pass already reset/claimed it", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({
          status: "pending",
          updated_at: "2020-01-01T00:00:00.000Z",
        }),
      ],
    });
    ResetStalePendingRp.mockResolvedValue({
      update_rp_registration: { affected_rows: 0 },
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "concurrent",
    });
    expect(ClaimToggleSlot).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("skips when the rotation slot was claimed by a concurrent operation", async () => {
    ClaimToggleSlot.mockResolvedValue({
      update_rp_registration: { affected_rows: 0 },
    });

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({
      ok: true,
      outcome: "skipped",
      reason: "concurrent",
    });
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("reverts the slot when the on-chain submission fails", async () => {
    submitToggleRpActiveTransactionMock.mockRejectedValue(
      new Error("bundler down"),
    );

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({ ok: false, code: "submission_error" });
    expect(RevertToggleStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      previous_status: "registered",
    });
  });

  it("returns rpc_error without mutating anything when the on-chain read fails", async () => {
    getRpFromContractMock.mockRejectedValue(new Error("rpc timeout"));

    const res = await submitManagedRpDeactivation({ client, appId });

    expect(res).toMatchObject({ ok: false, code: "rpc_error" });
    expect(ClaimToggleSlot).not.toHaveBeenCalled();
    expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
  });

  it("still reports success (no revert) when the post-submission DB write fails", async () => {
    UpdateToggleResult.mockRejectedValue(new Error("db blip"));

    const res = await submitManagedRpDeactivation({ client, appId });

    // The on-chain tx is already in flight; leaving status `pending` (not
    // reverting) prevents the cron from submitting a second toggle.
    expect(res).toMatchObject({
      ok: true,
      outcome: "submitted",
      operationHash: "0xophash",
    });
    expect(RevertToggleStatus).not.toHaveBeenCalled();
  });

  // Staging mirror reconciliation (production only). A managed RP is mirrored on
  // a staging contract; the row must not be finalized `deactivated` until BOTH
  // contracts are inactive, or a live staging signer would be stranded.
  describe("staging mirror", () => {
    const stagingConfig = {
      contractAddress: "0xstaging",
      kmsRegion: "us-east-1",
    };

    beforeEach(() => {
      process.env.NEXT_PUBLIC_APP_ENV = "production";
      mockGetStagingRpRegistryConfig.mockReturnValue(stagingConfig);
    });

    it("deactivates staging when the primary is already inactive but staging is still active", async () => {
      getRpFromContractMock.mockImplementation(
        (_rpId: unknown, address: string) =>
          Promise.resolve(
            address === stagingConfig.contractAddress
              ? { initialized: true, active: true, signer: "0x0" }
              : { initialized: true, active: false, signer: "0x0" },
          ),
      );

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({ ok: true, outcome: "submitted" });
      // Must NOT finalize on the primary read alone.
      expect(UpdateRpStatus).not.toHaveBeenCalled();
      // Claims the slot (so the grace protects the toggle) and toggles ONLY the
      // staging contract.
      expect(ClaimToggleSlot).toHaveBeenCalledTimes(1);
      expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(1);
      expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledWith(
        stagingConfig,
        expect.anything(),
      );
      // No primary op hash to persist for a staging-only toggle.
      expect(UpdateToggleResult).not.toHaveBeenCalled();
    });

    it("finalizes deactivated only once both primary and staging are inactive", async () => {
      getRpFromContractMock.mockResolvedValue({
        initialized: true,
        active: false,
        signer: "0x0",
      });

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({
        ok: true,
        outcome: "skipped",
        reason: "already_inactive",
      });
      expect(UpdateRpStatus).toHaveBeenCalledWith({
        rp_id: rpId,
        status: "deactivated",
      });
      expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
    });

    it("does not finalize when the primary is inactive but the staging read fails", async () => {
      getRpFromContractMock.mockImplementation(
        (_rpId: unknown, address: string) =>
          address === stagingConfig.contractAddress
            ? Promise.reject(new Error("staging rpc down"))
            : Promise.resolve({
                initialized: true,
                active: false,
                signer: "0x0",
              }),
      );

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({ ok: false, code: "rpc_error" });
      // Staging state unknown → must not terminally mark the row deactivated.
      expect(UpdateRpStatus).not.toHaveBeenCalled();
      expect(ClaimToggleSlot).not.toHaveBeenCalled();
    });

    it("toggles both contracts when both are active", async () => {
      getRpFromContractMock.mockResolvedValue({
        initialized: true,
        active: true,
        signer: "0x0",
      });

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({ ok: true, outcome: "submitted" });
      expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(2);
      expect(UpdateToggleResult).toHaveBeenCalledWith({
        rp_id: rpId,
        operation_hash: "0xophash",
        staging_operation_hash: "0xophash",
      });
    });

    it("reconciles staging even when the primary is already marked deactivated", async () => {
      // status = deactivated (primary torn down) but staging is still active.
      // The cron reaches this row via the staging_status selector; the helper
      // must still tear staging down rather than treating the row as finished.
      GetRpRegistration.mockResolvedValue({
        rp_registration: [
          makeRegistration({
            status: "deactivated",
            staging_status: "registered",
          }),
        ],
      });
      getRpFromContractMock.mockImplementation(
        (_rpId: unknown, address: string) =>
          Promise.resolve(
            address === stagingConfig.contractAddress
              ? { initialized: true, active: true, signer: "0x0" }
              : { initialized: true, active: false, signer: "0x0" },
          ),
      );

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({ ok: true, outcome: "submitted" });
      expect(ClaimToggleSlot).toHaveBeenCalledWith({
        rp_id: rpId,
        current_status: "deactivated",
      });
      expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledTimes(1);
      expect(submitToggleRpActiveTransactionMock).toHaveBeenCalledWith(
        stagingConfig,
        expect.anything(),
      );
    });

    it.each(["registered", "pending", "failed"])(
      "downgrades a stale %s staging_status once staging reads inactive",
      async (staleStagingStatus) => {
        // Both contracts inactive, but staging_status is a stale non-terminal
        // value. It must be converged to `deactivated` so the cron (which
        // selects any set-but-not-deactivated staging status) stops re-selecting
        // this row.
        GetRpRegistration.mockResolvedValue({
          rp_registration: [
            makeRegistration({
              status: "deactivated",
              staging_status: staleStagingStatus,
            }),
          ],
        });
        getRpFromContractMock.mockResolvedValue({
          initialized: true,
          active: false,
          signer: "0x0",
        });

        const res = await submitManagedRpDeactivation({ client, appId });

        expect(res).toMatchObject({
          ok: true,
          outcome: "skipped",
          reason: "already_inactive",
        });
        expect(UpdateStagingStatus).toHaveBeenCalledWith({
          rp_id: rpId,
          staging_status: "deactivated",
        });
        // Primary was already deactivated, so its status is left untouched.
        expect(UpdateRpStatus).not.toHaveBeenCalled();
        expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
      },
    );

    it.each(["pending", "failed"])(
      "defers converging a fresh %s staging_status while its op may be in flight",
      async (freshStagingStatus) => {
        // status = deactivated (so the production grace doesn't apply); staging
        // status is a fresh non-terminal value whose own register/rotation op
        // may still land. Staging reads inactive only because it hasn't landed —
        // finalizing now would strand staging active if the op lands afterwards.
        GetRpRegistration.mockResolvedValue({
          rp_registration: [
            makeRegistration({
              status: "deactivated",
              staging_status: freshStagingStatus,
              updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            }),
          ],
        });
        getRpFromContractMock.mockResolvedValue({
          initialized: true,
          active: false,
          signer: "0x0",
        });

        const res = await submitManagedRpDeactivation({ client, appId });

        expect(res).toMatchObject({ ok: true, outcome: "skipped" });
        // Must not finalize staging while its op could still land.
        expect(UpdateStagingStatus).not.toHaveBeenCalled();
        expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
      },
    );

    it("does not rewrite staging_status when it is already deactivated", async () => {
      GetRpRegistration.mockResolvedValue({
        rp_registration: [
          makeRegistration({
            status: "registered",
            staging_status: "deactivated",
          }),
        ],
      });
      getRpFromContractMock.mockResolvedValue({
        initialized: true,
        active: false,
        signer: "0x0",
      });

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({
        ok: true,
        outcome: "skipped",
        reason: "already_inactive",
      });
      // Primary converges to deactivated; staging is already there.
      expect(UpdateRpStatus).toHaveBeenCalledWith({
        rp_id: rpId,
        status: "deactivated",
      });
      expect(UpdateStagingStatus).not.toHaveBeenCalled();
    });

    it("does not finalize when the staging config is missing but staging state is unreconciled", async () => {
      // Production misconfiguration: staging registry env vars missing while the
      // row still shows staging as active. We cannot prove staging is inactive,
      // so we must not mark it deactivated (which would strand a live signer).
      mockGetStagingRpRegistryConfig.mockReturnValue(null);
      GetRpRegistration.mockResolvedValue({
        rp_registration: [
          makeRegistration({
            status: "deactivated",
            staging_status: "registered",
          }),
        ],
      });
      getRpFromContractMock.mockResolvedValue({
        initialized: true,
        active: false,
        signer: "0x0",
      });

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({ ok: false, code: "rpc_error" });
      expect(UpdateStagingStatus).not.toHaveBeenCalled();
      expect(UpdateRpStatus).not.toHaveBeenCalled();
      expect(submitToggleRpActiveTransactionMock).not.toHaveBeenCalled();
    });

    it("finalizes when the staging config is missing and there is no staging state", async () => {
      mockGetStagingRpRegistryConfig.mockReturnValue(null);
      GetRpRegistration.mockResolvedValue({
        rp_registration: [
          makeRegistration({ status: "registered", staging_status: null }),
        ],
      });
      getRpFromContractMock.mockResolvedValue({
        initialized: true,
        active: false,
        signer: "0x0",
      });

      const res = await submitManagedRpDeactivation({ client, appId });

      expect(res).toMatchObject({
        ok: true,
        outcome: "skipped",
        reason: "already_inactive",
      });
      expect(UpdateRpStatus).toHaveBeenCalledWith({
        rp_id: rpId,
        status: "deactivated",
      });
      expect(UpdateStagingStatus).not.toHaveBeenCalled();
    });
  });
});
// #endregion

// #region submitManagedSignerRotation app-state guard
describe("submitManagedSignerRotation [app-state guard]", () => {
  const newSignerAddress = "0x2222222222222222222222222222222222222222";

  it.each([
    ["deleted", { deleted_at: "2026-01-01T00:00:00Z" }],
    ["archived", { is_archived: true }],
    ["inactive", { status: "inactive" }],
  ])(
    "refuses to rotate the signer of a %s app",
    async (_label, appOverride) => {
      GetRpRegistration.mockResolvedValue({
        rp_registration: [
          makeRegistration({
            app: {
              team_id: "team_00000000000000000000000000000001",
              deleted_at: null,
              status: "active",
              is_archived: false,
              ...appOverride,
            },
          }),
        ],
      });

      const res = await submitManagedSignerRotation({
        client,
        appId,
        newSignerAddress,
      });

      expect(res).toMatchObject({ ok: false, code: "app_inactive" });
      // Guard runs before claiming the slot.
      expect(ClaimRotationSlot).not.toHaveBeenCalled();
    },
  );
});
// #endregion
