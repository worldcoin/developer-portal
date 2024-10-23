import { validateABILikeEncoding } from "@/legacy/lib/hashing";
import { logger } from "@/legacy/lib/logger";
import { IInternalError } from "@/legacy/lib/types";
import { sequencerMapping } from "@/lib/utils";
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField } from "@worldcoin/idkit-core/hashing";
import { AbiCoder, BigNumberish, toBeHex } from "ethers";

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
  signal: string;
  nullifier_hash: string;
  external_nullifier: string;
  proof: string;
}

export interface IVerifyParams {
  is_staging: boolean;
  verification_level: VerificationLevel;
  max_age?: number;
}

interface IAppAction {
  app: {
    id: string;
    is_staging: true;
    engine: string;
    actions: {
      id: string;
      action: string;
      status: string;
      external_nullifier: string;
      nullifiers: {
        uses: number;
        created_at: string;
        nullifier_hash: string;
      }[];
      max_verifications: number;
    }[];
  }[];
}

const queryFetchAppAction = gql`
  query FetchAppAction(
    $app_id: String!
    $action: String!
    $nullifier_hash: String!
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
      }
    ) {
      id
      is_staging
      engine
      actions(where: { action: { _eq: $action } }) {
        id
        action
        max_verifications
        external_nullifier
        status
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          uses
          created_at
          nullifier_hash
        }
      }
    }
  }
`;

function decodeProof(encodedProof: string) {
  const binArray = AbiCoder.defaultAbiCoder().decode(
    ["uint256[8]"],
    encodedProof,
  )[0] as BigNumberish[];
  const hexArray = binArray.map((item) => toBeHex(BigInt(item)));

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

export const fetchActionForProof = async (
  graphQLClient: ApolloClient<NormalizedCacheObject>,
  app_id: string,
  nullifier_hash: string,
  action: string,
) => {
  const result = await graphQLClient.query<IAppAction>({
    query: queryFetchAppAction,
    variables: {
      app_id,
      nullifier_hash,
      action,
    },
  });

  if (!result.data.app.length) {
    return {
      error: {
        message: "App not found. App may be no longer active.",
        code: "not_found",
        statusCode: 404,
      },
    };
  }

  const app = result.data.app[0];

  if (!app.actions.length) {
    return {
      error: {
        message: "Action not found.",
        code: "invalid_action",
        statusCode: 400,
        attribute: "action",
      },
    };
  }

  if (app.engine !== "cloud") {
    return {
      error: {
        message: "This action runs on-chain and can't be verified here.",
        code: "invalid_engine",
        statusCode: 400,
        attribute: "engine",
      },
    };
  }

  return {
    app: {
      ...app,
      actions: undefined,
      action: app.actions[0],
      nullifier: app.actions[0]?.nullifiers?.[0],
    },
  };
};

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
          "This attribute is improperly formatted. Expected an ABI-encoded uint256[8].",
        code: "invalid_format",
        statusCode: 400,
        attribute: "proof",
      },
    };
  }

  try {
    nullifier_hash = toBeHex(
      AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        `0x${params.nullifier_hash.slice(2).padStart(64, "0")}`,
      )[0] as bigint,
    );
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
    merkle_root = toBeHex(
      AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        `0x${params.merkle_root.slice(2).padStart(64, "0")}`,
      )[0] as bigint,
    );
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
    external_nullifier = toBeHex(
      AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        `0x${params.external_nullifier.slice(2).padStart(64, "0")}`,
      )[0] as bigint,
    );
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

  if (validateABILikeEncoding(params.signal)) {
    try {
      signal_hash = toBeHex(
        AbiCoder.defaultAbiCoder().decode(
          ["uint256"],
          `0x${params.signal.slice(2).padStart(64, "0")}`,
        )[0] as bigint,
      );
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
  } else {
    signal_hash = toBeHex(hashToField(params.signal).hash as bigint);
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
