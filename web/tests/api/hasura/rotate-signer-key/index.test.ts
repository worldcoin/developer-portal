import { POST } from "@/api/hasura/rotate-signer-key";
import { RpRegistrationStatus } from "@/api/helpers/rp-utils";
import { NextRequest } from "next/server";

// #region Mocks
const GetRpRegistration = jest.fn();
const ClaimRotationSlot = jest.fn();
const RevertRotationStatus = jest.fn();
const UpdateRotationResult = jest.fn();
const UpdateStagingRotationResult = jest.fn();
const CheckUserInApp = jest.fn();
const submitRotateSignerTransactionMock = jest.fn();
const isWorldId40EnabledServerMock = jest.fn();
const getRpRegistryConfigMock = jest.fn();
const getStagingRpRegistryConfigMock = jest.fn();

jest.mock("../../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../../api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../../api/helpers/rp-transactions", () => ({
  submitRotateSignerTransaction: (...args: unknown[]) =>
    submitRotateSignerTransactionMock(...args),
}));

jest.mock("../../../../api/helpers/rp-utils", () => {
  const actual = jest.requireActual("../../../../api/helpers/rp-utils");
  return {
    ...actual,
    getRpRegistryConfig: () => getRpRegistryConfigMock(),
    getStagingRpRegistryConfig: () => getStagingRpRegistryConfigMock(),
  };
});

jest.mock("../../../../lib/feature-flags/world-id-4-0/server", () => ({
  isWorldId40EnabledServer: (...args: unknown[]) =>
    isWorldId40EnabledServerMock(...args),
}));

jest.mock("../../../../api/hasura/graphql/checkUserInApp.generated", () => ({
  getSdk: () => ({ CheckUserInApp }),
}));

jest.mock(
  "../../../../api/hasura/rotate-signer-key/graphql/get-rp-registration.generated",
  () => ({
    getSdk: () => ({ GetRpRegistration }),
  }),
);

jest.mock(
  "../../../../api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated",
  () => ({
    getSdk: () => ({ ClaimRotationSlot }),
  }),
);

jest.mock(
  "../../../../api/hasura/rotate-signer-key/graphql/revert-rotation-status.generated",
  () => ({
    getSdk: () => ({ RevertRotationStatus }),
  }),
);

jest.mock(
  "../../../../api/hasura/rotate-signer-key/graphql/update-rotation-result.generated",
  () => ({
    getSdk: () => ({ UpdateRotationResult }),
  }),
);

jest.mock(
  "../../../../api/hasura/rotate-signer-key/graphql/update-staging-rotation-result.generated",
  () => ({
    getSdk: () => ({ UpdateStagingRotationResult }),
  }),
);
// #endregion

// #region Test Data
const rpId = "rp_abc123def4560000";
const appId = "app_a8fb422028b239a336fd065511294c47";
const teamId = "team_1234";
const userId = "usr_test";
const newSigner = "0x1111111111111111111111111111111111111111";
const oldSigner = "0x2222222222222222222222222222222222222222";
const productionHash = "0xproduction_op_hash";
const stagingHash = "0xstaging_op_hash";

const primaryConfig = {
  safeOwnerKmsKeyId: "key-primary",
  contractAddress: "0xProductionContract",
  safeAddress: "0xSafe",
  entryPointAddress: "0xEntryPoint",
  safe4337ModuleAddress: "0xSafe4337",
  kmsRegion: "us-east-1",
  domainSeparator: "0xdomain",
  updateRpTypehash: "0xtypehash",
  credentialSchemaIssuerRegistryAddress: "0xCSIR",
};

const stagingConfig = {
  ...primaryConfig,
  contractAddress: "0xStagingContract",
  domainSeparator: "0xstagingdomain",
  updateRpTypehash: "0xstagingtypehash",
};

const internalSecret = "internal-secret";

const createRequest = () =>
  new NextRequest(
    new URL("/api/hasura/rotate-signer-key", "http://localhost:3000"),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${internalSecret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: { name: "rotate_signer_key" },
        session_variables: { "x-hasura-user-id": userId },
        input: { app_id: appId, new_signer_address: newSigner },
      }),
    },
  );

const setHappyPathMocks = () => {
  GetRpRegistration.mockResolvedValue({
    rp_registration: [
      {
        rp_id: rpId,
        app_id: appId,
        mode: "managed",
        status: "registered",
        signer_address: oldSigner,
        manager_kms_key_id: "kms-manager",
        operation_hash: "0xprior",
        app: { team_id: teamId },
      },
    ],
  });
  CheckUserInApp.mockResolvedValue({ team: [{ id: teamId }] });
  isWorldId40EnabledServerMock.mockResolvedValue(true);
  ClaimRotationSlot.mockResolvedValue({
    update_rp_registration: { affected_rows: 1, returning: [] },
  });
  UpdateRotationResult.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
  UpdateStagingRotationResult.mockResolvedValue({
    update_rp_registration_by_pk: { rp_id: rpId },
  });
  getRpRegistryConfigMock.mockReturnValue(primaryConfig);
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = internalSecret;
  process.env.NEXT_PUBLIC_APP_ENV = "production";
  global.RedisClient?.flushall();
});

// #region Staging persistence on production env
describe("/api/hasura/rotate-signer-key [staging persistence — production env]", () => {
  it("persists staging_status=pending and the staging op hash when staging tx succeeds", async () => {
    setHappyPathMocks();
    getStagingRpRegistryConfigMock.mockReturnValue(stagingConfig);
    submitRotateSignerTransactionMock
      .mockResolvedValueOnce(productionHash) // production
      .mockResolvedValueOnce(stagingHash); // staging

    const res = await POST(createRequest());

    expect(res?.status).toBe(200);
    expect(submitRotateSignerTransactionMock).toHaveBeenCalledTimes(2);
    expect(UpdateStagingRotationResult).toHaveBeenCalledTimes(1);
    expect(UpdateStagingRotationResult).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Pending,
      staging_operation_hash: stagingHash,
    });
  });

  it("persists staging_status=failed when the staging tx submission throws", async () => {
    setHappyPathMocks();
    getStagingRpRegistryConfigMock.mockReturnValue(stagingConfig);
    submitRotateSignerTransactionMock
      .mockResolvedValueOnce(productionHash)
      .mockRejectedValueOnce(new Error("bundler down"));

    const res = await POST(createRequest());

    expect(res?.status).toBe(200);
    expect(UpdateStagingRotationResult).toHaveBeenCalledTimes(1);
    expect(UpdateStagingRotationResult).toHaveBeenCalledWith({
      rp_id: rpId,
      staging_status: RpRegistrationStatus.Failed,
      staging_operation_hash: null,
    });
  });

  it("does not call UpdateStagingRotationResult when staging config is absent", async () => {
    setHappyPathMocks();
    getStagingRpRegistryConfigMock.mockReturnValue(null);
    submitRotateSignerTransactionMock.mockResolvedValueOnce(productionHash);

    const res = await POST(createRequest());

    expect(res?.status).toBe(200);
    expect(submitRotateSignerTransactionMock).toHaveBeenCalledTimes(1);
    expect(UpdateStagingRotationResult).not.toHaveBeenCalled();
  });

  it("does not fail the rotation when persisting staging result throws", async () => {
    setHappyPathMocks();
    getStagingRpRegistryConfigMock.mockReturnValue(stagingConfig);
    submitRotateSignerTransactionMock
      .mockResolvedValueOnce(productionHash)
      .mockResolvedValueOnce(stagingHash);
    UpdateStagingRotationResult.mockRejectedValue(new Error("hasura blip"));

    const res = await POST(createRequest());

    expect(res?.status).toBe(200);
    const body = await res!.json();
    expect(body.operation_hash).toBe(productionHash);
  });
});
// #endregion

// #region Staging persistence skipped on non-production env
describe("/api/hasura/rotate-signer-key [staging persistence — non-production env]", () => {
  it("skips staging entirely outside the production env", async () => {
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    setHappyPathMocks();
    getStagingRpRegistryConfigMock.mockReturnValue(stagingConfig);
    submitRotateSignerTransactionMock.mockResolvedValueOnce(productionHash);

    const res = await POST(createRequest());

    expect(res?.status).toBe(200);
    expect(submitRotateSignerTransactionMock).toHaveBeenCalledTimes(1);
    expect(getStagingRpRegistryConfigMock).not.toHaveBeenCalled();
    expect(UpdateStagingRotationResult).not.toHaveBeenCalled();
  });
});
// #endregion
