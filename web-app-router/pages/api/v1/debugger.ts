import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "@/legacy/backend/errors";
import { runCors } from "@/legacy/backend/cors";
import { verifyProof } from "@/legacy/backend/verify";
import * as yup from "yup";
import { validateRequestSchema } from "@/legacy/backend/utils";
import { generateExternalNullifier } from "@/legacy/lib/hashing";
import { CredentialType, VerificationLevel } from "@worldcoin/idkit-core";

const schema = yup.object({
  app_id: yup
    .string<`app_${string}`>()
    .strict()
    .required("This attribute is required."),
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
  verification_level: yup
    .string()
    .oneOf(Object.values(VerificationLevel))
    .required(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

  const external_nullifier = generateExternalNullifier(
    parsedParams.app_id,
    parsedParams.action,
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
      verification_level: parsedParams.verification_level,
    },
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
    req,
  );
}
