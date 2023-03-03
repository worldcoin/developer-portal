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
import { fetchSmartContractAddress } from "src/backend/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "action",
    "app_id",
    "credential_type",
    "is_staging",
    "merkle_root",
    "nullifier_hash",
    "proof",
    "signal",
  ]) {
    if (req.body[attr] === "") {
      return errorRequiredAttribute(attr, res);
    }
  }

  if (req.body.credential_type !== "phone") {
    return errorValidation(
      "invalid",
      "Invalid credential type. Only `phone` is supported for now.",
      "credential_type",
      res
    );
  }

  const external_nullifier = IDKitInternal.generateExternalNullifier(
    req.body.app_id,
    req.body.action
  ).digest;

  const contract_address = await fetchSmartContractAddress(req.body.is_staging);

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
    return res.status(200).json({ success: true });
  }

  return errorResponse(res, 500, "invalid", "invalid");
}
