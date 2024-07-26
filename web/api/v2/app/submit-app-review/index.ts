import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { verifyProof } from "@/api/helpers/verify";
import { NativeAppToAppIdMapping } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { logger } from "@/lib/logger";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField } from "@worldcoin/idkit-core/hashing";
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
  app_id: yup.string().strict().required(),
  country: yup.string().max(2).strict().optional(),
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

  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_environment",
      detail: "Invalid Environment Configuration",
      attribute: null,
      req,
    });
  }

  let app_id = parsedParams.app_id;

  // If native app, map to app_id
  if (
    app_id in
    Object.keys(NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV])
  ) {
    app_id = NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV][app_id];
  }

  // Fix the signal hash to be empty string
  const signalHash = hashToField(parsedParams.rating.toString());
  const external_nullifier = generateExternalNullifier(`${app_id}_app_review`);

  const { error, success } = await verifyProof(
    {
      signal_hash: signalHash.digest,
      proof: parsedParams.proof,
      merkle_root: parsedParams.merkle_root,
      nullifier_hash: parsedParams.nullifier_hash,
      external_nullifier: external_nullifier.digest,
    },
    {
      is_staging: app_id.includes("staging"),
      verification_level: parsedParams.verification_level,
      max_age: 3600, // require that root be less than 1 hour old
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
    nullifier_hash: parsedParams.nullifier_hash,
    app_id: app_id,
    country: parsedParams.country?.toLowerCase() ?? "",
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
