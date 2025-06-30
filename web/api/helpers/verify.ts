import { Nullifier } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { IInternalError } from "@/lib/types";
import { sequencerMapping } from "@/lib/utils";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { AbiCoder, toBeHex } from "ethers";
import * as yup from "yup";

// Define the nested proof format type
type NestedProof = [
  [string, string],
  [[string, string], [string, string]],
  [string, string],
];

const KNOWN_ERROR_CODES = [
  // rawMessage: error text from sequencer. reference https://github.com/worldcoin/signup-sequencer/blob/main/src/server/error.rs
  // code: error code to return to the client
  // detail: error message to return to the client
  {
    rawMessage: "invalid root",
    code: "invalid_merkle_root",
    detail:
      "The provided Merkle root is invalid. User appears to be unverified.",
  },
  {
    rawMessage: "invalid semaphore proof",
    code: "invalid_proof",
    detail:
      "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
  },
  {
    rawMessage: "Root provided in semaphore proof is too old.",
    code: "root_too_old",
    detail:
      "The provided merkle root is too old. Please generate a new proof and try again.",
  },
  {
    rawMessage: "prover error",
    code: "prover_error",
    detail:
      "The prover encountered an error while verifying the proof. Please try again.",
  },
];

const KNOWN_ERROR_CODES_V2 = [
  // V2 API error mapping
  // errorId from v2 API -> code returned to client
  {
    errorId: "invalid_root",
    code: "invalid_merkle_root",
    detail:
      "The provided Merkle root is invalid. User appears to be unverified.",
  },
  {
    errorId: "root_too_old",
    code: "root_too_old",
    detail:
      "The provided merkle root is too old. Please generate a new proof and try again.",
  },
  {
    errorId: "decompressing_proof_error",
    code: "invalid_proof",
    detail:
      "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
  },
  {
    errorId: "prover_error",
    code: "prover_error",
    detail:
      "The prover encountered an error while verifying the proof. Please try again.",
  },
];

export interface IInputParams {
  merkle_root: string;
  signal_hash: string;
  nullifier_hash: string;
  external_nullifier: string;
  proof: string;
}

export interface IVerifyParams {
  is_staging: boolean;
  verification_level: VerificationLevel;
  max_age?: number;
}

/**
 * Define a Yup schema for the proof structure
 */
const proofSchema = yup
  .array()
  .length(3)
  .test("is-valid-proof-structure", "Invalid proof structure", (value) => {
    if (!value) return false;
    // Check first level [a, b]
    if (!Array.isArray(value[0]) || value[0].length !== 2) return false;
    // Check second level [[c, d], [e, f]]
    if (!Array.isArray(value[1]) || value[1].length !== 2) return false;
    if (!Array.isArray(value[1][0]) || value[1][0].length !== 2) return false;
    if (!Array.isArray(value[1][1]) || value[1][1].length !== 2) return false;
    // Check third level [g, h]
    return !(!Array.isArray(value[2]) || value[2].length !== 2);
  });

/**
 * Converts a flat Semaphore proof array to the nested format expected by the tests
 * @param flatProof The flat Semaphore proof array (8 elements)
 * @returns The nested proof format (3 elements)
 */
function convertToNestedFormat(flatProof: string[]): NestedProof {
  return [
    [flatProof[0], flatProof[1]],
    [
      [flatProof[2], flatProof[3]],
      [flatProof[4], flatProof[5]],
    ],
    [flatProof[6], flatProof[7]],
  ];
}

export function decodeProof(proof: string): NestedProof {
  // Handle the case where the proof might be a JSON string with escaped quotes
  let cleanedProof = proof;

  // If the proof contains escaped quotes, unescape them
  if (proof.includes('\\"')) {
    try {
      // Try to unescape the JSON string
      cleanedProof = JSON.parse(`"${proof.replace(/^"|"$/g, "")}"`);
    } catch (error) {
      logger.debug("Failed to unescape proof string", { error });
      // If unescaping fails, continue with the original proof
      cleanedProof = proof;
    }
  }

  // Check if the proof is a JSON-encoded nested array
  if (cleanedProof.startsWith("[") && cleanedProof.endsWith("]")) {
    try {
      // Try to parse the JSON
      const parsedProof = JSON.parse(cleanedProof) as any[];

      // Validate using the Yup schema
      if (proofSchema.isValidSync(parsedProof)) {
        return [
          [
            ensureHexString(parsedProof[0][0]),
            ensureHexString(parsedProof[0][1]),
          ],
          [
            [
              ensureHexString(parsedProof[1][0][0]),
              ensureHexString(parsedProof[1][0][1]),
            ],
            [
              ensureHexString(parsedProof[1][1][0]),
              ensureHexString(parsedProof[1][1][1]),
            ],
          ],
          [
            ensureHexString(parsedProof[2][0]),
            ensureHexString(parsedProof[2][1]),
          ],
        ];
      }
    } catch (error) {
      logger.error("Error processing JSON-encoded proof", { error });
      // If there's an error processing the JSON-encoded proof, fall through to try decoding it as ABI
    }
  }

  // If we couldn't parse it as a nested array JSON, try decoding it as an ABI-encoded proof
  try {
    const flatProof = decodeAbiEncodedProof(cleanedProof);
    return convertToNestedFormat(flatProof);
  } catch (error) {
    logger.error("Error decoding ABI-encoded proof", { error });
    throw new Error("Invalid proof format");
  }
}

/**
 * Ensures a value is a hex string
 * @param value The value to convert to a hex string
 * @returns The hex string representation of the value
 */
function ensureHexString(value: any): string {
  if (typeof value === "string") {
    // If it's already a hex string, return it
    if (value.startsWith("0x")) {
      return value;
    }
    // If it's a string representation of a number, convert it to a hex string
    if (/^\d+$/.test(value)) {
      return toBeHex(BigInt(value));
    }
    return value;
  }
  // If it's a number or BigInt, convert it to a hex string
  return toBeHex(BigInt(value));
}

/**
 * Decodes an ABI-encoded proof
 * @param encodedProof The ABI-encoded proof
 * @returns The decoded proof array
 */
function decodeAbiEncodedProof(encodedProof: string): string[] {
  const binArray = AbiCoder.defaultAbiCoder().decode(
    ["uint256[8]"],
    encodedProof,
  )[0] as BigInt[];

  return binArray.map((item) => toBeHex(item as bigint));
}

/**
 * Decodes a parameter to a hex string
 * @param value The value to decode
 * @returns The decoded hex string
 */
export function decodeToHexString(value: string): string {
  const normalized = value.toLowerCase().trim().replace(/^0x/, "");

  return toBeHex(
    AbiCoder.defaultAbiCoder().decode(
      ["uint256"],
      `0x${normalized.padStart(64, "0")}`,
    )[0],
  );
}

/**
 * Parses and validates the inputs to verify a proof
 * @param body
 * @param res
 * @returns
 */
export const parseProofInputs = (params: IInputParams) => {
  let proof,
    nullifier_hash,
    external_nullifier,
    signal_hash,
    merkle_root = null;

  try {
    proof = decodeProof(params.proof);
  } catch (error) {
    logger.error("Error decode proof", { error });
    return {
      error: {
        message:
          "This attribute is improperly formatted. Expected either an ABI-encoded uint256[8] string or a JSON-encoded array string in the correct format.",
        code: "invalid_format",
        statusCode: 400,
        attribute: "proof",
      },
    };
  }

  try {
    nullifier_hash = decodeToHexString(params.nullifier_hash);
  } catch (error) {
    logger.error("Error create nullifier hash", { error });
    return {
      error: {
        message:
          "This attribute is improperly formatted. Expected an ABI-encoded uint256.",
        code: "invalid_format",
        statusCode: 400,
        attribute: "nullifier_hash",
      },
    };
  }

  try {
    merkle_root = decodeToHexString(params.merkle_root);
  } catch (error) {
    logger.error("Error create merkle root", { error });
    return {
      error: {
        message:
          "This attribute is improperly formatted. Expected an ABI-encoded uint256.",
        code: "invalid_format",
        statusCode: 400,
        attribute: "merkle_root",
      },
    };
  }

  try {
    external_nullifier = decodeToHexString(params.external_nullifier);
  } catch (error) {
    logger.error("Error create external nullifier", { error });
    return {
      error: {
        message:
          "This attribute is improperly formatted. Expected an ABI-encoded uint256.",
        code: "invalid_format",
        statusCode: 400,
        attribute: "external_nullifier",
      },
    };
  }

  try {
    signal_hash = decodeToHexString(params.signal_hash);
  } catch (error) {
    logger.error("Error create signal hash", { error });
    return {
      error: {
        message:
          "This attribute is improperly formatted. Expected an ABI-encoded uint256 or a string.",
        code: "invalid_format",
        statusCode: 400,
        attribute: "signal",
      },
    };
  }

  return {
    params: {
      proof,
      nullifier_hash,
      external_nullifier,
      signal_hash,
      merkle_root,
    },
  };
};

/**
 * Verifies a ZKP with the World ID smart contract
 */
export const verifyProof = async (
  proofParams: IInputParams,
  verifyParams: IVerifyParams,
): Promise<{
  success?: true;
  status?: string;
  error?: IInternalError;
}> => {
  // Parse the inputs
  const parsed = parseProofInputs(proofParams);
  if (parsed.error || !parsed.params) {
    return { error: parsed.error };
  }

  const { params: parsedParams } = parsed;

  // Query the signup sequencer to verify the proof
  const body = JSON.stringify({
    root: parsedParams.merkle_root,
    nullifierHash: parsedParams.nullifier_hash,
    externalNullifierHash: parsedParams.external_nullifier,
    signalHash: parsedParams.signal_hash,
    proof: parsedParams.proof,
  });

  const sequencerUrl =
    sequencerMapping[verifyParams.verification_level]?.[
      verifyParams.is_staging.toString()
    ];

  const response = await fetch(
    verifyParams.max_age
      ? `${sequencerUrl}/verifySemaphoreProof?maxRootAgeSeconds=${verifyParams.max_age}`
      : `${sequencerUrl}/verifySemaphoreProof`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    },
  );

  if (!response.ok) {
    try {
      const rawErrorMessage = await response.text();
      const knownError = KNOWN_ERROR_CODES.find(
        ({ rawMessage }) => rawMessage === rawErrorMessage,
      );
      return {
        error: {
          message:
            knownError?.detail ||
            `We couldn't verify the provided proof (error code ${rawErrorMessage}).`,
          code: knownError?.code || "invalid_proof",
          statusCode: 400,
          attribute: null,
        },
      };
    } catch {
      return {
        error: {
          message: "There was an internal issue verifying this proof.",
          code: "internal_error",
          statusCode: 500,
        },
      };
    }
  }

  return { success: true };
};

/**
 * Checks whether the person can be verified for a particular action based on the max number of verifications
 */
export const canVerifyForAction = (
  nullifier: Pick<Nullifier, "uses" | "nullifier_hash"> | undefined,
  max_verifications_per_person: number,
): boolean => {
  if (!nullifier) {
    // Person has not verified before, can always verify for the first time
    return true;
  } else if (max_verifications_per_person <= 0) {
    // `0` or `-1` means unlimited verifications
    return true;
  }

  // Else, can only verify if the max number of verifications has not been met
  return nullifier.uses < max_verifications_per_person;
};

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

export const verifyProofV2 = async (
  proofParams: IInputParams,
  verifyParams: IVerifyParams,
): Promise<{
  success?: true;
  status?: string;
  error?: IInternalError;
}> => {
  // Parse the inputs
  const parsed = parseProofInputs(proofParams);
  if (parsed.error || !parsed.params) {
    return { error: parsed.error };
  }

  const { params: parsedParams } = parsed;

  // Query the signup sequencer to verify the proof (V2 API)
  const body = JSON.stringify({
    root: parsedParams.merkle_root,
    nullifierHash: parsedParams.nullifier_hash,
    externalNullifierHash: parsedParams.external_nullifier,
    signalHash: parsedParams.signal_hash,
    proof: parsedParams.proof,
    // V2 API: maxRootAgeSeconds is now in the request body
    ...(verifyParams.max_age && { maxRootAgeSeconds: verifyParams.max_age }),
  });

  const sequencerUrl =
    sequencerMapping[verifyParams.verification_level]?.[
      verifyParams.is_staging.toString()
    ];

  // V2 API endpoint
  const response = await fetch(`${sequencerUrl}/v2/semaphore-proof/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    try {
      // V2 API returns JSON error responses
      const errorResponse = await response.json();
      const knownError = KNOWN_ERROR_CODES_V2.find(
        ({ errorId }) => errorId === errorResponse.errorId,
      );
      return {
        error: {
          message:
            knownError?.detail ||
            errorResponse.errorMessage ||
            `We couldn't verify the provided proof (error code ${errorResponse.errorId}).`,
          code: knownError?.code || "invalid_proof",
          statusCode: 400,
          attribute: null,
        },
      };
    } catch {
      return {
        error: {
          message: "There was an internal issue verifying this proof.",
          code: "internal_error",
          statusCode: 500,
        },
      };
    }
  }

  // V2 API returns { valid: boolean }
  try {
    const result = await response.json();
    if (result.valid === true) {
      return { success: true };
    } else {
      return {
        error: {
          message: "The provided proof is invalid.",
          code: "invalid_proof",
          statusCode: 400,
          attribute: null,
        },
      };
    }
  } catch {
    return {
      error: {
        message:
          "There was an internal issue processing the verification response.",
        code: "internal_error",
        statusCode: 500,
      },
    };
  }
};
