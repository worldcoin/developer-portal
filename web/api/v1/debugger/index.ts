import { errorResponse } from "@/api/helpers/errors";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { verifyProof } from "@/api/helpers/verify";
import { generateExternalNullifier } from "@/lib/hashing";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField } from "@worldcoin/idkit-core/hashing";
import { toBeHex } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

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

const corsMethods = ["POST", "OPTIONS"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return corsHandler(handleError(req), corsMethods);
  }

  const external_nullifier = generateExternalNullifier(
    parsedParams.app_id,
    parsedParams.action,
  ).digest;

  try {
    const signalHash = toBeHex(hashToField(parsedParams.signal).hash as bigint);
    const result = await verifyProof(
      {
        merkle_root: parsedParams.merkle_root,
        signal_hash: signalHash,
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
      return corsHandler(
        NextResponse.json({ success: true, status: result.status }),
        corsMethods,
      );
    }

    if (result.error) {
      return corsHandler(
        errorResponse({
          statusCode: 400,
          code: result.error.code,
          detail: result.error.message,
          req,
        }),
        corsMethods,
      );
    }
  } catch (e) {
    console.warn(e);
  }

  return corsHandler(
    errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Unable to verify proof due to a server error. Please try again.",
      attribute: null,
      req,
    }),
    corsMethods,
  );
}

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
