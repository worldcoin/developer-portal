import { hashSignal } from "@worldcoin/idkit/hashing";
import { AbiParameters } from "ox";

declare const brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

// Dropped support in IDKit 4.x
export type AbiEncodedValue = Brand<
  { types: string[]; values: unknown[] },
  "AbiEncodedValue"
>;

// We stopped exporting this in IDKit 4.x
// Adding it here to keep compatibility with legacy endpoints that depend on it
export enum LegacyVerificationLevel {
  Orb = "orb",
  SecureDocument = "secure_document",
  Document = "document",
  Device = "device",
  Face = "face",
}

export const SELFIE_IDENTIFIER = "selfie";

/**
 * Maps public IDKit identifiers to the credential name expected by legacy
 * verification endpoints. Selfie Check was historically called "face" by the
 * legacy sequencer, so keep that translation at the verification boundary.
 */
export function toLegacyVerificationLevel(
  identifier: string,
): LegacyVerificationLevel | undefined {
  if (identifier === SELFIE_IDENTIFIER) {
    return LegacyVerificationLevel.Face;
  }

  if (
    Object.values(LegacyVerificationLevel).includes(
      identifier as LegacyVerificationLevel,
    )
  ) {
    return identifier as LegacyVerificationLevel;
  }

  return undefined;
}

// Dropped support in IDKit 4.x
export interface HashFunctionOutput {
  hash: bigint;
  digest: `0x${string}`;
}

// Dropped support in IDKit 4.x
export function packAndEncode(input: [string, unknown][]): HashFunctionOutput {
  const [types, values] = input.reduce<[string[], unknown[]]>(
    ([types, values], [type, value]) => {
      types.push(type);
      values.push(value);

      return [types, values];
    },
    [[], []],
  );

  let digest = hashSignal(AbiParameters.encodePacked(types, values));
  return { hash: BigInt(digest), digest: digest as `0x${string}` };
}

// Dropped support in IDKit 4.x
export const solidityEncode = (
  types: string[],
  values: unknown[],
): AbiEncodedValue => {
  if (types.length !== values.length) {
    throw new Error("Types and values arrays must have the same length.");
  }

  return { types, values } as AbiEncodedValue;
};
