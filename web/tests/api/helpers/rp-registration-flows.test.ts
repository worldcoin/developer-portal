import { submitManagedSignerRotation } from "@/api/helpers/rp-registration-flows";

// #region Mocks
const mockGetRpRegistryConfig = jest.fn();
const mockGetRpRegistration = jest.fn();
const mockClaimRotationSlot = jest.fn();

jest.mock("@/api/helpers/rp-utils", () => ({
  RpRegistrationStatus: {
    Pending: "pending",
    Registered: "registered",
    Failed: "failed",
    Deactivated: "deactivated",
  },
  generateRpIdString: jest.fn(),
  getRpRegistryConfig: () => mockGetRpRegistryConfig(),
  getStagingRpRegistryConfig: jest.fn(),
  parseRpId: jest.fn(),
}));

jest.mock(
  "@/api/hasura/rotate-signer-key/graphql/get-rp-registration.generated",
  () => ({
    getSdk: () => ({
      GetRpRegistration: mockGetRpRegistration,
    }),
  }),
);

jest.mock(
  "@/api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated",
  () => ({
    getSdk: () => ({
      ClaimRotationSlot: mockClaimRotationSlot,
    }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const makeRegistration = (
  appOverrides: Partial<{
    status: string;
    is_archived: boolean;
    deleted_at: string | null;
  }> = {},
) => ({
  rp_id: "rp_1234567890abcdef",
  app_id: "app_11223344556677889900aabbccddeeff",
  mode: "managed",
  status: "registered",
  signer_address: "0x0000000000000000000000000000000000000001",
  manager_kms_key_id: "test-kms-key",
  operation_hash: null,
  app: {
    team_id: "team_123",
    status: "active",
    is_archived: false,
    deleted_at: null,
    ...appOverrides,
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockGetRpRegistryConfig.mockReturnValue({
    kmsRegion: "us-east-1",
    contractAddress: "0x0000000000000000000000000000000000000000",
    domainSeparator: "0x00",
    updateRpTypehash: "0x00",
  });
});

// #region Managed signer rotation guards
describe("submitManagedSignerRotation", () => {
  it("rejects deleted apps before claiming the rotation slot", async () => {
    mockGetRpRegistration.mockResolvedValue({
      rp_registration: [
        makeRegistration({ deleted_at: "2026-07-07T00:00:00.000Z" }),
      ],
    });

    const result = await submitManagedSignerRotation({
      client: {} as never,
      appId: "app_11223344556677889900aabbccddeeff",
      newSignerAddress: "0x0000000000000000000000000000000000000002",
    });

    expect(result).toEqual({
      ok: false,
      code: "app_not_active",
      detail: "App not found. App may be inactive, archived, or deleted.",
    });
    expect(mockClaimRotationSlot).not.toHaveBeenCalled();
  });
});
// #endregion
