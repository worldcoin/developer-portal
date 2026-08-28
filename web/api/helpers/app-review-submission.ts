import "server-only";

import { getSdk as getCaptureListingReviewSubmissionSdk } from "@/api/helpers/graphql/capture-listing-review-submission.generated";
import { mainAppStoreFormReviewSubmitSchema } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import { LocalisationData } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/types/AppStoreFormTypes";
import { getSupportType } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils";
import {
  getLocalisationFormValues,
  transformMailtoToRawEmail,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils/dataTransforms";
import { reviewSchema as basicInformationReviewSchema } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/form-schema";
import { getSdk as getSubmitAppSdk } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/SubmitAppModal/graphql/server/submit-app.generated";
import {
  FetchAppMetadataByIdQuery,
  getSdk as getReviewAppMetadataSdk,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/server/fetch-review-app-metadata.generated";
import { GraphQLClient } from "graphql-request";
import * as yup from "yup";

type ReviewMetadata = FetchAppMetadataByIdQuery["app_metadata"][number];
type ReviewLocalization = FetchAppMetadataByIdQuery["localisations"][number];

export type ReviewSubmissionActor = {
  subject: string | null;
  email: string | null;
};

export class AppReviewSubmissionError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "validation"
      | "not_found"
      | "conflict" = "validation",
    public readonly details?: string[],
  ) {
    super(message);
  }
}

const assertValidHttpsIntegrationUrl = (integrationUrl: string) => {
  try {
    const parsed = new URL(integrationUrl);
    if (parsed.protocol !== "https:" || !parsed.hostname) throw new Error();
  } catch {
    throw new AppReviewSubmissionError(
      "Integration URL must be a valid HTTPS URL",
    );
  }
};

const assertSupportedLanguageRows = (
  metadata: ReviewMetadata,
  localizations: ReviewLocalization[],
) => {
  const isMiniApp = metadata.app_mode === "mini-app";
  const missing = (metadata.supported_languages ?? [])
    .filter((language) => language !== "en")
    .filter((language) => {
      const localization = localizations.find(
        (candidate) => candidate.locale === language,
      );

      if (!localization?.name || !localization.description) return true;
      return (
        isMiniApp &&
        (!localization.short_name || !localization.world_app_description)
      );
    });

  if (missing.length > 0) {
    throw new AppReviewSubmissionError(
      `Missing localisation for language code: ${missing.join(", ")}`,
    );
  }
};

const validateReviewState = async (
  metadata: ReviewMetadata,
  localizations: ReviewLocalization[],
  isListingReview: boolean,
) => {
  if (metadata.app.is_staging) {
    throw new AppReviewSubmissionError(
      "Staging apps cannot be submitted for review",
    );
  }

  if (
    isListingReview &&
    !(["mini-app", "external"] as string[]).includes(metadata.app_mode)
  ) {
    throw new AppReviewSubmissionError(
      "Only a Mini App or external integration can be submitted for review",
    );
  }

  if (isListingReview) {
    assertValidHttpsIntegrationUrl(metadata.integration_url);
    assertSupportedLanguageRows(metadata, localizations);
  }

  const supportLinkOrEmail = metadata.support_link;
  const supportType = getSupportType(supportLinkOrEmail);
  const supportLink = supportType === "link" ? supportLinkOrEmail : "";
  const supportEmail =
    supportType === "email"
      ? transformMailtoToRawEmail(supportLinkOrEmail)
      : "";
  const localizationFormValues = getLocalisationFormValues(
    metadata,
    localizations as LocalisationData,
  );
  const validationOptions = {
    abortEarly: false,
    strict: true,
    stripUnknown: true,
    context: { isMiniApp: metadata.app_mode === "mini-app" },
  } as const;

  try {
    if (isListingReview) {
      await basicInformationReviewSchema.validate(
        {
          name: metadata.name,
          integration_url: metadata.integration_url,
          app_website_url: metadata.app_website_url,
        },
        validationOptions,
      );
    }
    await mainAppStoreFormReviewSubmitSchema.validate(
      {
        ...metadata,
        support_type: supportType,
        support_link: supportLink,
        support_email: supportEmail,
        localisations: localizationFormValues,
      },
      validationOptions,
    );
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new AppReviewSubmissionError(
        error.errors[0] ?? "App metadata is incomplete",
        "validation",
        error.errors,
      );
    }
    throw error;
  }
};

export type SubmitAppForReviewOperationInput = {
  client: GraphQLClient;
  appMetadataId: string;
  expectedAppId: string;
  expectedTeamId: string;
  changelog: string;
  listingConsent: boolean;
  actor: ReviewSubmissionActor;
};

/**
 * The only server-side app-review submission operation used by human and MCP
 * callers. Caller-specific auth and response formatting stay at the edges.
 */
export const submitAppForReviewOperation = async ({
  client,
  appMetadataId,
  expectedAppId,
  expectedTeamId,
  changelog,
  listingConsent,
  actor,
}: SubmitAppForReviewOperationInput) => {
  const reviewData = await getReviewAppMetadataSdk(client).FetchAppMetadataById(
    { app_metadata_id: appMetadataId },
  );
  const metadata = reviewData.app_metadata[0];

  if (!metadata) {
    throw new AppReviewSubmissionError(
      "App metadata not found or not in unverified state",
      "not_found",
    );
  }

  if (
    metadata.app_id !== expectedAppId ||
    metadata.app.id !== expectedAppId ||
    metadata.app.team_id !== expectedTeamId
  ) {
    throw new AppReviewSubmissionError(
      "App metadata does not belong to the requested app and team",
      "not_found",
    );
  }

  const localizations = [...reviewData.localisations].sort(
    (left, right) =>
      left.locale.localeCompare(right.locale) ||
      left.id.localeCompare(right.id),
  );
  const isListingReview = listingConsent;
  await validateReviewState(metadata, localizations, isListingReview);

  if (isListingReview) {
    const result = await getCaptureListingReviewSubmissionSdk(
      client,
    ).CaptureListingReviewSubmission({
      app_metadata_id: appMetadataId,
      changelog,
      submitted_by_subject: actor.subject,
      submitted_by_email: actor.email,
      listing_consent: true,
      expected_metadata_updated_at: metadata.updated_at,
      expected_localizations_snapshot: localizations,
    });
    const submission = result.capture_listing_review_submission[0];

    if (!submission) {
      throw new AppReviewSubmissionError(
        "Listing review submission was not captured",
        "conflict",
      );
    }

    return {
      appMetadata: {
        id: metadata.id,
        app_id: metadata.app_id,
        verification_status: "awaiting_review",
        is_developer_allow_listing: true,
      },
      reviewSubmission: submission,
    };
  }

  const result = await getSubmitAppSdk(client).SubmitApp({
    app_metadata_id: appMetadataId,
    is_developer_allow_listing: listingConsent,
    verification_status: "awaiting_review",
    changelog,
  });

  if (!result.update_app_metadata_by_pk) {
    throw new AppReviewSubmissionError(
      "App metadata was not submitted",
      "conflict",
    );
  }

  return {
    appMetadata: {
      id: metadata.id,
      app_id: metadata.app_id,
      verification_status: "awaiting_review",
      is_developer_allow_listing: listingConsent,
    },
    reviewSubmission: null,
  };
};
