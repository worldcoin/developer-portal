import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { ethers } from "ethers";
import * as jose from "jose";
import { CredentialType, IInternalError } from "types";

const CONTRACT_ABI = [
  "function verifyProof (uint256 root, uint256 groupId, uint256 signalHash, uint256 nullifierHash, uint256 externalNullifierHash, uint256[8] calldata proof)",
];

export const STAGING_RPC = "https://polygon-mumbai.g.alchemy.com";
export const PRODUCTION_RPC = "https://polygon-mainnet.g.alchemy.com";

export const KNOWN_ERROR_CODES = [
  {
    rawCode: "0x504570e3",
    code: "invalid_merkle_root",
    detail:
      "The provided Merkle root is invalid. User appears to be unverified.",
  },
  {
    rawCode: "0x09bde339",
    code: "invalid_proof",
    detail:
      "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
  },
];

export const SEMAPHORE_GROUP_MAP: Record<CredentialType, number> = {
  [CredentialType.Orb]: 1,
  [CredentialType.Phone]: 10,
};

const queryFetchAppActionWithContractAddress = gql`
  query FetchAppActionWithContractAddress(
    $app_id: String!
    $action: String!
    $nullifier_hash: String!
    $now: timestamptz!
  ) {
    cache(
      where: {
        _or: [
          { key: { _eq: "semaphore.wld.eth" } }
          { key: { _eq: "staging.semaphore.wld.eth" } }
        ]
      }
    ) {
      key
      value
    }
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
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          nullifier_hash
        }
      }
    }
  }
`;

interface IAppActionWithContractAddress {
  cache: {
    key: string;
    value: string;
  }[];

  app: {
    id: string;
    is_staging: true;
    engine: string;
    actions: {
      id: string;
      action: string;
      external_nullifier: string;
      nullifiers: {
        nullifier_hash: string;
      }[];
      max_verifications: number;
    }[];
  }[];
}

interface IInputParams {
  merkle_root: string;
  signal: string;
  nullifier_hash: string;
  external_nullifier: string;
  proof: string;
}

interface IVerifyParams {
  contract_address: string;
  is_staging: boolean;
  credential_type: CredentialType;
}

export const fetchActionForProof = async (
  graphQLClient: ApolloClient<NormalizedCacheObject>,
  app_id: string,
  nullifier_hash: string,
  action: string
) => {
  const result = await graphQLClient.query<IAppActionWithContractAddress>({
    query: queryFetchAppActionWithContractAddress,
    variables: {
      app_id,
      nullifier_hash,
      now: new Date().toISOString(),
      action,
    },
  });

  if (!result.data.app.length) {
    return {
      error: {
        message:
          "We couldn't find an app with this ID. App may be no longer active.",
        code: "not_found",
        statusCode: 404,
      },
    };
  }

  const app = result.data.app[0];

  if (!app.actions.length) {
    return {
      error: {
        message: "We couldn't find the relevant action.",
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

  // Obtain appropriate Semaphore contract address
  const ensName = app.is_staging
    ? "staging.semaphore.wld.eth"
    : "semaphore.wld.eth";
  const contractRecord = result.data.cache.find(({ key }) => key === ensName);
  if (!contractRecord) {
    return {
      error: {
        message:
          "There was an internal issue verifying this proof. Please try again.",
        code: "contract_not_found",
        statusCode: 500,
      },
    };
  }

  return {
    contractAddress: contractRecord.value,
    app: { ...app, action: app.actions[0], actions: undefined },
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
    proof = abi.decode(["uint256[8]"], params.proof)[0] as BigInt[];
  } catch (e) {
    console.error(e);
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
    nullifier_hash = abi.decode(
      ["uint256"],
      params.nullifier_hash
    )[0] as BigInt;
  } catch (e) {
    console.error(e);
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
    merkle_root = abi.decode(["uint256"], params.merkle_root)[0] as BigInt;
  } catch (e) {
    console.error(e);
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
    external_nullifier = abi.decode(
      ["uint256"],
      params.external_nullifier
    )[0] as BigInt;
  } catch (e) {
    console.error(e);
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

  if (IDKitInternal.validateABILikeEncoding(params.signal)) {
    try {
      signal_hash = abi.decode(["uint256"], params.signal)[0] as BigInt;
    } catch (e) {
      console.error(e);
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
    signal_hash = IDKitInternal.hashToField(params.signal).hash;
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
  verifyParams: IVerifyParams
): Promise<{ success?: true; error?: IInternalError }> => {
  const parsed = parseProofInputs(proofParams);
  if (parsed.error || !parsed.params) {
    return { error: parsed.error };
  }

  const { params: parsedParams } = parsed;

  // Construct payload to verify proof with on-chain Semaphore instance
  const iface = new ethers.utils.Interface(CONTRACT_ABI);
  const encodedCallData = iface.encodeFunctionData("verifyProof", [
    parsedParams.merkle_root,
    SEMAPHORE_GROUP_MAP[verifyParams.credential_type],
    parsedParams.signal_hash,
    parsedParams.nullifier_hash,
    parsedParams.external_nullifier,
    parsedParams.proof,
  ]);

  // Call Semaphore contract and verify proof
  const contractCallPayload = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: verifyParams.contract_address,
        data: encodedCallData,
      },
    ],
  };
  const ethCallRequest = await fetch(
    `${verifyParams.is_staging ? STAGING_RPC : PRODUCTION_RPC}/v2/${
      process.env.ALCHEMY_API_KEY
    }`,
    {
      method: "POST",
      body: JSON.stringify(contractCallPayload),
      headers: { "Content-Type": "application/json" },
    }
  );

  // Parse eth_call response from on-chain verification
  if (!ethCallRequest.ok) {
    throw new Error(
      `Unexpected response from Alchemy: ${await ethCallRequest.text()}`
    );
  }
  const ethCallResponse = await ethCallRequest.json();

  if (ethCallResponse.error || ethCallResponse.result !== "0x") {
    const rawErrorCode = ethCallResponse.error?.data;
    const knownError = KNOWN_ERROR_CODES.find(
      ({ rawCode }) => rawCode === rawErrorCode
    );

    return {
      error: {
        message:
          knownError?.detail ||
          `We couldn't verify the provided proof (error code ${rawErrorCode}).`,
        code: knownError?.code || "invalid_proof",
        statusCode: 400,
        attribute: null,
      },
    };
  }

  return { success: true };
};
