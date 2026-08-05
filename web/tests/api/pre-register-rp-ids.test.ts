import { POST } from "@/api/_pre-register-rp-ids";
import { NextRequest } from "next/server";

// #region Mocks
const GetAppInfo = jest.fn();
jest.mock("@/api/hasura/register-rp/graphql/get-app-info.generated", () => ({
  getSdk: () => ({ GetAppInfo }),
}));

const FetchRpRegistration = jest.fn();
jest.mock("@/api/helpers/graphql/fetch-rp-registration.generated", () => ({
  getSdk: () => ({ FetchRpRegistration }),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
}));

const resolveManagerAddressMock = jest.fn();
jest.mock("@/api/helpers/rp-manager", () => ({
  resolveManagerAddress: (...args: unknown[]) =>
    resolveManagerAddressMock(...args),
}));

const submitRegisterRpTransactionMock = jest.fn();
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitRegisterRpTransaction: (...args: unknown[]) =>
    submitRegisterRpTransactionMock(...args),
}));

const getRpFromContractMock = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => getRpFromContractMock(...args),
}));

const getRpRegistryConfigMock = jest.fn();
jest.mock("@/api/helpers/rp-utils", () => {
  const actual = jest.requireActual("@/api/helpers/rp-utils");
  return {
    ...actual,
    getRpRegistryConfig: () => getRpRegistryConfigMock(),
  };
});

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_00000000000000000000000000000001";
const managerAddress = "0x2222222222222222222222222222222222222222";
const placeholderSigner = "0x000000000000000000000000000000000000dEaD";

const createRequest = (body: unknown) =>
  new NextRequest("https://cdn.test.com/api/_pre-register-rp-ids", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    }),
    body: JSON.stringify(body),
  });

// The handler's return type is nullable because protectInternalEndpoint's
// errorResponse is; every call here is authenticated, so narrow once.
const post = async (body: unknown) => {
  const res = await POST(createRequest(body));
  expect(res).not.toBeNull();
  return res!;
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "test_secret";
  process.env.ENABLE_RP_ID_PRE_REGISTRATION = "true";
  process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID =
    "arn:aws:kms:eu-west-1:000000000000:key/shared-manager";
  process.env.RP_ID_PRE_REGISTRATION_SIGNER = placeholderSigner;

  getRpRegistryConfigMock.mockReturnValue({
    contractAddress: "0xcontract",
    kmsRegion: "eu-west-1",
  });
  resolveManagerAddressMock.mockResolvedValue(managerAddress);
  GetAppInfo.mockResolvedValue({
    app: [{ id: appId, is_staging: false, app_metadata: [{ name: "Test" }] }],
  });
  FetchRpRegistration.mockResolvedValue({ rp_registration: [] });
  getRpFromContractMock.mockResolvedValue({
    initialized: false,
    active: false,
    manager: `0x${"0".repeat(40)}`,
    signer: `0x${"0".repeat(40)}`,
  });
  submitRegisterRpTransactionMock.mockResolvedValue("0xclaimop");
});

// #region Kill switch and configuration guards
describe("/api/_pre-register-rp-ids [guards]", () => {
  it("refuses to run when the kill switch is off", async () => {
    delete process.env.ENABLE_RP_ID_PRE_REGISTRATION;

    const res = await post({ app_ids: [appId] });

    expect(res.status).toBe(503);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("refuses to run without a shared manager key", async () => {
    delete process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID;

    const res = await post({ app_ids: [appId] });

    expect(res.status).toBe(500);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("refuses a zero-address placeholder signer", async () => {
    // A zero signer would be accepted by the contract and leave an RP nobody
    // can ever sign for.
    process.env.RP_ID_PRE_REGISTRATION_SIGNER = `0x${"0".repeat(40)}`;

    const res = await post({ app_ids: [appId] });

    expect(res.status).toBe(500);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("refuses to claim when our own manager address cannot be resolved", async () => {
    // Without it, "already ours" is indistinguishable from "someone else's".
    resolveManagerAddressMock.mockResolvedValue(null);

    const res = await post({ app_ids: [appId] });

    expect(res.status).toBe(503);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects a batch larger than the per-call ceiling", async () => {
    const tooMany = Array.from(
      { length: 26 },
      (_, i) => `app_${String(i).padStart(32, "0")}`,
    );

    const res = await post({ app_ids: tooMany });

    expect(res.status).toBe(400);
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Dry run is the default
describe("/api/_pre-register-rp-ids [dry run]", () => {
  it("reports what it would claim without submitting anything", async () => {
    const res = await post({ app_ids: [appId] });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dry_run).toBe(true);
    expect(body.counts).toEqual({ would_claim: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("only submits when dry_run is explicitly false", async () => {
    const res = await post({ app_ids: [appId], dry_run: false });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.counts).toEqual({ claimed: 1 });
    expect(submitRegisterRpTransactionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        managerAddress,
        signerAddress: placeholderSigner,
      }),
    );
  });
});
// #endregion

// #region Per-app skip decisions
describe("/api/_pre-register-rp-ids [skips]", () => {
  const run = () => post({ app_ids: [appId], dry_run: false });

  it("skips an app that already has a Portal registration", async () => {
    FetchRpRegistration.mockResolvedValue({
      rp_registration: [{ rp_id: "rp_0123456789abcdef" }],
    });

    const body = await (await run()).json();

    expect(body.counts).toEqual({ skipped_already_registered_in_portal: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("skips staging apps, which never migrate", async () => {
    GetAppInfo.mockResolvedValue({
      app: [{ id: appId, is_staging: true, app_metadata: [{ name: "Test" }] }],
    });

    const body = await (await run()).json();

    expect(body.counts).toEqual({ skipped_staging: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("skips an id we already claimed, so repeated runs are idempotent", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: managerAddress,
      signer: placeholderSigner,
    });

    const body = await (await run()).json();

    expect(body.counts).toEqual({ skipped_already_claimed_by_us: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("reports an id already squatted by a foreign manager", async () => {
    getRpFromContractMock.mockResolvedValue({
      initialized: true,
      active: true,
      manager: "0x00000000000000000000000000000000000000ff",
      signer: "0x00000000000000000000000000000000000000ee",
    });

    const body = await (await run()).json();

    expect(body.counts).toEqual({ skipped_taken_by_foreign_manager: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("does not claim on a failed on-chain read", async () => {
    // register() reverts with IdAlreadyInUse if the id is taken, so a blind
    // submission after a failed read just burns gas.
    getRpFromContractMock.mockRejectedValue(new Error("rpc timeout"));

    const body = await (await run()).json();

    expect(body.counts).toEqual({ failed_rpc: 1 });
    expect(submitRegisterRpTransactionMock).not.toHaveBeenCalled();
  });

  it("records a submission failure without aborting the rest of the batch", async () => {
    const secondAppId = "app_00000000000000000000000000000002";
    submitRegisterRpTransactionMock
      .mockRejectedValueOnce(new Error("bundler down"))
      .mockResolvedValueOnce("0xclaimop");

    const res = await post({
      app_ids: [appId, secondAppId],
      dry_run: false,
    });
    const body = await res.json();

    expect(body.counts).toEqual({ failed_submission: 1, claimed: 1 });
  });
});
// #endregion
