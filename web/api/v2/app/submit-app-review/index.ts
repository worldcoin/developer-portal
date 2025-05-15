import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { verifyProof } from "@/api/helpers/verify";
import { NativeAppToAppIdMapping } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField } from "@worldcoin/idkit-core/hashing";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchAppReview } from "./graphql/fetch-current-app-review.generated";
import { getSdk as updateReviewCount } from "./graphql/update-review-counter.generated";
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

  let app_id = parsedParams.app_id;

  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_environment",
      detail: "Invalid Environment Configuration",
      attribute: null,
      req,
      app_id,
    });
  }

  // If native app, map to app_id
  if (app_id in NativeAppToAppIdMapping[process.env.NEXT_PUBLIC_APP_ENV]) {
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
      is_staging: process.env.NEXT_PUBLIC_APP_ENV === "staging",
      verification_level: parsedParams.verification_level,
      max_age: 3600, // require that root be less than 1 hour old
    },
  );

  if (error || !success) {
    logger.warn("App review failed", { app_id });
    return errorResponse({
      statusCode: error?.statusCode || 400,
      code: error?.code || AppErrorCodes.GenericError,
      detail:
        error?.message ||
        "Review Failed: There was an error verifying this proof.",
      attribute: error?.attribute || null,
      req,
      app_id,
    });
  }

  const serviceClient = await getAPIServiceGraphqlClient();

  const { app_reviews } = await fetchAppReview(serviceClient).GetAppReview({
    nullifier_hash: parsedParams.nullifier_hash,
    app_id: app_id,
  });

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
      app_id,
    });
  }

  // Calculate the rating sum and count increment
  let ratingSumIncrement = parsedParams.rating;
  let ratingCountIncrement = 1;
  if (app_reviews.length) {
    // If we already have an existing row for this user, only adjust for the difference
    ratingSumIncrement = parsedParams.rating - app_reviews[0].rating;
    ratingCountIncrement = 0;
  }

  // Anchor: Update App Review Count
  const { update_app } = await updateReviewCount(
    serviceClient,
  ).UpdateAppRatingSumMutation({
    app_id: app_id,
    rating: ratingSumIncrement,
    rating_count_inc: ratingCountIncrement,
  });

  if (!update_app) {
    console.warn("Failed to update app review count", { app_id });
  }

  await captureEvent({
    event: "action_verify_success",
    distinctId: `app_review_${app_id}`,
    properties: {
      action_id: "app_review",
      app_id: app_id,
      verification_level: parsedParams.verification_level,
      environment: "production",
      type: "unlimited",
    },
  });

  return NextResponse.json({ status: 200 });
};
