import { submitRegisterRpTransaction } from "@/api/helpers/rp-transactions";
import type { RpRegistryConfig } from "@/api/helpers/rp-utils";
import type { KMSClient } from "@aws-sdk/client-kms";
import { MaxUint256 } from "ethers";

// #region Mocks
const getERC20Allowance = jest.fn();
const getUserOperationReceipt = jest.fn();
const sendUserOperation = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getERC20Allowance: (...args: unknown[]) => getERC20Allowance(...args),
  getRpNonceFromContract: jest.fn(),
  getUserOperationReceipt: (...args: unknown[]) =>
    getUserOperationReceipt(...args),
  sendUserOperation: (...args: unknown[]) => sendUserOperation(...args),
}));

const signEthDigestWithKms = jest.fn();
jest.mock("@/api/helpers/kms-eth", () => ({
  signEthDigestWithKms: (...args: unknown[]) => signEthDigestWithKms(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const CONFIG: RpRegistryConfig = {
  safeOwnerKmsKeyId: "test-kms-key-id",
  contractAddress: `0x${"aa".repeat(20)}`,
  safeAddress: `0x${"bb".repeat(20)}`,
  entryPointAddress: `0x${"cc".repeat(20)}`,
  safe4337ModuleAddress: `0x${"dd".repeat(20)}`,
  kmsRegion: "us-east-1",
  domainSeparator: `0x${"11".repeat(32)}`,
  updateRpTypehash: `0x${"22".repeat(32)}`,
  credentialSchemaIssuerRegistryAddress: `0x${"ee".repeat(20)}`,
};

const PARAMS = {
  rpId: 123456789n,
  managerAddress: `0x${"12".repeat(20)}`,
  signerAddress: `0x${"34".repeat(20)}`,
  appName: "Test App",
  kmsClient: {} as KMSClient,
};

const APPROVAL_HASH = `0x${"a1".repeat(32)}`;
const REGISTRATION_HASH = `0x${"b2".repeat(32)}`;

const minedReceipt = (success: boolean) => ({
  entryPoint: CONFIG.entryPointAddress,
  userOpHash: APPROVAL_HASH,
  sender: CONFIG.safeAddress,
  nonce: "0x1",
  actualGasUsed: "0x1",
  actualGasCost: "0x1",
  success,
  logs: [],
  receipt: {
    transactionHash: `0x${"c3".repeat(32)}`,
    transactionIndex: "0x0",
    blockHash: `0x${"d4".repeat(32)}`,
  },
});
// #endregion

beforeEach(() => {
  // resetAllMocks (not clearAllMocks) so per-test mockResolvedValueOnce
  // queues never leak across tests.
  jest.resetAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-07-21T12:00:00Z"));
  signEthDigestWithKms.mockResolvedValue({
    serialized: `0x${"56".repeat(65)}`,
  });
  // First sendUserOperation call is the approval, second the registration.
  sendUserOperation
    .mockResolvedValueOnce({ operationHash: APPROVAL_HASH })
    .mockResolvedValueOnce({ operationHash: REGISTRATION_HASH });
});

afterEach(() => {
  jest.useRealTimers();
});

// #region Allowance already granted
describe("submitRegisterRpTransaction [allowance already granted]", () => {
  it("skips approval and submits registration directly", async () => {
    getERC20Allowance.mockResolvedValue(MaxUint256);

    const hash = await submitRegisterRpTransaction(CONFIG, PARAMS);

    expect(hash).toBe(APPROVAL_HASH); // first mock result = only submission
    expect(sendUserOperation).toHaveBeenCalledTimes(1);
    expect(getUserOperationReceipt).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Approval required
describe("submitRegisterRpTransaction [approval required]", () => {
  beforeEach(() => {
    getERC20Allowance.mockResolvedValue(0n);
  });

  it("waits for the approval to mine before submitting registration", async () => {
    getUserOperationReceipt.mockResolvedValue(minedReceipt(true));

    const hash = await submitRegisterRpTransaction(CONFIG, PARAMS);

    expect(hash).toBe(REGISTRATION_HASH);
    expect(sendUserOperation).toHaveBeenCalledTimes(2);
    expect(getUserOperationReceipt).toHaveBeenCalledWith(APPROVAL_HASH);
    // Registration must not be submitted until after the receipt arrived.
    expect(getUserOperationReceipt.mock.invocationCallOrder[0]).toBeLessThan(
      sendUserOperation.mock.invocationCallOrder[1],
    );
  });

  it("polls until the receipt appears, then proceeds", async () => {
    getUserOperationReceipt
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(minedReceipt(true));

    const promise = submitRegisterRpTransaction(CONFIG, PARAMS);
    // Two null polls -> 1s + 2s backoff before the third (mined) poll.
    await jest.advanceTimersByTimeAsync(1_000);
    await jest.advanceTimersByTimeAsync(2_000);
    const hash = await promise;

    expect(hash).toBe(REGISTRATION_HASH);
    expect(getUserOperationReceipt).toHaveBeenCalledTimes(3);
    expect(sendUserOperation).toHaveBeenCalledTimes(2);
  });

  it("tolerates a transient receipt-poll error and proceeds once mined", async () => {
    getUserOperationReceipt
      .mockRejectedValueOnce(new Error("upstream 502"))
      .mockResolvedValue(minedReceipt(true));

    const promise = submitRegisterRpTransaction(CONFIG, PARAMS);
    await jest.advanceTimersByTimeAsync(1_000);
    const hash = await promise;

    expect(hash).toBe(REGISTRATION_HASH);
    expect(getUserOperationReceipt).toHaveBeenCalledTimes(2);
    expect(sendUserOperation).toHaveBeenCalledTimes(2);
  });

  it("throws and does not submit registration when the approval reverts", async () => {
    getUserOperationReceipt.mockResolvedValue(minedReceipt(false));

    await expect(submitRegisterRpTransaction(CONFIG, PARAMS)).rejects.toThrow(
      /approval UserOperation reverted/,
    );
    expect(sendUserOperation).toHaveBeenCalledTimes(1);
  });

  it("follows the capped backoff schedule and falls back to the allowance when the receipt never surfaces", async () => {
    getERC20Allowance
      .mockReset()
      .mockResolvedValueOnce(0n) // initial gate: approval required
      .mockResolvedValueOnce(MaxUint256); // fallback: approval mined meanwhile
    getUserOperationReceipt.mockResolvedValue(null);

    const promise = submitRegisterRpTransaction(CONFIG, PARAMS);
    // Poll at t=0, then sleeps of 1s, 2s, 4s, 5s (cap), 3s (clamped to the
    // 15s deadline) with a poll after each — 6 polls total.
    for (const step of [1_000, 2_000, 4_000, 5_000, 3_000]) {
      await jest.advanceTimersByTimeAsync(step);
    }
    const hash = await promise;

    expect(hash).toBe(REGISTRATION_HASH);
    expect(getUserOperationReceipt).toHaveBeenCalledTimes(6);
    expect(sendUserOperation).toHaveBeenCalledTimes(2);
    expect(getERC20Allowance).toHaveBeenCalledTimes(2);
  });

  it("throws and does not submit registration when the receipt never surfaces and the allowance stays ungranted", async () => {
    getERC20Allowance.mockReset().mockResolvedValue(0n);
    getUserOperationReceipt.mockResolvedValue(null);

    const promise = submitRegisterRpTransaction(CONFIG, PARAMS);
    const assertion = expect(promise).rejects.toThrow(
      /allowance not granted after 15000ms/,
    );
    await jest.advanceTimersByTimeAsync(15_000);
    await assertion;

    expect(sendUserOperation).toHaveBeenCalledTimes(1);
  });
});
// #endregion
