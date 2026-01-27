#!/usr/bin/env npx tsx

/**
 * Generate a new Ethereum signer keypair for RP registration.
 *
 * Usage:
 *   npx tsx web/scripts/generate-signer-key.ts
 *
 * Output:
 *   - Private key (keep secret!)
 *   - Public address (use as signer_address in register_rp)
 */

import { Wallet } from "ethers";

function main() {
  // Generate a random wallet
  const wallet = Wallet.createRandom();

  console.log("=== New Signer Key Generated ===\n");
  console.log("Private Key (KEEP SECRET!):");
  console.log(`  ${wallet.privateKey}\n`);
  console.log("Signer Address (use in register_rp):");
  console.log(`  ${wallet.address}\n`);
  console.log("=================================");
  console.log(
    "\nStore the private key securely. You'll need it to sign proofs.",
  );
}

main();
