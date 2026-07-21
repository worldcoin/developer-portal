"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useApolloClient } from "@apollo/client/react";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { MULTIPLE_ERRORS_TOAST_MESSAGE } from "../AppStore/utils/form-error-utils";
import { BasicInformationHandle } from "../BasicInformation";
import { useSaveStatusActions } from "../SaveStatus";

const scrollToFirstError = () => {
  requestAnimationFrame(() => {
    document
      .querySelector(".bg-system-error-50")
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  });
};

type ReviewSubmissionButtonProps = {
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  appId: string;
  teamId: string;
  viewMode: "unverified" | "verified";
  onSubmitSuccess: () => void;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  className?: string;
};

/** Review validation and submission entry point owned by Configuration. */
export const ReviewSubmissionButton = ({
  appMetadata,
  appId,
  teamId,
  viewMode,
  onSubmitSuccess,
  basicInfoRef,
  className,
}: ReviewSubmissionButtonProps) => {
  const form = useFormContext<AppStoreFormValues>();
  const searchParams = useSearchParams();
  const client = useApolloClient();
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const hasAutoSubmitted = useRef(false);
  const saveStatus = useSaveStatusActions();

  const submitForReview = useCallback(async () => {
    if (appMetadata?.verification_status !== "unverified") {
      toast.error("Only unverified apps can be submitted for review");
      return;
    }

    const captureAttempt = (
      result:
        | "passed"
        | "basic_info_failed"
        | "flush_failed"
        | "validation_failed"
        | "error",
      extra?: Record<string, unknown>,
    ) => {
      posthog.capture("app_submit_review_attempted", {
        app_id: appId,
        team_id: teamId,
        result,
        ...extra,
      });
    };

    setIsSubmittingForReview(true);
    try {
      if (basicInfoRef?.current) {
        const ok = await basicInfoRef.current.submit({
          silent: true,
          forReview: true,
        });
        if (!ok) {
          captureAttempt("basic_info_failed");
          toast.error(
            "Please fix basic information errors before submitting for review",
          );
          scrollToFirstError();
          return;
        }
      }

      const isMiniApp = appMetadata.app_mode === "mini-app";
      const currentSupportType = form.getValues("support_type");
      if (currentSupportType === "email") {
        form.setValue("support_link", "", {
          shouldDirty: true,
          shouldValidate: false,
        });
      } else if (currentSupportType === "link") {
        form.setValue("support_email", "", {
          shouldDirty: true,
          shouldValidate: false,
        });
      }

      if (saveStatus) {
        const flushed = await saveStatus.flushAll();
        if (!flushed) {
          captureAttempt("flush_failed");
          toast.error(
            "Some changes could not be saved. Fix any errors and try again.",
          );
          return;
        }
      }

      const formValues = form.getValues();
      const enLocalization = formValues.localisations.find(
        (localisation) => localisation.language === "en",
      );
      const freshData = client.readQuery<FetchAppMetadataQuery>({
        query: FetchAppMetadataDocument,
        variables: { id: appId },
      });
      const freshAppMetadata =
        freshData?.app?.[0]?.app_metadata?.[0] ?? appMetadata;

      if (!freshAppMetadata.logo_img_url?.trim()) {
        const message = "Upload an app icon before submitting for review";
        form.setError("logo_img_url" as keyof AppStoreFormValues, { message });
        captureAttempt("validation_failed", {
          first_error_field: "logo_img_url",
          error_count: 1,
        });
        toast.error(message);
        scrollToFirstError();
        return;
      }

      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...formValues,
          name: enLocalization?.name,
          short_name: enLocalization?.short_name,
          world_app_description: enLocalization?.world_app_description,
          description_overview: enLocalization?.description_overview,
          logo_img_url: freshAppMetadata.logo_img_url,
          content_card_image_url: freshAppMetadata.content_card_image_url,
          app_website_url: freshAppMetadata.app_website_url,
        },
        {
          abortEarly: false,
          strict: true,
          stripUnknown: true,
          context: { isMiniApp },
        },
      );
      captureAttempt("passed");
      onSubmitSuccess();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        let errorMessage = error.message;
        error.inner.forEach((validationError) => {
          errorMessage = validationError.message;
          if (validationError.path) {
            form.setError(validationError.path as keyof AppStoreFormValues, {
              message: validationError.message,
            });
          }
        });
        if (error.inner.length > 1) {
          errorMessage = MULTIPLE_ERRORS_TOAST_MESSAGE;
        }
        const firstPath = error.inner[0]?.path;
        captureAttempt("validation_failed", {
          first_error_field: firstPath,
          error_count: error.inner.length,
        });
        toast.error(errorMessage);
        if (firstPath) {
          try {
            form.setFocus(firstPath as Parameters<typeof form.setFocus>[0]);
          } catch {
            // Non-registered paths (for example image fields) fall through to
            // the DOM-based error scroll below.
          }
        }
        scrollToFirstError();
        return;
      }

      captureAttempt("error");
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      console.error("Submitting App Failed: ", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingForReview(false);
    }
  }, [
    appId,
    appMetadata,
    basicInfoRef,
    client,
    form,
    onSubmitSuccess,
    saveStatus,
    teamId,
  ]);

  const shouldAutoSubmitForReview =
    searchParams.get("submitForReview") === "true";
  useEffect(() => {
    if (shouldAutoSubmitForReview && !hasAutoSubmitted.current) {
      void submitForReview();
      hasAutoSubmitted.current = true;
    }
  }, [shouldAutoSubmitForReview, submitForReview]);

  return (
    <DecoratedButton
      type="submit"
      className={clsx("h-12 px-6 py-3", className, {
        hidden:
          appMetadata.app_id?.includes("staging") &&
          process.env.NEXT_PUBLIC_APP_ENV === "production",
      })}
      disabled={viewMode === "verified" || isSubmittingForReview}
      onClick={submitForReview}
    >
      <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
        {isSubmittingForReview ? "Processing..." : "Submit for review"}
      </Typography>
    </DecoratedButton>
  );
};
