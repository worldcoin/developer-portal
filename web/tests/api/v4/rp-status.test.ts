import { GET } from "@/api/v4/rp-status/[rp_id]";
import { RpRegistrationStatus } from "@/api/helpers/rp-utils";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistration = jest.fn();
const UpdateRpStatus = jest.fn();
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
    operation_hash: string | null;
    mode: string;
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
});

// #region Pending timeout tests
describe("/api/v4/rp-status [pending timeout]", () => {
  it("transitions to failed after 5 minutes when not initialized on-chain", async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    GetRpRegistration.mockResolvedValue({
      rp_registration_by_pk: makeDbRecord({
        status: "pending",
        created_at: sixMinutesAgo,
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
  });
});
// #endregion
