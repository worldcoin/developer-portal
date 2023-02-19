import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "../../../errors";
import { runCors } from "../../../cors";
import { ethers } from "ethers";
import { gql } from "@apollo/client";
import * as jose from "jose";
import { URL } from "url";
import {
  canVerifyForAction,
  CONTRACT_ABI,
  generateVerificationJWT,
  KNOWN_ERROR_CODES,
  parseVerifyProofRequestInputs,
  PRODUCTION_RPC,
  STAGING_RPC,
} from "api-utils";
import { getAPIServiceClient } from "api-graphql";

interface ENSActionQuery {
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
      nullifiers: {
        nullifier_hash: string;
      }[];
      max_verifications: number;
    }[];
  }[];

  jwks: {
    id: string;
    private_jwk: jose.JWK;
  }[];
}

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
    "app_id",
    "signal",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  // Check action ID is valid & fetch smart contract address
  // @REVIEW: How we should pick action? Should we add external_nullifier here too?
  const query = gql`
    query ENSActionQuery(
      $app_id: String!
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
      app(where: { id: { _eq: $app_id }, status: { _eq: "active" } }) {
        id
        is_staging
        engine
        actions(
          where: { nullifiers: { nullifier_hash: { _eq: $nullifier_hash } } }
        ) {
          id
          max_verifications
          nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
            nullifier_hash
          }
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
      app_id: req.body.app_id,
      nullifier_hash: req.body.nullifier_hash,
      now: new Date().toISOString(),
    },
  });

  if (!ensActionQuery.data.app.length) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be no longer active."
    );
  }

  const app = ensActionQuery.data.app[0];

  // Return error response if action does not exist or is no longer active
  if (!app.actions.length) {
    return errorResponse(res, 404, "not_found", "We couldn't find action.");
  }

  if (app.engine !== "cloud") {
    return errorValidation(
      "invalid_engine",
      "This action runs on-chain and can't be verified here.",
      null,
      res
    );
  }

  const action = app.actions[0];

  // Return error response if action should not run on `cloud` engine

  // Return error response if person has already verified before and exceeded the max number of times to verify
  if (!canVerifyForAction(action.nullifiers, action.max_verifications)) {
    const errorMsg =
      action.max_verifications === 1
        ? "This person has already verified for this action."
        : `This person has already verified for this action the maximum number of times (${action.max_verifications}).`;
    return errorValidation("already_verified", errorMsg, null, res);
  }

  // Parse & validate inputs
  const proofParams = parseVerifyProofRequestInputs(req.body, res);
  if (!proofParams) {
    return;
  }

  // Obtain appropriate Semaphore contract address
  const ensName = app.is_staging
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
    `${app.is_staging ? STAGING_RPC : PRODUCTION_RPC}/v2/${
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

  // TODO: implement return_url
  // let return_url: string | null = null;

  // if (action.return_url) {
  //   const parsedReturnUrl = new URL(action.return_url);
  //   parsedReturnUrl.searchParams.append(
  //     "verification_jwt",
  //     await generateVerificationJWT(
  //       ensActionQuery.data.jwks[0].private_jwk,
  //       ensActionQuery.data.jwks[0].id,
  //       req.body.signal,
  //       req.body.nullifier_hash
  //     )
  //   );
  //   parsedReturnUrl.searchParams.append("success", "true");
  //   return_url = parsedReturnUrl.toString();
  // }

  res.status(200).json({
    success: true,
    action_id: action.id ?? null,
    nullifier_hash: insertResponse.data.insert_nullifier_one.nullifier_hash,
    created_at: insertResponse.data.insert_nullifier_one.created_at,
    // return_url,
  });
}
