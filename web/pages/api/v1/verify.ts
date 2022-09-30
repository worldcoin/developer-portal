import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "../../../errors";
import { runCors } from "../../../cors";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import { ethers } from "ethers";
import { gql } from "@apollo/client";
import * as jose from "jose";
import { URL } from "url";
import { canVerifyForAction, generateVerificationJWT } from "api-utils";
import { getAPIServiceClient } from "api-graphql";
import { utils } from "@worldcoin/id";

interface ENSActionQuery {
  cache: {
    key: string;
    value: string;
  }[];
  action: {
    id: string;
    is_staging: boolean;
    engine: "cloud" | "on-chain";
    return_url: string;
    max_verifications_per_person: number;
    nullifiers: {
      nullifier_hash: string;
      created_at: string;
    }[];
  }[];
  jwks: {
    id: string;
    private_jwk: jose.JWK;
  }[];
}

interface ParameterInterface {
  merkle_root: BigInt;
  signal_hash: BigInt;
  nullifier_hash: BigInt;
  action_id_hash: BigInt;
  proof: BigInt[];
}

const STAGING_RPC = "https://polygon-mumbai.g.alchemy.com";
const PRODUCTION_RPC = "https://polygon-mainnet.g.alchemy.com";

const KNOWN_ERROR_CODES = [
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

const CONTRACT_ABI = [
  "function verifyProof (uint256 root, uint256 groupId, uint256 signalHash, uint256 nullifierHash, uint256 externalNullifierHash, uint256[8] calldata proof)",
];

export default async function handleVerify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "proof",
    "nullifier_hash",
    "merkle_root",
    "action_id",
    "signal",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  // Check action ID is valid & fetch smart contract address
  const query = gql`
    query ENSActionQuery(
      $action_id: String!
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

      action(where: { id: { _eq: $action_id }, status: { _eq: "active" } }) {
        id
        is_staging
        engine
        return_url
        max_verifications_per_person
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          nullifier_hash
        }
      }

      jwks(limit: 1, where: { expires_at: { _gt: $now } }) {
        id
        private_jwk
      }
    }
  `;

  const client = await getAPIServiceClient();
  const ensActionQuery = await client.query<ENSActionQuery>({
    query,
    variables: {
      action_id: req.body.action_id,
      nullifier_hash: req.body.nullifier_hash,
      now: new Date().toISOString(),
    },
  });

  // Return error response if action does not exist or is no longer active
  if (!ensActionQuery.data.action.length) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an action with this ID. Action may be no longer active."
    );
  }

  const action = ensActionQuery.data.action[0];

  // Return error response if action should not run on `cloud` engine
  if (action.engine !== "cloud") {
    return errorValidation(
      "invalid_engine",
      "This action runs on-chain and can't be verified here.",
      null,
      res
    );
  }

  // Return error response if person has already verified before and exceeded the max number of times to verify
  if (
    !canVerifyForAction(action.nullifiers, action.max_verifications_per_person)
  ) {
    const errorMsg =
      action.max_verifications_per_person === 1
        ? "This person has already verified for this action."
        : `This person has already verified for this action the maximum number of times (${action.max_verifications_per_person}).`;
    return errorValidation("already_verified", errorMsg, null, res);
  }

  // Parse & validate inputs
  const proofParams = parseRequestInputs(req.body, res);
  if (!proofParams) {
    return;
  }

  // Obtain appropriate Semaphore contract address
  const ensName = action.is_staging
    ? "staging.semaphore.wld.eth"
    : "semaphore.wld.eth";
  const contractRecord = ensActionQuery.data.cache.find(
    ({ key }) => key === ensName
  );
  if (!contractRecord) {
    return errorResponse(
      res,
      500,
      "contract_not_found",
      "There was an internal issue verifying this proof. Please try again."
    );
  }

  // Construct payload to verify proof with on-chain Semaphore instance
  const iface = new ethers.utils.Interface(CONTRACT_ABI);
  const encodedCallData = iface.encodeFunctionData("verifyProof", [
    proofParams.merkle_root,
    1,
    proofParams.signal_hash,
    proofParams.nullifier_hash,
    proofParams.action_id_hash,
    proofParams.proof,
  ]);

  // Call Semaphore contract and verify proof
  const contractCallPayload = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: contractRecord.value,
        data: encodedCallData,
      },
    ],
  };
  const ethCallRequest = await fetch(
    `${action.is_staging ? STAGING_RPC : PRODUCTION_RPC}/v2/${
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

    return errorValidation(
      knownError?.code || "invalid_proof",
      knownError?.detail ||
        `We couldn't verify the provided proof (error code ${rawErrorCode}).`,
      null,
      res
    );
  }

  const insertNullifierQuery = gql`
    mutation InsertNullifier(
      $nullifier_hash: String!
      $action_id: String!
      $merkle_root: String
    ) {
      insert_nullifier_one(
        object: {
          nullifier_hash: $nullifier_hash
          merkle_root: $merkle_root
          action_id: $action_id
        }
      ) {
        nullifier_hash
        created_at
      }
    }
  `;
  const insertResponse = await client.query({
    query: insertNullifierQuery,
    variables: {
      nullifier_hash: req.body.nullifier_hash,
      action_id: action.id,
      merkle_root: req.body.merkle_root,
    },
  });

  let return_url: string | null = null;

  if (action.return_url) {
    const parsedReturnUrl = new URL(action.return_url);
    parsedReturnUrl.searchParams.append(
      "verification_jwt",
      await generateVerificationJWT(
        ensActionQuery.data.jwks[0].private_jwk,
        ensActionQuery.data.jwks[0].id,
        req.body.signal,
        req.body.nullifier_hash
      )
    );
    parsedReturnUrl.searchParams.append("success", "true");
    return_url = parsedReturnUrl.toString();
  }

  res.status(200).json({
    success: true,
    nullifier_hash: insertResponse.data.insert_nullifier_one.nullifier_hash,
    created_at: insertResponse.data.insert_nullifier_one.created_at,
    return_url,
  });
}

const parseRequestInputs = (
  body: NextApiRequest["body"],
  res: NextApiResponse
): ParameterInterface | null => {
  let proof,
    nullifier_hash,
    action_id_hash,
    signal_hash,
    merkle_root = null;

  try {
    proof = abi.decode(["uint256[8]"], body.proof)[0] as BigInt[];
  } catch (e) {
    console.error(e);
    errorValidation(
      "invalid_format",
      "This attribute is improperly formatted. Expected an ABI-encoded uint256[8].",
      "proof",
      res
    );
    return null;
  }

  try {
    nullifier_hash = abi.decode(["uint256"], body.nullifier_hash)[0] as BigInt;
  } catch (e) {
    console.error(e);
    errorValidation(
      "invalid_format",
      "This attribute is improperly formatted. Expected an ABI-encoded uint256.",
      "nullifier_hash",
      res
    );
    return null;
  }

  if (body.advanced_use_raw_action_id) {
    if (!utils.validateABILikeEncoding(body.action_id)) {
      errorValidation(
        "invalid_format",
        `You enabled 'advanced_use_raw_action_id' which uses the action ID raw (without any additional hashing or encoding),
        but the action ID you provided does not look to be validly hashed or encoded. Please check
        https://id.worldcoin.org/api/reference#verify for details.`,
        "action_id",
        res
      );
      return null;
    }

    action_id_hash = body.action_id;
  } else {
    try {
      action_id_hash = utils.worldIDHash(body.action_id).hash;
    } catch (e) {
      console.error(e);
      errorValidation(
        "invalid_format",
        "This attribute is improperly formatted.",
        "action_id",
        res
      );
      return null;
    }
  }

  if (body.advanced_use_raw_signal) {
    if (!utils.validateABILikeEncoding(body.signal)) {
      errorValidation(
        "invalid_format",
        `You enabled 'advanced_use_raw_signal' which uses the signal raw (without any additional hashing or encoding),
        but the signal you provided does not look to be validly hashed or encoded. Please check
        https://id.worldcoin.org/api/reference#verify for details.`,
        "signal",
        res
      );
      return null;
    }

    signal_hash = body.signal;
  } else {
    try {
      signal_hash = utils.worldIDHash(body.signal).hash;
    } catch (e) {
      console.error(e);
      errorValidation(
        "invalid_format",
        "This attribute is improperly formatted.",
        "signal",
        res
      );
      return null;
    }
  }

  try {
    merkle_root = abi.decode(["uint256"], body.merkle_root)[0] as BigInt;
  } catch (e) {
    console.error(e);
    errorValidation(
      "invalid_format",
      "This attribute is improperly formatted. Expected an ABI-encoded uint256.",
      "merkle_root",
      res
    );
    return null;
  }

  return { proof, nullifier_hash, action_id_hash, signal_hash, merkle_root };
};
