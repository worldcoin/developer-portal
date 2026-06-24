import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { canonicalizeNullifierHash, verifyProof } from "@/api/helpers/verify";
import { NativeAppToAppIdMapping } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchAppReview } from "./graphql/fetch-current-app-review.generated";
import { getSdk as insertAppReview } from "./graphql/insert-app-review.generated";
import { getSdk as updateAppReviewRating } from "./graphql/update-app-review-rating.generated";
import { getSdk as updateReviewCount } from "./graphql/update-review-counter.generated";

const schema = yup
  .object({
    proof: yup.string().strict().required("This attribute is required."),
    nullifier_hash: yup
      .string()
      .strict()
      .required("This attribute is required."),
    merkle_root: yup.string().strict().required("This attribute is required."),
    verification_level: yup
      .string()
      .oneOf(Object.values(LegacyVerificationLevel))
      .required("This attribute is required."),
    rating: yup
      .number()
      .min(1, "Min rating is 1")
      .max(5, "Max rating is 5")
      .strict()
      .required(),
    app_id: yup.string().strict().required(),
    country: yup.string().max(2).strict().optional(),
  })
  .noUnknown();

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
  const signalHash = hashSignal(parsedParams.rating.toString());
  const external_nullifier = generateExternalNullifier(`${app_id}_app_review`);

  const { error, success } = await verifyProof(
    {
      signal_hash: signalHash,
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
      // Defaulting to "generic_error" for backwards compatibility.
      code: error?.code || "generic_error",
      detail:
        error?.message ||
        "Review Failed: There was an error verifying this proof.",
      attribute: error?.attribute || null,
      req,
      app_id,
    });
  }

  const serviceClient = await getAPIServiceGraphqlClient();

  // Canonicalize the nullifier before any DB lookup/write so that re-encodings
  // of the same nullifier (0xABC / abc / 0x0abc / …) collapse to one value and
  // cannot bypass the per-person UNIQUE(nullifier_hash) constraint.
  const nullifierHash = canonicalizeNullifierHash(parsedParams.nullifier_hash);
  const country = parsedParams.country?.toLowerCase() ?? "";

  // Decide new-vs-edit from the atomic INSERT result rather than a
  // non-transactional read: under concurrent submissions of the same proof
  // only one INSERT wins (the UNIQUE constraint serializes the rest), so the
  // review count is incremented exactly once.
  let isNewReview = false;
  let previousRating = 0;

  try {
    const { insert_app_reviews_one } = await insertAppReview(
      serviceClient,
    ).InsertAppReview({
      nullifier_hash: nullifierHash,
      app_id,
      country,
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

    isNewReview = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Anything other than the per-person uniqueness violation is a real failure.
    if (!message.includes("unique") && !message.includes("duplicate")) {
      logger.error("Failed to insert app review", { error, app_id });
      return errorResponse({
        statusCode: 500,
        code: "app_review_failed",
        detail: "Failed to set app review.",
        attribute: null,
        req,
        app_id,
      });
    }

    // The user already reviewed this app: update their existing rating and
    // adjust the aggregate by the delta only (count unchanged).
    const { app_reviews } = await fetchAppReview(serviceClient).GetAppReview({
      nullifier_hash: nullifierHash,
      app_id,
    });
    previousRating = app_reviews[0]?.rating ?? 0;

    await updateAppReviewRating(serviceClient).UpdateAppReviewRating({
      app_id,
      nullifier_hash: nullifierHash,
      rating: parsedParams.rating,
    });
  }

  const ratingSumIncrement = isNewReview
    ? parsedParams.rating
    : parsedParams.rating - previousRating;
  const ratingCountIncrement = isNewReview ? 1 : 0;

  // Anchor: Update App Review Count
  const { update_app } = await updateReviewCount(
    serviceClient,
  ).UpdateAppRatingSumMutation({
    app_id,
    rating: ratingSumIncrement,
    rating_count_inc: ratingCountIncrement,
  });

  if (!update_app) {
    logger.warn("Failed to update app review count", { app_id });
  }

  await captureEvent({
    event: "app_review_success",
    distinctId: `app_review_${app_id}`,
    properties: {
      action_id: "app_review",
      app_id: app_id,
      environment: "production",
    },
  });

  return NextResponse.json({ status: 200 });
};
