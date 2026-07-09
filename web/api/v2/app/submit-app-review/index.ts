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
import { getSdk as insertAppReview } from "./graphql/insert-app-review.generated";
import { getSdk as updateAppReviewRating } from "./graphql/update-app-review-rating.generated";

const schema = yup
  .object({
    proof: yup.string().strict().required("This attribute is required."),
    nullifier_hash: yup
      .string()
      .strict()
      // Bound to 64 hex chars (a uint256): rejects over-width values that
      // would otherwise pass proof verification (decode reads the first 32
      // bytes) but overflow the canonicalizer's toBeHex(..., 32) as a 500.
      .matches(
        /^(0x)?[\da-fA-F]{1,64}$/,
        "Invalid nullifier_hash. Must be a hex string (≤ 64 hex chars) with optional 0x prefix.",
      )
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

  // Insert the review row; under concurrency one INSERT wins (the UNIQUE
  // constraint serializes the rest). A per-person nullifier conflict means an
  // existing review to update in place. app.rating_sum / rating_count are
  // maintained transactionally by the app_reviews_maintain_rating DB trigger,
  // so the handler never touches them (no read-modify-write race).
  let reviewWritten = false;

  try {
    const { insert_app_reviews_one } = await insertAppReview(
      serviceClient,
    ).InsertAppReview({
      nullifier_hash: nullifierHash,
      app_id,
      country,
      rating: parsedParams.rating,
    });
    reviewWritten = Boolean(insert_app_reviews_one);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Only a per-person nullifier uniqueness violation means "already reviewed".
    // Any other error (e.g. an app_reviews_pkey collision or a transport
    // failure) is a genuine failure.
    if (!message.includes("app_reviews_nullifier_hash_key")) {
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

    // Existing review for this person — update their rating in place.
    const { update_app_reviews } = await updateAppReviewRating(
      serviceClient,
    ).UpdateAppReviewRating({
      app_id,
      nullifier_hash: nullifierHash,
      rating: parsedParams.rating,
    });
    reviewWritten = Boolean(update_app_reviews?.affected_rows);
  }

  if (!reviewWritten) {
    logger.error("App review was neither inserted nor updated", { app_id });
    return errorResponse({
      statusCode: 500,
      code: "app_review_failed",
      detail: "Failed to set app review.",
      attribute: null,
      req,
      app_id,
    });
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
