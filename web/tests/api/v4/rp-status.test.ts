import { GET } from "@/api/v4/rp-status/[rp_id]";
import { RpRegistrationStatus } from "@/api/helpers/rp-utils";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistration = jest.fn();
const UpdateRpStatus = jest.fn();
const UpdateStagingStatus = jest.fn();
const getRpFromContractMock = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock(
  "../../../api/v4/rp-status/[rp_id]/graphql/get-rp-registration.generated",
  () => ({
    getSdk: () => ({
      GetRpRegistration,
    }),
  }),
);

jest.mock(
  "../../../api/v4/rp-status/[rp_id]/graphql/update-rp-status.generated",
  () => ({
    getSdk: () => ({
      UpdateRpStatus,
    }),
  }),
);

jest.mock(
  "../../../api/v4/rp-status/[rp_id]/graphql/update-staging-status.generated",
  () => ({
    getSdk: () => ({
      UpdateStagingStatus,
    }),
  }),
);

jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

const resolveManagerAddressMock = jest.fn();
jest.mock("../../../api/helpers/rp-manager", () => ({
  resolveManagerAddress: (...args: unknown[]) =>
    resolveManagerAddressMock(...args),
}));
// #endregion

// #region Test Data
const rpId = "rp_abc123def4560000";
/** Address of the Portal's KMS manager key for the RP under test. */
const portalManager = "0xPortalManager";
const portalSigner = "0x1234";

const createRequest = () =>
  new NextRequest(
    new URL(`/api/v4/rp-status/${rpId}`, "http://localhost:3000"),
    { method: "GET" },
  );

const ctx = { params: Promise.resolve({ rp_id: rpId }) };

const makeDbRecord = (
  overrides: Partial<{
    status: string;
    created_at: string;
    updated_at: string;
    operation_hash: string | null;
    mode: string;
    signer_address: string | null;
    manager_kms_key_id: string | null;
    staging_status: string | null;
    staging_operation_hash: string | null;
    app: { deleted_at: string | null };
  }> = {},
) => ({
  rp_id: rpId,
  app_id: "app_test123",
  status: "pending",
  mode: "managed",
  signer_address: portalSigner,
  manager_kms_key_id: "kms-key-123",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  operation_hash: null,
  staging_status: null,
  staging_operation_hash: null,
  app: { deleted_at: null },
  ...overrides,
});

const productionContract = "0xProductionContract";
const stagingContract = "0xStagingContract";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RP_REGISTRY_CONTRACT_ADDRESS = productionContract;
  process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS = stagingContract;
  global.RedisClient?.flushall();
  resolveManagerAddressMock.mockResolvedValue(portalManager);
  UpdateStagingStatus.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
});

// #region Pending timeout tests
describe("/api/v4/rp-status [pending timeout]", () => {
  it("transitions to failed after 5 minutes when not initialized on-chain", async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: sixMinutesAgo,
        updated_at: sixMinutesAgo,
        operation_hash: "0xdeadbeef",
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
    });

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("failed");
    expect(body.staging_status).toBe("failed");

    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Failed,
    });

    expect(UpdateStagingStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Failed,
    });
  });

  it("stays pending within the 5 minute grace period", async () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: twoMinutesAgo,
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("pending");
    expect(body.staging_status).toBe("pending");

    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("transitions to registered even after 5 minutes if on-chain is initialized", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: tenMinutesAgo,
      }),
    });

    // Both contracts initialized; on-chain signer matches DB signer
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManager,
      signer: "0x1234",
    });

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");

    // Should sync to registered, not failed
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Registered,
    });
  });

  it("does not timeout self-managed RPs — they stay pending indefinitely", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: tenMinutesAgo,
        mode: "self_managed",
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("pending");

    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Production ownership verification (rp_id takeover protection)
describe("/api/v4/rp-status [production ownership verification]", () => {
  it("does not promote a managed RP to registered when the on-chain signer is foreign", async () => {
    // The security case: a managed registration failed, leaving the rp_id row
    // in `failed` while the RP is unregistered on-chain. An attacker then wins
    // the permissionless on-chain register() for the same rp_id with their OWN
    // manager and signer. rp-status must NOT adopt that on-chain "registered"
    // reading — that would flip the row to `registered` and let proof-context
    // serve the app's verified branding bound to the attacker's OPRF signer.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "failed",
        mode: "managed",
        signer_address: "0xExpectedSigner",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          // Attacker registered on-chain with their own manager and signer.
          return {
            initialized: true,
            active: true,
            manager: "0xAttackerManager",
            signer: "0xAttackerSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    // Status stays `failed`; the untrusted on-chain reading is not adopted...
    expect(body.production_status).toBe("failed");
    // ...and never written back to the DB.
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("escalates to error when an already-registered RP is proven not Portal-owned", async () => {
    // The severe case: proof-context and /api/v4/verify gate on the stored
    // `registered` status, so this app's verified branding is being served over
    // a signer we have just proven is not ours. Demoting from this
    // unauthenticated polling path is too dangerous (stale manager_kms_key_id
    // data would take working apps down), so the status is preserved and the
    // condition has to be loud enough to alert on — not the same throttled warn
    // an in-flight rotation produces.
    const { logger } = jest.requireMock("../../../lib/logger");
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        mode: "managed",
        signer_address: "0xExpectedSigner",
        manager_kms_key_id: "kms-key-123",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: "0xAttackerManager",
            signer: "0xAttackerSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("not Portal-owned"),
      expect.objectContaining({ dbStatus: "registered" }),
    );
    // Preserved, not demoted, and never written back.
    expect((await res.json()).production_status).toBe("registered");
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("promotes a self-managed RP to registered for any on-chain owner (no expected signer to check)", async () => {
    // Self-managed RPs have no Portal-stored signer to compare against — the
    // developer owns both on-chain roles — so the on-chain reading stays
    // authoritative and a completed on-chain registration flips it to registered.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "self_managed",
        signer_address: null,
        manager_kms_key_id: null,
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: "0xDeveloperOwnedManager",
      signer: "0xDeveloperOwnedSigner",
    });

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Registered,
    });
  });

  it("fails a managed RP that is initialized on-chain but has no manager key recorded", async () => {
    // submitManagedRpRegistration keeps the claimed row when the DB write after
    // a successful on-chain submission throws, leaving no manager_kms_key_id.
    // That resolves to `unknown` forever, so without this the row polls
    // `pending` indefinitely — before the trust gate it was promoted on
    // initialized && active alone and healed itself.
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "managed",
        signer_address: "0xExpectedSigner",
        manager_kms_key_id: null,
        created_at: fortyMinutesAgo,
        updated_at: fortyMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: "0xSomeManager",
            signer: "0xExpectedSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).production_status).toBe("failed");
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Failed,
    });
  });

  it("does not fail an unknown-trust RP that still has a manager key (KMS outage)", async () => {
    // The same `unknown` verdict caused by KMS being unavailable must NOT fail a
    // healthy registration, or a KMS blip becomes a self-inflicted incident.
    resolveManagerAddressMock.mockResolvedValue(null);
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "managed",
        signer_address: "0xExpectedSigner",
        manager_kms_key_id: "kms-key-123",
        created_at: fortyMinutesAgo,
        updated_at: fortyMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: "0xSomeManager",
            signer: "0xExpectedSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).production_status).toBe("pending");
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("promotes a self-managed RP whose row still carries a signer address", async () => {
    // The self-managed case is keyed off `mode`, not off an absent
    // signer_address. Those coincide today, but if a self-managed row ever
    // records the developer's on-chain signer, inferring the mode from the
    // missing signer would leave every such row polling `pending` forever
    // because there is no Portal manager key to compare against.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "self_managed",
        signer_address: "0xDeveloperOwnedSigner",
        manager_kms_key_id: null,
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: "0xDeveloperOwnedManager",
      signer: "0xDeveloperOwnedSigner",
    });

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Registered,
    });
  });

  it("times out a managed RP wedged pending by a foreign on-chain owner once the UserOp window elapses", async () => {
    // Foreign takeover of the rp_id: the row is still `pending` (the Portal's
    // registration never completed) but on-chain it's initialized+active under a
    // manager/signer we don't own. It can never become a trusted `registered`,
    // and enough time has passed since the last write (> UserOp validity +
    // margin) that any in-flight op is provably dead, so it must flip to
    // `failed` — otherwise the dashboard polls forever with no retry path.
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "managed",
        signer_address: "0xExpectedSigner",
        created_at: fortyMinutesAgo,
        updated_at: fortyMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: "0xAttackerManager",
            signer: "0xAttackerSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("failed");
    expect(UpdateRpStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      status: RpRegistrationStatus.Failed,
    });
  });

  it("does not fail a signer rotation still within its UserOp validity window", async () => {
    // Rotation submitted ~10 min ago: status=pending, DB signer already the NEW
    // key, on-chain still the OLD key (op not yet mined) → signer mismatch. This
    // is past the short 5-min grace but well within the 30-min UserOp validity
    // window, so the op can still land — the row must stay `pending`, NOT be
    // failed (which would then be cached for an hour over a trusted registered).
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "managed",
        signer_address: "0xNewSigner",
        created_at: fortyMinutesAgo,
        updated_at: tenMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0xOldSigner",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("pending");
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("does not promote when the on-chain signer matches but the manager is foreign", async () => {
    // A signer-only check is not enough. The Portal publishes its intended
    // signer in the `register` calldata (readable on-chain even when the op
    // failed), so an attacker can re-register the same rp_id with that SAME
    // signer but their own manager. Promoting here would mark the row
    // `registered`, after which the attacker's manager calls `updateRp` to swap
    // the signer in — and the later mismatch only preserves the already
    // `registered` status, leaving proof-context serving the app's verified
    // branding over the attacker's OPRF signer.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "failed",
        mode: "managed",
        signer_address: portalSigner,
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: "0xAttackerManager",
            signer: portalSigner,
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("failed");
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });

  it("preserves status without failing the row when the manager address cannot be resolved", async () => {
    // KMS is down, so we cannot prove ownership either way. That is `unknown`,
    // not a takeover: preserve the status, but do NOT run the untrusted timeout
    // and mark a healthy pending registration `failed` over our own dependency
    // being unavailable.
    resolveManagerAddressMock.mockResolvedValue(null);

    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        mode: "managed",
        signer_address: portalSigner,
        created_at: fortyMinutesAgo,
        updated_at: fortyMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: portalSigner,
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("pending");
    expect(UpdateRpStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Staging status is derived from on-chain, not DB
describe("/api/v4/rp-status [staging timeout]", () => {
  it("reports staging as pending when production initialized first but within grace period", async () => {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        created_at: oneMinuteAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");
    expect(body.staging_status).toBe("pending");
  });

  it("times out staging independently when production is already registered", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // DB already synced to registered from a previous poll
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        created_at: tenMinutesAgo,
        updated_at: tenMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");
    expect(body.staging_status).toBe("failed");

    expect(UpdateStagingStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Failed,
    });
  });
});
// #endregion

// #region Staging status DB sync
describe("/api/v4/rp-status [staging DB sync]", () => {
  it("syncs staging status to DB when on-chain state differs from DB", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "pending",
        created_at: new Date().toISOString(),
      }),
    });

    // On-chain signer matches DB signer → safe to sync to "registered"
    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return {
          initialized: true,
          active: true,
          manager: portalManager,
          signer: "0x1234",
        };
      },
    );

    UpdateRpStatus.mockResolvedValue({
      update_rp_registration_by_pk: { rp_id: rpId },
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.production_status).toBe("registered");
    expect(body.staging_status).toBe("registered");

    expect(UpdateStagingStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Registered,
    });
  });

  it("does not update staging status in DB when already in sync", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "registered",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManager,
      signer: "0x1234",
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("preserves DB staging_status=failed when on-chain signer mismatches (rotation failed)", async () => {
    // Simulates the post-rotation-failure case: rotate-signer-key persisted
    // staging_status=failed and a new DB signer; on-chain still has the OLD
    // signer (the rotation tx didn't land). rp-status must NOT auto-clear
    // the failed state to "registered" — that would hide the retry button.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "failed",
        signer_address: "0xnewSigner",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return {
          initialized: true,
          active: true,
          manager: portalManager,
          signer: "0xoldSigner",
        };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.staging_status).toBe("failed");
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("falls back to on-chain status for self-managed RPs (no DB signer to compare)", async () => {
    // Self-managed RP with a stale DB staging_status from a prior managed
    // session. We have no expected signer to compare against, so on-chain
    // "registered" should be authoritative — otherwise the stale status
    // would stick forever.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        mode: "self_managed",
        signer_address: null,
        staging_status: "failed",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManager,
      signer: "0xanySigner",
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.staging_status).toBe("registered");
    expect(UpdateStagingStatus).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Registered,
    });
  });

  it("preserves DB staging_status=pending when on-chain signer mismatches (rotation in flight)", async () => {
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "pending",
        signer_address: "0xnewSigner",
        created_at: new Date().toISOString(),
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return {
          initialized: true,
          active: true,
          manager: portalManager,
          signer: "0xoldSigner",
        };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.staging_status).toBe("pending");
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("does not write staging timeout to DB when already failed", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "failed",
        created_at: tenMinutesAgo,
        updated_at: tenMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.staging_status).toBe("failed");

    // Should not re-write failed since DB already has failed
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("does not persist staging failed on transient RPC error", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "pending",
        created_at: tenMinutesAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        // Staging RPC throws — transient error
        throw new Error("RPC timeout");
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    // Response reports failed (non-fatal), but DB should NOT be updated
    expect(body.staging_status).toBe("failed");
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("does not timeout staging after a fresh retry even if RP is old", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "registered",
        staging_status: "pending",
        created_at: tenMinutesAgo,
        // updated_at is recent because a staging retry just happened
        updated_at: oneMinuteAgo,
      }),
    });

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return {
            initialized: true,
            active: true,
            manager: portalManager,
            signer: "0x1234",
          };
        }
        // Staging not yet initialized (retry tx still in flight)
        return { initialized: false, active: false };
      },
    );

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    // Should stay pending, not timeout to failed
    expect(body.staging_status).toBe("pending");
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Deleted app — read-only, no writeback
describe("/api/v4/rp-status [deleted app]", () => {
  it("does not write a deleted app's status back to the DB", async () => {
    // RP mid-deactivation: DB says `pending`, but on-chain still reads active
    // because the toggle has not mined. A public poll must NOT clobber
    // `pending` back to `registered` — the reconciliation cron relies on that
    // marker to avoid firing a second toggle that would re-activate the RP.
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        staging_status: "registered",
        app: { deleted_at: new Date().toISOString() },
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: portalManager,
      signer: "0x1234",
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    // The response still reflects live on-chain state...
    const body = await res.json();
    expect(body.production_status).toBe("registered");
    // ...but the DB row is left untouched for the deactivation flow to own.
    expect(UpdateRpStatus).not.toHaveBeenCalled();
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });

  it("does not time a deleted app's registration out to failed", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: tenMinutesAgo,
        updated_at: tenMinutesAgo,
        app: { deleted_at: new Date().toISOString() },
      }),
    });

    getRpFromContractMock.mockResolvedValue({
      initialized: false,
      active: false,
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

    expect(UpdateRpStatus).not.toHaveBeenCalled();
    expect(UpdateStagingStatus).not.toHaveBeenCalled();
  });
});
// #endregion
