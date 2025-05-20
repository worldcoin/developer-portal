const normalizeNullifierHash = (nullifierHash: string): string => {
  const normalized = nullifierHash.toLowerCase().trim().replace(/^0x/, "");

  return `0x${normalized}`;
};

/**
 * Converts a nullifier hash to its numeric representation for database storage and comparison
 * This helps prevent case sensitivity, prefix, and padding bypass attacks
 */
export const nullifierHashToBigIntStr = (nullifierHash: string): string => {
  const normalized = normalizeNullifierHash(nullifierHash);
  return BigInt(normalized).toString();
};
