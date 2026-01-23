#!/usr/bin/env npx tsx

/**
 * Get Ethereum address from an AWS KMS secp256k1 key.
 *
 * Usage:
 *   npx tsx scripts/get-kms-address.ts <key-id-or-alias>
 *
 * Examples:
 *   npx tsx scripts/get-kms-address.ts alias/developer-portal-safe-owner-prod
 *   npx tsx scripts/get-kms-address.ts arn:aws:kms:eu-west-1:123456789:key/abc-123
 *   npx tsx scripts/get-kms-address.ts abc-123-def-456
 *
 * Environment:
 *   AWS_PROFILE - AWS profile to use (default: stage)
 *   AWS_REGION  - AWS region (default: eu-west-1)
 */

import { GetPublicKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { computeAddress } from "ethers";

const keyId = process.argv[2];

if (!keyId) {
  console.error("Usage: npx tsx scripts/get-kms-address.ts <key-id-or-alias>");
  console.error("");
  console.error("Examples:");
  console.error("  npx tsx scripts/get-kms-address.ts alias/my-key");
  console.error("  npx tsx scripts/get-kms-address.ts arn:aws:kms:...");
  process.exit(1);
}

const region = process.env.AWS_REGION || "eu-west-1";
const profile = process.env.AWS_PROFILE || "stage";

console.log(`Region: ${region}`);
console.log(`Profile: ${profile}`);
console.log(`Key ID: ${keyId}`);
console.log("");

async function main() {
  // Create KMS client with SSO credentials
  const client = new KMSClient({
    region,
    credentials: fromSSO({ profile }),
  });

  // Get public key from KMS
  const response = await client.send(new GetPublicKeyCommand({ KeyId: keyId }));

  if (!response.PublicKey) {
    console.error("Error: No public key returned from KMS");
    process.exit(1);
  }

  // Parse SPKI format to extract raw public key
  // SPKI format: variable header + 65-byte uncompressed public key (04 || x || y)
  const spkiKey = new Uint8Array(response.PublicKey);

  console.log(`SPKI key length: ${spkiKey.length} bytes`);

  // Find the 0x04 marker for uncompressed public key
  // It should be followed by exactly 64 bytes (x || y coordinates)
  let keyStartIndex = -1;
  for (let i = 0; i < spkiKey.length - 64; i++) {
    if (spkiKey[i] === 0x04) {
      // Verify this looks like a valid position (remaining bytes = 64)
      if (spkiKey.length - i === 65) {
        keyStartIndex = i;
        break;
      }
    }
  }

  if (keyStartIndex === -1) {
    console.error(
      "Error: Could not find uncompressed public key (0x04 prefix) in SPKI data",
    );
    console.error(`Raw SPKI (hex): ${Buffer.from(spkiKey).toString("hex")}`);
    process.exit(1);
  }

  console.log(`Found public key at offset: ${keyStartIndex}`);

  // Extract x and y coordinates (skip 0x04 prefix)
  const publicKeyBytes = spkiKey.slice(keyStartIndex + 1); // 64 bytes: x || y

  // Compute Ethereum address: keccak256(publicKey)[12:32]
  const address = computeAddress(
    "0x" + Buffer.from(publicKeyBytes).toString("hex"),
  );

  console.log(
    `Public Key (hex): 0x${Buffer.from(publicKeyBytes).toString("hex")}`,
  );
  console.log(`Ethereum Address: ${address}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  if (error.name === "CredentialsProviderError") {
    console.error("");
    console.error(`Hint: Run 'aws sso login --profile ${profile}' first`);
  }
  process.exit(1);
});
