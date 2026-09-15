import "server-only";

/**
 * Resolution of the Portal-controlled manager address for a managed RP.
 */

import { getKMSClient } from "@/api/helpers/kms";
import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { logger } from "@/lib/logger";

// A KMS key's Ethereum address is derived from its public key, which never
// changes for a given key id, so this mapping is immutable and safe to cache
// for the process lifetime. Caching matters because the manager check runs in
// `rp-status`, a public polling endpoint — without it every poll of every
// managed RP would issue a KMS GetPublicKey call.
const managerAddressCache = new Map<string, string>();

/**
 * Returns the Ethereum address of the Portal's manager key for a managed RP, or
 * `null` when it cannot be determined (KMS unavailable).
 *
 * `null` means "unknown", NOT "untrusted" — callers must not treat it as proof
 * that an on-chain RP is foreign, or a KMS outage would look identical to a
 * takeover and could fail healthy registrations.
 */
export async function resolveManagerAddress(
  managerKmsKeyId: string,
  kmsRegion?: string,
): Promise<string | null> {
  const cached = managerAddressCache.get(managerKmsKeyId);
  if (cached) {
    return cached;
  }

  try {
    const kmsClient = await getKMSClient(kmsRegion);
    // The region is needed twice over: once for the client, and again so a bare
    // key ID expands to an ARN in the right region.
    const address = await getEthAddressFromKMS(
      kmsClient,
      managerKmsKeyId,
      kmsRegion,
    );
    managerAddressCache.set(managerKmsKeyId, address);
    return address;
  } catch (error) {
    logger.error("Failed to derive manager address from KMS key", {
      error,
      managerKmsKeyId,
    });
    return null;
  }
}
