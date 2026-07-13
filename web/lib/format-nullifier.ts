/** Formats a decimal nullifier as compact hexadecimal. */
export const formatNullifierHex = (nullifier: string): string => {
  if (!nullifier?.trim() || nullifier.trim().startsWith("-")) {
    return nullifier;
  }

  let hex: string;
  try {
    hex = BigInt(nullifier).toString(16);
  } catch {
    return nullifier;
  }

  if (hex.length <= 12) {
    return `0x${hex}`;
  }

  return `0x${hex.slice(0, 8)}…${hex.slice(-4)}`;
};
