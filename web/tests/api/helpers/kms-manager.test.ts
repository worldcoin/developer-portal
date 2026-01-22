import {
  createManagerKey,
  getManagerAddress,
  getManagerPublicKey,
  signWithManagerKey,
  signTypedDataWithManagerKey,
  scheduleManagerKeyDeletion,
} from "@/api/helpers/kms-manager";
import { KMSClient } from "@aws-sdk/client-kms";

// Mock the KMS client
jest.mock("@aws-sdk/client-kms", () => {
  const mockSend = jest.fn();
  return {
    KMSClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    CreateKeyCommand: jest.fn().mockImplementation((input) => ({
      input,
      _type: "CreateKeyCommand",
    })),
    GetPublicKeyCommand: jest.fn().mockImplementation((input) => ({
      input,
      _type: "GetPublicKeyCommand",
    })),
    SignCommand: jest.fn().mockImplementation((input) => ({
      input,
      _type: "SignCommand",
    })),
    ScheduleKeyDeletionCommand: jest.fn().mockImplementation((input) => ({
      input,
      _type: "ScheduleKeyDeletionCommand",
    })),
  };
});

// Mock the ethereum-utils
jest.mock("@/api/helpers/ethereum-utils", () => ({
  getEthAddressFromKMS: jest.fn(),
  createKmsSignature: jest.fn(),
}));

import {
  getEthAddressFromKMS,
  createKmsSignature,
} from "@/api/helpers/ethereum-utils";

jest.mock(
  "@/lib/logger",
  () => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  }),
  { virtual: true },
);

describe("kms-manager", () => {
  let mockClient: KMSClient;
  let mockSend: jest.Mock;
  const mockGetEthAddressFromKMS = getEthAddressFromKMS as jest.Mock;
  const mockCreateKmsSignature = createKmsSignature as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new KMSClient({});
    mockSend = (mockClient as unknown as { send: jest.Mock }).send;
  });

  describe("createManagerKey", () => {
    it("should create a key and return key info", async () => {
      const mockKeyId = "test-key-id-12345";
      const mockCreatedAt = new Date("2024-01-01T00:00:00Z");
      const mockAddress = "0x1234567890123456789012345678901234567890";

      mockSend.mockResolvedValueOnce({
        KeyMetadata: {
          KeyId: mockKeyId,
          CreationDate: mockCreatedAt,
        },
      });

      mockGetEthAddressFromKMS.mockResolvedValueOnce(mockAddress);

      const result = await createManagerKey(mockClient, "rp-123");

      expect(result).toBeDefined();
      expect(result?.keyId).toBe(mockKeyId);
      expect(result?.createdAt).toBe(mockCreatedAt);
      expect(result?.address).toBe(mockAddress);
    });

    it("should return undefined when KeyMetadata is missing", async () => {
      mockSend.mockResolvedValueOnce({
        KeyMetadata: undefined,
      });

      const result = await createManagerKey(mockClient, "rp-123");

      expect(result).toBeUndefined();
    });

    it("should return undefined when CreateKeyCommand throws", async () => {
      mockSend.mockRejectedValueOnce(new Error("KMS error"));

      const result = await createManagerKey(mockClient, "rp-123");

      expect(result).toBeUndefined();
    });

    it("should schedule key deletion and return undefined when getEthAddressFromKMS fails", async () => {
      mockSend.mockResolvedValueOnce({
        KeyMetadata: {
          KeyId: "test-key-id",
          CreationDate: new Date(),
        },
      });

      // For ScheduleKeyDeletionCommand
      mockSend.mockResolvedValueOnce({});

      mockGetEthAddressFromKMS.mockRejectedValueOnce(
        new Error("Address error"),
      );

      const result = await createManagerKey(mockClient, "rp-123");

      expect(result).toBeUndefined();
      // Verify cleanup was attempted - second call should be ScheduleKeyDeletionCommand
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0]).toMatchObject({
        input: {
          KeyId: "test-key-id",
          PendingWindowInDays: 7,
        },
      });
    });
  });

  describe("getManagerAddress", () => {
    it("should return the Ethereum address", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      mockGetEthAddressFromKMS.mockResolvedValueOnce(mockAddress);

      const result = await getManagerAddress(mockClient, "test-key-id");

      expect(result).toBe(mockAddress);
    });

    it("should return undefined on error", async () => {
      mockGetEthAddressFromKMS.mockRejectedValueOnce(new Error("KMS error"));

      const result = await getManagerAddress(mockClient, "test-key-id");

      expect(result).toBeUndefined();
    });
  });

  describe("getManagerPublicKey", () => {
    it("should return the public key", async () => {
      const mockPublicKey = new Uint8Array([1, 2, 3, 4]);

      mockSend.mockResolvedValueOnce({
        PublicKey: mockPublicKey,
      });

      const result = await getManagerPublicKey(mockClient, "test-key-id");

      expect(result).toEqual(mockPublicKey);
    });

    it("should return undefined when PublicKey is missing", async () => {
      mockSend.mockResolvedValueOnce({
        PublicKey: undefined,
      });

      const result = await getManagerPublicKey(mockClient, "test-key-id");

      expect(result).toBeUndefined();
    });

    it("should return undefined on error", async () => {
      mockSend.mockRejectedValueOnce(new Error("KMS error"));

      const result = await getManagerPublicKey(mockClient, "test-key-id");

      expect(result).toBeUndefined();
    });
  });

  describe("signWithManagerKey", () => {
    it("should return undefined for invalid digest length", async () => {
      const invalidDigest = new Uint8Array(31); // Wrong length

      const result = await signWithManagerKey(
        mockClient,
        "test-key-id",
        invalidDigest,
      );

      expect(result).toBeUndefined();
    });

    it("should return signature on success", async () => {
      const digest = new Uint8Array(32);
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockSignature = {
        r: "0x" + "11".repeat(32),
        s: "0x" + "22".repeat(32),
        v: 27,
        serialized: "0x" + "11".repeat(32) + "22".repeat(32) + "1b",
      };

      mockGetEthAddressFromKMS.mockResolvedValueOnce(mockAddress);
      mockCreateKmsSignature.mockResolvedValueOnce(mockSignature);

      const result = await signWithManagerKey(
        mockClient,
        "test-key-id",
        digest,
      );

      expect(result).toEqual(mockSignature);
      expect(mockCreateKmsSignature).toHaveBeenCalledWith(
        mockClient,
        "test-key-id",
        digest,
        mockAddress,
      );
    });

    it("should return undefined on error", async () => {
      const digest = new Uint8Array(32);
      mockGetEthAddressFromKMS.mockRejectedValueOnce(new Error("Sign error"));

      const result = await signWithManagerKey(
        mockClient,
        "test-key-id",
        digest,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("signTypedDataWithManagerKey", () => {
    const testDomain = {
      name: "TestContract",
      version: "1",
      chainId: 1,
      verifyingContract: "0x1234567890123456789012345678901234567890",
    };

    const testTypes = {
      TestMessage: [
        { name: "value", type: "uint256" },
        { name: "data", type: "string" },
      ],
    };

    const testMessage = {
      value: 123,
      data: "test",
    };

    it("should return signature on success", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockSignature = {
        r: "0x" + "11".repeat(32),
        s: "0x" + "22".repeat(32),
        v: 27,
        serialized: "0x" + "11".repeat(32) + "22".repeat(32) + "1b",
      };

      mockGetEthAddressFromKMS.mockResolvedValueOnce(mockAddress);
      mockCreateKmsSignature.mockResolvedValueOnce(mockSignature);

      const result = await signTypedDataWithManagerKey(
        mockClient,
        "test-key-id",
        testDomain,
        testTypes,
        testMessage,
      );

      expect(result).toEqual(mockSignature);
      expect(mockCreateKmsSignature).toHaveBeenCalledWith(
        mockClient,
        "test-key-id",
        expect.any(Uint8Array), // The hash bytes
        mockAddress,
      );
    });

    it("should return undefined on error", async () => {
      mockGetEthAddressFromKMS.mockRejectedValueOnce(new Error("Sign error"));

      const result = await signTypedDataWithManagerKey(
        mockClient,
        "test-key-id",
        testDomain,
        testTypes,
        testMessage,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("scheduleManagerKeyDeletion", () => {
    it("should call ScheduleKeyDeletionCommand", async () => {
      mockSend.mockResolvedValueOnce({});

      await scheduleManagerKeyDeletion(mockClient, "test-key-id");

      expect(mockSend).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockSend.mockRejectedValueOnce(new Error("KMS error"));

      // Should not throw
      await expect(
        scheduleManagerKeyDeletion(mockClient, "test-key-id"),
      ).resolves.not.toThrow();
    });
  });
});
