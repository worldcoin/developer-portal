import {
  buildRegisterManyCalldata,
  hashEntryPointUserOperation,
  prepareRpBatch,
} from "@/api/helpers/rp-backfill-transactions";
import {
  buildUserOperation,
  getRegisterRpNonce,
  hashSafeUserOp,
} from "@/api/helpers/user-operation";
import type { RpRegistryConfig } from "@/api/helpers/rp-utils";
import { RP_BACKFILL_PLACEHOLDER_SIGNER } from "@/lib/rp-id-backfill";
import { AbiCoder, Interface, keccak256, solidityPacked } from "ethers";
import RP_ABI from "@/api/helpers/abi/rp-registry.json";
import type { KMSClient } from "@aws-sdk/client-kms";

// #region Mocks
jest.mock("server-only", () => ({}));
const estimate = jest.fn();
const sign = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  estimateUserOperationGas: (...args: unknown[]) => estimate(...args),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  signEthDigestWithKms: (...args: unknown[]) => sign(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const manager = `0x${"11".repeat(20)}`;
const config: RpRegistryConfig = {
  contractAddress: `0x${"22".repeat(20)}`,
  safeAddress: `0x${"33".repeat(20)}`,
  entryPointAddress: `0x${"44".repeat(20)}`,
  safe4337ModuleAddress: `0x${"55".repeat(20)}`,
  safeOwnerKmsKeyId: "safe-key",
  kmsRegion: "eu-west-1",
  domainSeparator: `0x${"66".repeat(32)}`,
  updateRpTypehash: `0x${"77".repeat(32)}`,
  credentialSchemaIssuerRegistryAddress: `0x${"88".repeat(20)}`,
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  estimate.mockResolvedValue({
    callGasLimit: "0x989680",
    verificationGasLimit: "0x186a0",
    preVerificationGas: "0xc350",
  });
  sign.mockResolvedValue({ serialized: `0x${"11".repeat(64)}1b` });
});

// #region Calldata and operation identity
describe("RP backfill transaction preparation", () => {
  it("encodes a native 100-ID batch with shared manager, placeholder signer and empty domains", () => {
    const ids = Array.from({ length: 100 }, (_, i) => BigInt(i + 1));
    const decoded = new Interface(RP_ABI).decodeFunctionData(
      "registerMany",
      buildRegisterManyCalldata(ids, manager),
    );
    expect([...decoded[0]]).toEqual(ids);
    expect([...decoded[1]]).toEqual(ids.map(() => manager));
    expect([...decoded[2]]).toEqual(
      ids.map(() => RP_BACKFILL_PLACEHOLDER_SIGNER),
    );
    expect([...decoded[3]]).toEqual(ids.map(() => ""));
    expect(
      new Interface(RP_ABI).decodeFunctionData(
        "registerMany",
        buildRegisterManyCalldata([101n], manager),
      )[0],
    ).toHaveLength(1);
    expect(() => buildRegisterManyCalldata([1n, 1n], manager)).toThrow(
      "distinct",
    );
    expect(() => buildRegisterManyCalldata([], manager)).toThrow("distinct");
  });

  it("uses the EntryPoint v0.7 hash, not the Safe signing digest, and excludes the signature", () => {
    const op = buildUserOperation(
      config.safeAddress,
      "0x1234",
      getRegisterRpNonce(1n),
      new Date("2026-09-16T00:00:00Z"),
      new Date("2026-09-16T00:30:00Z"),
    );
    const abi = AbiCoder.defaultAbiCoder();
    const packedHash = keccak256(
      abi.encode(
        [
          "address",
          "uint256",
          "bytes32",
          "bytes32",
          "bytes32",
          "uint256",
          "bytes32",
          "bytes32",
        ],
        [
          op.sender,
          op.nonce,
          keccak256("0x"),
          keccak256(op.callData),
          solidityPacked(
            ["uint128", "uint128"],
            [op.verificationGasLimit, op.callGasLimit],
          ),
          op.preVerificationGas,
          solidityPacked(
            ["uint128", "uint128"],
            [op.maxPriorityFeePerGas, op.maxFeePerGas],
          ),
          keccak256("0x"),
        ],
      ),
    );
    const expected = keccak256(
      abi.encode(
        ["bytes32", "address", "uint256"],
        [packedHash, config.entryPointAddress, 480],
      ),
    );
    expect(hashEntryPointUserOperation(op, config.entryPointAddress)).toBe(
      expected,
    );
    expect(
      hashEntryPointUserOperation(
        { ...op, signature: "0x1234" },
        config.entryPointAddress,
      ),
    ).toBe(expected);
    expect(
      hashSafeUserOp(
        op,
        480,
        config.safe4337ModuleAddress,
        config.entryPointAddress,
      ),
    ).not.toBe(expected);
  });

  it("estimates batch gas before signing and prepares independent nonce keys without broadcasting", async () => {
    const first = await prepareRpBatch(
      config,
      [1n, 2n],
      manager,
      {} as KMSClient,
    );
    const second = await prepareRpBatch(config, [3n], manager, {} as KMSClient);
    expect(BigInt(first.userOp.callGasLimit)).toBe(12_000_000n);
    expect(first.requestId).toBe(
      hashEntryPointUserOperation(first.userOp, config.entryPointAddress),
    );
    expect(first.userOp.nonce.slice(0, -16)).not.toBe(
      second.userOp.nonce.slice(0, -16),
    );
    expect(estimate.mock.invocationCallOrder[0]).toBeLessThan(
      sign.mock.invocationCallOrder[0],
    );
    expect(estimate.mock.calls[0][0].callGasLimit).toBe("0x0");
  });

  it("does not produce a request when signing fails", async () => {
    sign.mockResolvedValueOnce(undefined);
    await expect(
      prepareRpBatch(config, [1n], manager, {} as KMSClient),
    ).rejects.toThrow("sign");
  });
});
// #endregion
