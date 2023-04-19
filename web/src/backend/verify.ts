import { defaultAbiCoder as abi } from "@ethersproject/abi";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { ethers } from "ethers";
import { CredentialType, IInternalError } from "src/lib/types";
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";
import { getSmartContractENSName } from "./utils";
import { sequencerMapping } from "src/lib/utils";

const KNOWN_ERROR_CODES = [
  {
    rawMessage: "invalid root",
    code: "invalid_merkle_root",
    detail:
      "The provided Merkle root is invalid. User appears to be unverified.",
  },
  {
    rawMessage: "invalid proof",
    code: "invalid_proof",
    detail:
      "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
  },
];

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
      status: string;
      external_nullifier: string;
      nullifiers: {
        nullifier_hash: string;
      }[];
      max_verifications: number;
    }[];
  }[];
}

const queryFetchAppActionWithContractAddress = gql`
  query FetchAppActionWithContractAddress(
    $app_id: String!
    $action: String!
    $nullifier_hash: String!
  ) {
    cache(where: { key: { _iregex: "[a-z.]+.wld.eth" } }) {
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
        status
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          nullifier_hash
        }
      }
    }
  }
`;

function decodeProof(encodedProof: string) {
  const binArray = abi.decode(["uint256[8]"], encodedProof)[0] as BigInt[];
  const hexArray = binArray.map((item) =>
    ethers.utils.hexlify(item as bigint).toString()
  );

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
  credential_type: CredentialType
) => {
  const result = await graphQLClient.query<IAppActionWithContractAddress>({
    query: queryFetchAppActionWithContractAddress,
    variables: {
      app_id,
      nullifier_hash,
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
  const ensName = getSmartContractENSName(app.is_staging, credential_type);
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
 * Verifies a ZKP with the World ID smart contract
 */
export const verifyProof = async (
  proofParams: IInputParams,
  verifyParams: IVerifyParams
): Promise<{ success?: true; status?: string; error?: IInternalError }> => {
  // Parse the inputs
  const signalHash = IDKitInternal.hashToField(proofParams.signal).digest;
  const proof = decodeProof(proofParams.proof);

  // Query the signup sequencer to verify the proof
  const body = JSON.stringify({
    root: proofParams.merkle_root,
    nullifierHash: proofParams.nullifier_hash,
    externalNullifierHash: proofParams.external_nullifier,
    signalHash,
    proof,
  });

  const sequencerUrl =
    sequencerMapping[verifyParams.credential_type.toString()]?.[
      verifyParams.is_staging.toString()
    ];

  const response = await fetch(`${sequencerUrl}/verifySemaphoreProof`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const rawErrorMessage = await response.text();
    const knownError = KNOWN_ERROR_CODES.find(
      ({ rawMessage }) => rawMessage === rawErrorMessage
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
  }

  const result = await response.json();

  return { success: true, status: result.status };
};
