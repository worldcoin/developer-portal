#!/usr/bin/env npx tsx

/**
 * E2E Test Script for RP Registration UserOperation
 *
 * This script validates the UserOp building and signing logic against real contracts.
 * Uses the correct Safe 4337 EIP-712 signing scheme with AWS KMS for signing.
 *
 * Prerequisites:
 * - AWS credentials configured (via SSO: `aws sso login --profile <profile>`)
 *
 * Required Environment Variables:
 *   ALCHEMY_API_KEY       - Alchemy API key for World Chain
 *   KMS_KEY_ID            - AWS KMS key ID/alias for Safe owner key
 *   SAFE_ADDRESS          - Safe wallet address (sender of UserOps)
 *   RP_REGISTRY_ADDRESS   - RpRegistry contract address
 *
 * Optional Environment Variables:
 *   AWS_PROFILE           - AWS SSO profile name (default: "default")
 *   AWS_REGION            - AWS region (default: "us-east-1")
 *   CHAIN_ID              - Chain ID (default: 480 for World Chain Mainnet)
 *
 * Usage:
 *   aws sso login --profile <your-profile>
 *
 *   ALCHEMY_API_KEY=xxx \
 *   KMS_KEY_ID=alias/your-key \
 *   SAFE_ADDRESS=0x... \
 *   RP_REGISTRY_ADDRESS=0x... \
 *   AWS_PROFILE=your-profile \
 *   npx tsx --require ./web/scripts/mock-server-only.cjs web/scripts/e2e-rp-registration.ts
 */

import { KMSClient } from "@aws-sdk/client-kms";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { getBytes, JsonRpcProvider, keccak256 } from "ethers";

// Import from shared helpers
import {
  createKmsSignature,
  getEthAddressFromKMS,
} from "../api/helpers/ethereum-utils";
import {
  buildRegisterRpCalldata,
  buildUserOperation,
  encodeSafeUserOpCalldata,
  type GasLimits,
  getRegisterRpNonce,
  getTxExpiration,
  hashSafeUserOp,
  replacePlaceholderWithSignature,
} from "../api/helpers/user-operation";

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
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const RP_REGISTRY_ADDRESS = process.env.RP_REGISTRY_ADDRESS;

// Optional with defaults
const AWS_PROFILE = process.env.AWS_PROFILE || "default";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "480", 10); // World Chain Mainnet

// Derived URLs
const RPC_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const BUNDLER_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// EntryPoint v0.7
const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// Safe 4337 Module address (same across chains)
const SAFE_4337_MODULE = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226";

// ============================================================================
// Helper Functions
// ============================================================================

function generateRpId(appId: string): bigint {
  const hash = keccak256(new TextEncoder().encode(appId));
  return BigInt(hash) & ((1n << 64n) - 1n);
}

// ============================================================================
// Main Flow
// ============================================================================

async function main(): Promise<void> {
  console.log("=== E2E RP Registration Test (KMS Signing) ===\n");

  // Validate required environment variables
  const requiredEnvVars: Record<string, string | undefined> = {
    ALCHEMY_API_KEY,
    KMS_KEY_ID,
    SAFE_ADDRESS,
    RP_REGISTRY_ADDRESS,
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
  console.log("KMS Key ID:", KMS_KEY_ID);

  const kmsClient = new KMSClient({
    region: AWS_REGION,
    credentials: fromSSO({ profile: AWS_PROFILE }),
  });

  // Get Safe owner address from KMS
  const ownerAddress = await getEthAddressFromKMS(kmsClient, KMS_KEY_ID!);
  console.log("Safe Owner Address (from KMS):", ownerAddress);

  // Setup provider
  const provider = new JsonRpcProvider(RPC_URL);

  console.log("\n--- Network Config ---");
  console.log("Network:", "World Chain Mainnet");
  console.log("Chain ID:", CHAIN_ID.toString());
  console.log("RpRegistry:", RP_REGISTRY_ADDRESS);
  console.log("EntryPoint:", ENTRYPOINT_ADDRESS);
  console.log("Safe:", SAFE_ADDRESS);

  // Generate test RP data
  const testAppId = `app_test_${Date.now()}`;
  const rpId = generateRpId(testAppId);
  const managerAddress = ownerAddress; // Use KMS address as manager for testing
  const signerAddress = ownerAddress; // Use KMS address as signer for testing
  const domain = "test.example.com";

  console.log("\n--- RP Registration Data ---");
  console.log("App ID:", testAppId);
  console.log("RP ID:", rpId.toString());
  console.log("Manager:", managerAddress);
  console.log("Signer:", signerAddress);
  console.log("Domain:", domain);

  // Build inner calldata (RpRegistry.register)
  const innerCalldata = buildRegisterRpCalldata(
    rpId,
    managerAddress,
    signerAddress,
    domain,
  );
  console.log("\n--- Calldata ---");
  console.log(
    "Inner calldata (RpRegistry.register):",
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
  const nonce = getRegisterRpNonce(rpId);
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
  console.log("\n--- Signing with KMS (Safe EIP-712) ---");
  console.log("Safe4337 Module:", SAFE_4337_MODULE);
  console.log("Safe Operation Hash:", safeOpHash);

  // Sign the Safe Operation hash with KMS (the Safe owner key)
  const signature = await createKmsSignature(
    kmsClient,
    KMS_KEY_ID!,
    getBytes(safeOpHash),
    ownerAddress,
  );
  console.log("KMS Signature:", signature.serialized.slice(0, 42) + "...");

  // Replace placeholder with actual signature (preserving validity timestamps)
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
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
