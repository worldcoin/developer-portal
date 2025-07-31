import { ByteArray, isBytes, isHex, keccak256, toHex } from 'viem';

export type HashFunctionOutput = { hash: bigint; digest: `0x${string}` };

/**
 * Hashes an input using the `keccak256` hashing function used across the World ID protocol, to be used as
 * a ZKP input. The function will try to determine the best hashing mechanism, if the string already looks like hex-encoded
 * bytes (e.g. `0x0000000000000000000000000000000000000000`), it will be hashed directly.
 * @param input Any string, hex-like string, bytes represented as a hex string.
 * @returns
 */
export function hashToField(input: Uint8Array | string | `0x${string}`): HashFunctionOutput {
  if (isBytes(input) || isHex(input)) {
    return hashEncodedBytes(input);
  }

  return hashEncodedBytes(toHex(input));
}

/**
 * Hashes raw bytes input using the `keccak256` hashing function used across the World ID protocol, to be used as
 * a ZKP input. Example use cases include when you're hashing an address to be verified in a smart contract.
 * @param input - Bytes represented as a hex string.
 * @returns
 */
function hashEncodedBytes(input: ByteArray | `0x${string}`): HashFunctionOutput {
  const hash = BigInt(keccak256(input)) >> BigInt(8);
  const rawDigest = hash.toString(16);

  return { hash, digest: `0x${rawDigest.padStart(64, '0')}` };
}
