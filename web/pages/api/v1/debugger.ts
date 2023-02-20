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
import {
  PRODUCTION_RPC,
  STAGING_RPC,
  KNOWN_ERROR_CODES,
  CONTRACT_ABI,
  parseVerifyProofRequestInputs,
} from "api-helpers/utils";
import { getAPIServiceClient } from "api-graphql";

interface ENSQuery {
  cache: {
    key: string;
    value: string;
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
    "action_id",
    "signal",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  // Check action ID is valid & fetch smart contract address
  const query = gql`
    query ENSActionQuery {
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
    }
  `;

  const client = await getAPIServiceClient();
  const ensActionQuery = await client.query<ENSQuery>({
    query,
  });

  // Parse & validate inputs
  const proofParams = parseVerifyProofRequestInputs(req.body, res);
  if (!proofParams) {
    return;
  }

  // Obtain appropriate Semaphore contract address
  const ensName =
    req.body.environment === "production"
      ? "semaphore.wld.eth"
      : "staging.semaphore.wld.eth";
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
    `${
      req.body.environment === "production" ? PRODUCTION_RPC : STAGING_RPC
    }/v2/${process.env.ALCHEMY_API_KEY}`,
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

  res.status(200).json({
    success: true,
  });
}
