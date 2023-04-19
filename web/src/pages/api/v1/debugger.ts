import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "../../../backend/errors";
import { runCors } from "../../../backend/cors";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { verifyProof } from "src/backend/verify";
import { getSmartContractENSName } from "src/backend/utils";
import { gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";

const cacheQuery = gql`
  query FetchCache($ensName: String!) {
    cache(where: { key: { _eq: $ensName } }) {
      key
      value
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "app_id",
    "credential_type",
    "is_staging",
    "merkle_root",
    "nullifier_hash",
    "proof",
  ]) {
    if (req.body[attr] === "") {
      return errorRequiredAttribute(attr, res);
    }
  }

  const external_nullifier = IDKitInternal.generateExternalNullifier(
    req.body.app_id,
    req.body.action
  ).digest;

  const ensName = getSmartContractENSName(
    req.body.is_staging,
    req.body.credential_type
  );

  const client = await getAPIServiceClient();
  const { data } = await client.query<{
    cache: [{ key: string; value: string }];
  }>({
    query: cacheQuery,
    variables: { ensName },
  });

  const contract_address = data.cache[0].value;

  const result = await verifyProof(
    {
      merkle_root: req.body.merkle_root,
      signal: req.body.signal,
      nullifier_hash: req.body.nullifier_hash,
      external_nullifier,
      proof: req.body.proof,
    },
    {
      contract_address: contract_address,
      is_staging: req.body.is_staging,
      credential_type: req.body.credential_type,
    }
  );

  if (result.success) {
    return res.status(200).json({ success: true, status: result.status });
  }

  return errorResponse(res, 500, "invalid", "invalid");
}
