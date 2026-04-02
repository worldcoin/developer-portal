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
// #endregion

// #region Test Data
const rpId = "rp_abc123def4560000";

const createRequest = () =>
  new NextRequest(
    new URL(`/api/v4/rp-status/${rpId}`, "http://localhost:3000"),
    { method: "GET" },
  );

const ctx = { params: { rp_id: rpId } };

const makeDbRecord = (
  overrides: Partial<{
    status: string;
    created_at: string;
    updated_at: string;
    operation_hash: string | null;
    mode: string;
    staging_status: string | null;
    staging_operation_hash: string | null;
  }> = {},
) => ({
  rp_id: rpId,
  app_id: "app_test123",
  status: "pending",
  mode: "managed",
  signer_address: "0x1234",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  operation_hash: null,
  staging_status: null,
  staging_operation_hash: null,
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

    // Both contracts initialized
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
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
          return { initialized: true, active: true };
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
          return { initialized: true, active: true };
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

    getRpFromContractMock.mockImplementation(
      (_rpId: unknown, contractAddress: string) => {
        if (contractAddress === productionContract) {
          return { initialized: true, active: true };
        }
        return { initialized: true, active: true };
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
    });

    const res = await GET(createRequest(), ctx);
    expect(res.status).toBe(200);

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
          return { initialized: true, active: true };
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
          return { initialized: true, active: true };
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
          return { initialized: true, active: true };
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
