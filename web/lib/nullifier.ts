// Temporary copy of worldcoin/idkit#339 (0b28bd355155b4442cfdfde81037d129211760d6).
// Replace this module with @worldcoin/idkit-server/nullifier after its release.
// World ID uses the BabyJubJub base field, which is the BN254 scalar field.
// Modulus source: https://github.com/arkworks-rs/algebra/blob/df907e8c1601a898c2903ed7ab7bbbb10607f36b/curves/bn254/src/fields/fr.rs#L4
const FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** A checked World ID field element. Parsing a nullifier does not verify its proof. */
export class Nullifier {
  readonly #value: bigint;

  private constructor(value: bigint) {
    if (typeof value !== "bigint" || value < 0n || value >= FIELD_MODULUS) {
      throw new RangeError("Nullifier is outside the World ID field");
    }
    this.#value = value;
  }

  /** Reads hex, including short values; "10" means 16. Throws for invalid or out-of-field input. */
  static fromHex(value: string): Nullifier {
    if (typeof value !== "string") {
      throw new TypeError("Nullifier must be a hex string");
    }
    const digits =
      value.startsWith("0x") || value.startsWith("0X") ? value.slice(2) : value;
    if (!digits.length || digits.length > 64 || /[^0-9a-fA-F]/.test(digits)) {
      throw new RangeError("Invalid nullifier hex string");
    }
    return new Nullifier(BigInt(`0x${digits}`));
  }

  /** Compare these numbers; === between Nullifier objects compares references. */
  toBigInt(): bigint {
    return this.#value;
  }

  toHex(): string {
    return `0x${this.#value.toString(16).padStart(64, "0")}`;
  }

  toJSON(): string {
    return this.toHex();
  }
}
