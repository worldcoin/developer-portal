import { IInternalError } from "@/lib/types";
import { sequencerMapping } from "@/lib/utils";
import { IInputParams, IVerifyParams, parseProofInputs } from "./verify";

const KNOWN_ERROR_CODES = [
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

/**
 * Verifies a ZKP with the World ID smart contract (V2 API)
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
      const knownError = KNOWN_ERROR_CODES.find(
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

// Re-export utilities from verify.ts for backward compatibility
export { canVerifyForAction, nullifierHashToBigIntStr } from "./verify";
