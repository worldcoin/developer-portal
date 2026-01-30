#!/usr/bin/env npx tsx

/**
 * E2E Test Script for RP Signer Key Rotation UserOperation
 *
 * This script validates the updateRp UserOp building and signing logic against real contracts.
 * Uses the correct Safe 4337 EIP-712 signing scheme with AWS KMS for signing.
 *
 * Prerequisites:
 * - AWS credentials configured (via SSO: `aws sso login --profile <profile>`)
 * - An existing registered RP on-chain
 *
 * Required Environment Variables:
 *   ALCHEMY_API_KEY       - Alchemy API key for World Chain
 *   KMS_KEY_ID            - AWS KMS key ID/alias for Safe owner key
 *   MANAGER_KMS_KEY_ID    - AWS KMS key ID/alias for manager key (can be same as KMS_KEY_ID for testing)
 *   SAFE_ADDRESS          - Safe wallet address (sender of UserOps)
 *   RP_REGISTRY_ADDRESS   - RpRegistry contract address
 *   RP_ID                 - Numeric RP ID of an existing registered RP
 *
 * Optional Environment Variables:
 *   NEW_SIGNER_ADDRESS    - New signer address (defaults to manager address for testing)
 *   AWS_PROFILE           - AWS SSO profile name (default: "default")
 *   AWS_REGION            - AWS region (default: "us-east-1")
 *   CHAIN_ID              - Chain ID (default: 480 for World Chain Mainnet)
 *
 * Usage:
 *   aws sso login --profile <your-profile>
 *
 *   ALCHEMY_API_KEY=xxx \
 *   KMS_KEY_ID=alias/safe-owner-key \
 *   MANAGER_KMS_KEY_ID=alias/manager-key \
 *   SAFE_ADDRESS=0x... \
 *   RP_REGISTRY_ADDRESS=0x... \
 *   RP_ID=12345 \
 *   AWS_PROFILE=your-profile \
 *   npx tsx web/scripts/e2e-rotate-signer.ts
 */

import {
  GetPublicKeyCommand,
  KMSClient,
  SignCommand,
} from "@aws-sdk/client-kms";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import {
  computeAddress,
  Contract,
  getBytes,
  hexlify,
  JsonRpcProvider,
  recoverAddress,
  Signature,
  toBeHex,
  zeroPadValue,
} from "ethers";

// Import from shared helpers
import RP_REGISTRY_ABI from "../api/helpers/abi/rp-registry.json";
import {
  buildUpdateRpSignerCalldata,
  buildUserOperation,
  encodeSafeUserOpCalldata,
  type GasLimits,
  getTxExpiration,
  getUpdateRpNonce,
  hashSafeUserOp,
  hashUpdateRpTypedData,
  replacePlaceholderWithSignature,
  RP_NO_UPDATE_DOMAIN,
} from "../api/helpers/user-operation";

// ============================================================================
// KMS Signing Utilities (inlined to avoid server-only dependencies)
// ============================================================================

const SECP256K1_N = BigInt(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);
const SECP256K1_N_DIV_2 = SECP256K1_N / 2n;

interface EthSignature {
  r: string;
  s: string;
  v: number;
  serialized: string;
}

function parseDerSignature(derSignature: Uint8Array): {
  r: Uint8Array;
  s: Uint8Array;
} {
  if (derSignature[0] !== 0x30) {
    throw new Error("Invalid DER signature");
  }
  let offset = 2;
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const rLength = derSignature[offset];
  offset++;
  let rRaw = derSignature.slice(offset, offset + rLength);
  offset += rLength;
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const sLength = derSignature[offset];
  offset++;
  let sRaw = derSignature.slice(offset, offset + sLength);

  // Trim leading zeros and pad to 32 bytes
  while (rRaw.length > 1 && rRaw[0] === 0) rRaw = rRaw.slice(1);
  while (sRaw.length > 1 && sRaw[0] === 0) sRaw = sRaw.slice(1);
  const r = new Uint8Array(getBytes(zeroPadValue(hexlify(rRaw), 32)));
  const s = new Uint8Array(getBytes(zeroPadValue(hexlify(sRaw), 32)));
  return { r, s };
}

function normalizeSValue(s: Uint8Array): Uint8Array {
  const sValue = BigInt(hexlify(s));
  if (sValue > SECP256K1_N_DIV_2) {
    const normalized = SECP256K1_N - sValue;
    return new Uint8Array(getBytes(zeroPadValue(toBeHex(normalized), 32)));
  }
  return s;
}

async function getEthAddressFromKMS(
  client: KMSClient,
  keyId: string,
): Promise<string> {
  const { PublicKey } = await client.send(
    new GetPublicKeyCommand({ KeyId: keyId }),
  );
  if (!PublicKey) throw new Error("Failed to get public key from KMS");
  const spkiKey = new Uint8Array(PublicKey);
  const publicKey = spkiKey.slice(spkiKey.length - 65);
  if (publicKey[0] !== 0x04) throw new Error("Invalid public key format");
  return computeAddress(hexlify(publicKey));
}

async function signEthDigestWithKms(
  client: KMSClient,
  keyId: string,
  digest: Uint8Array,
): Promise<EthSignature> {
  const expectedAddress = await getEthAddressFromKMS(client, keyId);

  const { Signature: derSig } = await client.send(
    new SignCommand({
      KeyId: keyId,
      Message: digest,
      MessageType: "DIGEST",
      SigningAlgorithm: "ECDSA_SHA_256",
    }),
  );
  if (!derSig) throw new Error("KMS signing failed");

  const { r, s: rawS } = parseDerSignature(new Uint8Array(derSig));
  const s = normalizeSValue(rawS);
  const rHex = hexlify(r);
  const sHex = hexlify(s);
  const digestHex = hexlify(digest);

  for (const v of [27, 28]) {
    try {
      const sig = Signature.from({ r: rHex, s: sHex, v });
      const recovered = recoverAddress(digestHex, sig);
      if (recovered.toLowerCase() === expectedAddress.toLowerCase()) {
        return { r: rHex, s: sHex, v, serialized: sig.serialized };
      }
    } catch {
      // Try next v
    }
  }
  throw new Error("Failed to recover correct address from signature");
}

// ============================================================================
// Constants
// ============================================================================

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// ============================================================================
// Gas Configuration (for Alchemy bundler - requires non-zero values)
// ============================================================================

const ALCHEMY_GAS_LIMITS: GasLimits = {
  callGasLimit: "0xF4240", // 1,000,000
  verificationGasLimit: "0x186A0", // 100,000
  preVerificationGas: "0x20000", // 131,072 (bundler requires ~85k+)
  maxFeePerGas: "0x5F5E100", // 100,000,000 (0.1 gwei)
  maxPriorityFeePerGas: "0x186A0", // 100,000 (bundler minimum)
};

// ============================================================================
// Configuration (from environment variables)
// ============================================================================

// Required
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const KMS_KEY_ID = process.env.KMS_KEY_ID;
const MANAGER_KMS_KEY_ID = process.env.MANAGER_KMS_KEY_ID;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const RP_REGISTRY_ADDRESS = process.env.RP_REGISTRY_ADDRESS;
const RP_ID = process.env.RP_ID;

// Optional with defaults
const NEW_SIGNER_ADDRESS = process.env.NEW_SIGNER_ADDRESS;
const AWS_PROFILE = process.env.AWS_PROFILE || "default";
const AWS_REGION = process.env.AWS_REGION || "eu-west-1";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "480", 10); // World Chain Mainnet

// Derived URLs
const RPC_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const BUNDLER_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// EntryPoint v0.7
const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// Safe 4337 Module address (same across chains)
const SAFE_4337_MODULE = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226";

// ============================================================================
// Contract Helpers
// ============================================================================

function createRpRegistryContract(
  contractAddress: string,
  provider: JsonRpcProvider,
): Contract {
  return new Contract(contractAddress, RP_REGISTRY_ABI, provider);
}

async function getRpNonceFromContract(
  rpId: bigint,
  contract: Contract,
): Promise<bigint> {
  const result = await contract.nonceOf(rpId);
  return BigInt(result);
}

async function getRpDomainSeparator(contract: Contract): Promise<string> {
  return await contract.domainSeparatorV4();
}

async function getUpdateRpTypehash(contract: Contract): Promise<string> {
  return await contract.UPDATE_RP_TYPEHASH();
}

async function getRpFromContract(
  rpId: bigint,
  contract: Contract,
): Promise<{
  initialized: boolean;
  active: boolean;
  manager: string;
  signer: string;
}> {
  const result = await contract.getRpUnchecked(rpId);
  return {
    initialized: result.initialized,
    active: result.active,
    manager: result.manager,
    signer: result.signer,
  };
}

// ============================================================================
// Main Flow
// ============================================================================

async function main(): Promise<void> {
  console.log("=== E2E RP Signer Rotation Test (KMS Signing) ===\n");

  // Validate required environment variables
  const requiredEnvVars: Record<string, string | undefined> = {
    ALCHEMY_API_KEY,
    KMS_KEY_ID,
    MANAGER_KMS_KEY_ID,
    SAFE_ADDRESS,
    RP_REGISTRY_ADDRESS,
    RP_ID,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("Error: Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\nSee script header for usage instructions.");
    process.exit(1);
  }

  // Setup KMS client with SSO credentials
  console.log("--- AWS KMS Setup ---");
  console.log("AWS Profile:", AWS_PROFILE);
  console.log("AWS Region:", AWS_REGION);
  console.log("Safe Owner KMS Key ID:", KMS_KEY_ID);
  console.log("Manager KMS Key ID:", MANAGER_KMS_KEY_ID);

  const kmsClient = new KMSClient({
    region: AWS_REGION,
    credentials: fromSSO({ profile: AWS_PROFILE }),
  });

  // Get addresses from KMS
  const safeOwnerAddress = await getEthAddressFromKMS(kmsClient, KMS_KEY_ID!);
  const managerAddress = await getEthAddressFromKMS(
    kmsClient,
    MANAGER_KMS_KEY_ID!,
  );
  console.log("Safe Owner Address (from KMS):", safeOwnerAddress);
  console.log("Manager Address (from KMS):", managerAddress);

  // Setup provider
  const provider = new JsonRpcProvider(RPC_URL);

  console.log("\n--- Network Config ---");
  console.log("Network:", "World Chain Mainnet");
  console.log("Chain ID:", CHAIN_ID.toString());
  console.log("RpRegistry:", RP_REGISTRY_ADDRESS);
  console.log("EntryPoint:", ENTRYPOINT_ADDRESS);
  console.log("Safe:", SAFE_ADDRESS);

  // Parse RP ID
  const rpId = BigInt(RP_ID!);
  console.log("\n--- RP Info ---");
  console.log("RP ID:", rpId.toString());

  // Get contract instance
  const contract = createRpRegistryContract(RP_REGISTRY_ADDRESS!, provider);

  // Fetch current RP state
  console.log("\n--- Fetching Current RP State ---");
  const rpState = await getRpFromContract(rpId, contract);
  console.log("Initialized:", rpState.initialized);
  console.log("Active:", rpState.active);
  console.log("Current Manager:", rpState.manager);
  console.log("Current Signer:", rpState.signer);

  if (!rpState.initialized || !rpState.active) {
    console.error("\nError: RP is not initialized or active. Cannot rotate.");
    process.exit(1);
  }

  // New signer address (default to manager address for testing)
  const newSignerAddress = NEW_SIGNER_ADDRESS || managerAddress;
  console.log("\n--- Rotation Data ---");
  console.log("New Signer Address:", newSignerAddress);

  // Fetch contract state for EIP-712 signing
  console.log("\n--- Fetching Contract State for EIP-712 ---");
  const [contractNonce, domainSeparator, updateRpTypehash] = await Promise.all([
    getRpNonceFromContract(rpId, contract),
    getRpDomainSeparator(contract),
    getUpdateRpTypehash(contract),
  ]);
  console.log("Contract Nonce:", contractNonce.toString());
  console.log("Domain Separator:", domainSeparator);
  console.log("UPDATE_RP_TYPEHASH:", updateRpTypehash);

  // Compute EIP-712 typed data hash for manager signature
  console.log("\n--- Computing Manager EIP-712 Hash ---");
  const updateRpParams = {
    rpId,
    oprfKeyId: 0n, // No change
    manager: ADDRESS_ZERO, // No change
    signer: newSignerAddress,
    toggleActive: false, // No change
    unverifiedWellKnownDomain: RP_NO_UPDATE_DOMAIN,
    nonce: contractNonce,
  };
  console.log("UpdateRp Params:", {
    ...updateRpParams,
    rpId: updateRpParams.rpId.toString(),
    nonce: updateRpParams.nonce.toString(),
  });

  const updateRpHash = hashUpdateRpTypedData(
    updateRpParams,
    domainSeparator,
    updateRpTypehash,
  );
  console.log("UpdateRp EIP-712 Hash:", updateRpHash);

  // Sign with manager KMS key
  console.log("\n--- Signing with Manager KMS Key ---");
  const managerSignature = await signEthDigestWithKms(
    kmsClient,
    MANAGER_KMS_KEY_ID!,
    getBytes(updateRpHash),
  );

  if (!managerSignature) {
    console.error("Error: Failed to sign with manager KMS key");
    process.exit(1);
  }
  console.log(
    "Manager Signature:",
    managerSignature.serialized.slice(0, 42) + "...",
  );

  // Build updateRp calldata
  const innerCalldata = buildUpdateRpSignerCalldata(
    rpId,
    newSignerAddress,
    contractNonce,
    managerSignature.serialized,
  );
  console.log("\n--- Calldata ---");
  console.log(
    "Inner calldata (RpRegistry.updateRp):",
    innerCalldata.slice(0, 74) + "...",
  );

  // Wrap in Safe executeUserOp
  const safeCalldata = encodeSafeUserOpCalldata(
    RP_REGISTRY_ADDRESS!,
    0n,
    innerCalldata,
  );
  console.log(
    "Safe calldata (executeUserOp):",
    safeCalldata.slice(0, 74) + "...",
  );

  // Get validity timestamps
  const { validAfter, validUntil } = getTxExpiration();
  console.log("\n--- Validity Window ---");
  console.log("Valid After:", validAfter.toISOString());
  console.log("Valid Until:", validUntil.toISOString());

  // Build UserOperation with placeholder signature (using Alchemy gas limits)
  const nonce = getUpdateRpNonce(rpId);
  const userOp = buildUserOperation(
    SAFE_ADDRESS!,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
    ALCHEMY_GAS_LIMITS,
  );
  console.log("\n--- UserOperation ---");
  console.log("Sender:", userOp.sender);
  console.log("Nonce:", userOp.nonce);
  console.log("CallData length:", userOp.callData.length);
  console.log("Placeholder Signature:", userOp.signature.slice(0, 42) + "...");

  // Compute Safe Operation hash (EIP-712 typed data)
  const safeOpHash = hashSafeUserOp(
    userOp,
    CHAIN_ID,
    SAFE_4337_MODULE,
    ENTRYPOINT_ADDRESS,
  );
  console.log("\n--- Signing with Safe Owner KMS (Safe EIP-712) ---");
  console.log("Safe4337 Module:", SAFE_4337_MODULE);
  console.log("Safe Operation Hash:", safeOpHash);

  // Sign the Safe Operation hash with Safe owner KMS key
  const safeOwnerSignature = await signEthDigestWithKms(
    kmsClient,
    KMS_KEY_ID!,
    getBytes(safeOpHash),
  );

  if (!safeOwnerSignature) {
    console.error("Error: Failed to sign with Safe owner KMS key");
    process.exit(1);
  }
  console.log(
    "Safe Owner Signature:",
    safeOwnerSignature.serialized.slice(0, 42) + "...",
  );

  // Replace placeholder with actual signature (preserving validity timestamps)
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: safeOwnerSignature.serialized,
  });
  console.log("Final Signature:", userOp.signature.slice(0, 42) + "...");

  // Send to bundler
  console.log("\n--- Sending to Bundler ---");
  console.log("Bundler URL:", BUNDLER_URL.replace(ALCHEMY_API_KEY!, "***"));

  try {
    const bundlerProvider = new JsonRpcProvider(BUNDLER_URL);
    const result = await bundlerProvider.send("eth_sendUserOperation", [
      userOp,
      ENTRYPOINT_ADDRESS,
    ]);
    console.log("\nSuccess! UserOp Hash:", result);
    console.log("\nCheck Safe wallet activity at:");
    console.log(`  https://worldscan.org/address/${SAFE_ADDRESS}`);
    console.log("\nSigner rotation:");
    console.log(`  Old: ${rpState.signer}`);
    console.log(`  New: ${newSignerAddress}`);
  } catch (error: unknown) {
    console.error("\nBundler Error:");
    const err = error as {
      info?: { error?: { code?: number; message?: string; data?: unknown } };
      message?: string;
    };
    if (err.info?.error) {
      console.error("Code:", err.info.error.code);
      console.error("Message:", err.info.error.message);
      if (err.info.error.data) {
        console.error("Data:", JSON.stringify(err.info.error.data, null, 2));
      }
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
