import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { verifyProof } from "@/api/helpers/verify";
import { logger } from "@/lib/logger";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField, packAndEncode } from "@worldcoin/idkit-core/hashing";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as upsertAppReview } from "./graphql/upsert-app-review.generated";

const schema = yup.object({
  proof: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  verification_level: yup
    .string()
    .oneOf(Object.values(VerificationLevel))
    .required("This attribute is required."),
  rating: yup
    .number()
    .min(1, "Min rating is 1")
    .max(5, "Max rating is 5")
    .strict()
    .required(),
  country: yup.string().max(2).strict().required(),
  app_id: yup
    .string()
    .strict()
    .required()
    .test(
      "no-staging",
      "Staging apps cannot be reviewed",
      (val) => !val.includes("staging"),
    ),
});

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  // Fix the signal hash to be empty string
  const signalHash =
    "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4";

  const external_nullifier = packAndEncode([
    ["uint256", hashToField(`${parsedParams.app_id}_app_review`).hash],
  ]);

  const { error, success } = await verifyProof(
    {
      signal_hash: signalHash,
      proof: parsedParams.proof,
      merkle_root: parsedParams.merkle_root,
      nullifier_hash: parsedParams.nullifier_hash,
      external_nullifier: external_nullifier.digest,
    },
    {
      is_staging: false,
      verification_level: parsedParams.verification_level,
    },
  );

  if (error || !success) {
    logger.warn("App review failed");
    return errorResponse({
      statusCode: error?.statusCode || 400,
      code: error?.code || AppErrorCodes.GenericError,
      detail:
        error?.message ||
        "Review Failed: There was an error verifying this proof.",
      attribute: error?.attribute || null,
      req,
    });
  }

  const serviceClient = await getAPIServiceGraphqlClient();

  // Anchor: Insert App Rating or Update App Rating
  const { insert_app_reviews_one } = await upsertAppReview(
    serviceClient,
  ).UpsertAppReview({
    nullifier_hash: external_nullifier.digest,
    app_id: parsedParams.app_id,
    country: parsedParams.country.toLowerCase(),
    rating: parsedParams.rating,
  });

  if (!insert_app_reviews_one) {
    return errorResponse({
      statusCode: 400,
      code: "app_review_failed",
      detail: "Failed to set app review.",
      attribute: null,
      req,
    });
  }

  return NextResponse.json({ status: 200 });
};
