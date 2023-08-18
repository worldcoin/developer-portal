import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { runCors } from "src/backend/cors";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { verifyProof } from "src/backend/verify";
import { CredentialType } from "src/lib/types";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";

const schema = yup.object({
  app_id: yup.string().strict().required("This attribute is required."),
  action: yup
    .string()
    .strict()
    .nonNullable()
    .defined("This attribute is required."),
  signal: yup
    .string()
    .strict()
    .nonNullable()
    .defined("This attribute is required."),
  proof: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  is_staging: yup.boolean().strict().required("This attribute is required."),
  credential_type: yup
    .string()
    .required("This attribute is required.")
    .oneOf(Object.values(CredentialType)),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const external_nullifier = IDKitInternal.generateExternalNullifier(
    parsedParams.app_id,
    parsedParams.action
  ).digest;

  const result = await verifyProof(
    {
      merkle_root: parsedParams.merkle_root,
      signal: parsedParams.signal,
      nullifier_hash: parsedParams.nullifier_hash,
      external_nullifier,
      proof: parsedParams.proof,
    },
    {
      is_staging: parsedParams.is_staging,
      credential_type: parsedParams.credential_type,
    }
  );

  if (result.success) {
    return res.status(200).json({ success: true, status: result.status });
  }

  if (result.error) {
    return res.status(400).json(result.error);
  }

  return errorResponse(
    res,
    500,
    "server_error",
    "Unable to verify proof due to a server error. Please try again.",
    null,
    req
  );
}
