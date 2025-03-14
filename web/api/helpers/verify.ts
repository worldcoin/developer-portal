import { Nullifier } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { IInternalError } from "@/lib/types";
import { sequencerMapping } from "@/lib/utils";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { AbiCoder, toBeHex } from "ethers";

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

export interface IInputParams {
  merkle_root: string;
  signal_hash: string;
  nullifier_hash: string;
  external_nullifier: string;
  proof: string | any;
}

export interface IVerifyParams {
  is_staging: boolean;
  verification_level: VerificationLevel;
  max_age?: number;
}

export function decodeProof(proof: string | any) {
  // Check if the proof is already in the expected format (a 2D array)
  if (typeof proof !== 'string') {
    try {
      const formattedProof = tryParsePreDecodedProof(proof);
      if (formattedProof) {
        return formattedProof;
      }
    } catch (error) {
      logger.error("Error processing pre-decoded proof", { error });
      // If there's an error processing the pre-decoded proof, fall through to try decoding it
    }
  }

  // Original decoding logic for string proofs
  return decodeAbiEncodedProof(proof);
}

/**
 * Attempts to parse a pre-decoded proof in the form of a 2D array
 * @param proofArray The pre-decoded proof array
 * @returns The formatted proof array or null if the input is not in the expected format
 */
function tryParsePreDecodedProof(proofArray: any): any[] | null {
  // Validate the structure of the array
  if (
    !Array.isArray(proofArray) ||
    proofArray.length !== 3 ||
    !Array.isArray(proofArray[0]) || proofArray[0].length !== 2 ||
    !Array.isArray(proofArray[1]) || proofArray[1].length !== 2 ||
    !Array.isArray(proofArray[1][0]) || proofArray[1][0].length !== 2 ||
    !Array.isArray(proofArray[1][1]) || proofArray[1][1].length !== 2 ||
    !Array.isArray(proofArray[2]) || proofArray[2].length !== 2
  ) {
    return null;
  }

  // Convert all elements to hex strings if they aren't already
  return [
    [
      ensureHexString(proofArray[0][0]),
      ensureHexString(proofArray[0][1])
    ],
    [
      [
        ensureHexString(proofArray[1][0][0]),
        ensureHexString(proofArray[1][0][1])
      ],
      [
        ensureHexString(proofArray[1][1][0]),
        ensureHexString(proofArray[1][1][1])
      ]
    ],
    [
      ensureHexString(proofArray[2][0]),
      ensureHexString(proofArray[2][1])
    ]
  ];
}

/**
 * Ensures a value is a hex string
 * @param value The value to convert to a hex string
 * @returns The hex string representation of the value
 */
function ensureHexString(value: any): string {
  return typeof value === 'string' ? value : toBeHex(BigInt(value));
}

/**
 * Decodes an ABI-encoded proof
 * @param encodedProof The ABI-encoded proof
 * @returns The decoded proof array
 */
function decodeAbiEncodedProof(encodedProof: string): any[] {
  const binArray = AbiCoder.defaultAbiCoder().decode(
    ["uint256[8]"],
    encodedProof,
  )[0] as BigInt[];
  const hexArray = binArray.map((item) => toBeHex(item as bigint));

  if (hexArray.length !== 8) {
    throw new Error("Input array must have exactly 8 elements.");
  }

  return [
    [hexArray[0], hexArray[1]],
    [
      [hexArray[2], hexArray[3]],
      [hexArray[4], hexArray[5]],
    ],
    [hexArray[6], hexArray[7]],
  ];
}

/**
 * Decodes a parameter to a hex string
 * @param value The value to decode
 * @returns The decoded hex string
 */
function decodeToHexString(value: string): string {
  return toBeHex(
    AbiCoder.defaultAbiCoder().decode(
      ["uint256"],
      `0x${value.slice(2).padStart(64, "0")}`,
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
          "This attribute is improperly formatted. Expected either an ABI-encoded uint256[8] or a pre-decoded 2D array in the correct format.",
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
