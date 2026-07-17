"use client";

import { Button } from "@/components/Button";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useApolloClient } from "@apollo/client";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import type { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import type { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { MULTIPLE_ERRORS_TOAST_MESSAGE } from "../AppStore/utils/form-error-utils";
import type { BasicInformationHandle } from "../BasicInformation";
import { useSaveStatusActions } from "../SaveStatus";
import type {
  AppStoreActionsKind,
  AppStoreNextStep,
  FullAppMetadata,
} from "./types";
import { useAppStoreActionsLabelTransition } from "./useAppStoreActionsLabelTransition";

const scrollToFirstError = () => {
  requestAnimationFrame(() => {
    document
      .querySelector(".bg-system-error-50")
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  });
};

// app_metadata's top-level localized columns mirror the EN localisation. The
// review schema validates that row shape, so these fields are copied out of
// the EN localisation before .validate() and their error paths are mapped
// back to the registered localisations.{en}.* inputs after. Single list so
// the copy and the un-copy can't drift.
const EN_TOP_LEVEL_FIELDS = [
  "name",
  "short_name",
  "world_app_description",
  "description_overview",
] as const;

type AppStoreActionsButtonProps = {
  appMetadata: FullAppMetadata;
  appId: string;
  teamId: string;
  viewMode: "unverified" | "verified";
  nextStep?: AppStoreNextStep;
  onContinue: () => void;
  onSubmitSuccess: () => void;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onValidationError?: (fieldPath?: string) => void;
  className: string;
};

/** Persistent footer action that advances steps, then submits on the last one. */
export const AppStoreActionsButton = ({
  appMetadata,
  appId,
  teamId,
  viewMode,
  nextStep,
  onContinue,
  onSubmitSuccess,
  basicInfoRef,
  onValidationError,
  className,
}: AppStoreActionsButtonProps) => {
  const form = useFormContext<AppStoreFormValues>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const client = useApolloClient();
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const hasAutoSubmitted = useRef(false);
  const saveStatus = useSaveStatusActions();
  const isFinalStep = !nextStep;
  const targetActionKind: AppStoreActionsKind = isFinalStep
    ? "submit"
    : "continue";
  const {
    contentRef: actionContentRef,
    displayedActionKind,
    isTransitioningRef: isActionTransitioningRef,
  } = useAppStoreActionsLabelTransition(targetActionKind);

  const submitForReview = useCallback(async () => {
    if (appMetadata.verification_status !== "unverified") {
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
          onValidationError?.("basic_information");
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
        onValidationError?.("logo_img_url");
        toast.error(message);
        scrollToFirstError();
        return;
      }

      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...formValues,
          ...Object.fromEntries(
            EN_TOP_LEVEL_FIELDS.map((field) => [
              field,
              enLocalization?.[field],
            ]),
          ),
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
        // Un-alias: map row-shaped paths back to the registered
        // localisations.{en}.* inputs so setError paints the real field,
        // setFocus works, and the wizard opens the step that contains it.
        const enIndex = form
          .getValues("localisations")
          .findIndex((localisation) => localisation.language === "en");
        const toRegisteredPath = (path?: string) =>
          path &&
          (EN_TOP_LEVEL_FIELDS as readonly string[]).includes(path) &&
          enIndex !== -1
            ? `localisations.${enIndex}.${path}`
            : path;

        let errorMessage = error.message;
        error.inner.forEach((validationError) => {
          errorMessage = validationError.message;
          const path = toRegisteredPath(validationError.path ?? undefined);
          if (path) {
            form.setError(path as keyof AppStoreFormValues, {
              message: validationError.message,
            });
          }
        });
        if (error.inner.length > 1) {
          errorMessage = MULTIPLE_ERRORS_TOAST_MESSAGE;
        }
        const firstPath = toRegisteredPath(error.inner[0]?.path ?? undefined);
        captureAttempt("validation_failed", {
          // Analytics keeps the schema's own path so dashboards stay stable.
          first_error_field: error.inner[0]?.path,
          error_count: error.inner.length,
        });
        onValidationError?.(firstPath);
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
    onValidationError,
    onSubmitSuccess,
    saveStatus,
    teamId,
  ]);

  // Deep link: ?submitForReview=true runs the review flow once on arrival —
  // success opens the submit modal, validation failures route the wizard to
  // the failing step. The param is consumed immediately (ref + URL strip) so
  // reaching the final step later never re-triggers it.
  const shouldAutoSubmitForReview =
    searchParams.get("submitForReview") === "true";
  useEffect(() => {
    if (!shouldAutoSubmitForReview || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("submitForReview");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    void submitForReview();
  }, [
    pathname,
    router,
    searchParams,
    shouldAutoSubmitForReview,
    submitForReview,
  ]);

  const actionLabel = isFinalStep
    ? isSubmittingForReview
      ? "Processing..."
      : "Submit for review"
    : `Continue to ${nextStep.title}`;

  return (
    <Button
      type={isFinalStep ? "submit" : "button"}
      aria-label={actionLabel}
      className={twMerge(
        "inline-flex items-center justify-center",
        className,
        clsx({
          hidden:
            isFinalStep &&
            appMetadata.app_id?.includes("staging") &&
            process.env.NEXT_PUBLIC_APP_ENV === "production",
        }),
      )}
      disabled={
        isFinalStep && (viewMode === "verified" || isSubmittingForReview)
      }
      onClick={(event) => {
        if (isActionTransitioningRef.current) {
          event.preventDefault();
          return;
        }

        if (isFinalStep) {
          void submitForReview();
          return;
        }

        onContinue();
      }}
    >
      <span ref={actionContentRef} className="inline-flex items-center gap-2">
        <Typography
          variant={TYPOGRAPHY.M4}
          className="leading-none whitespace-nowrap"
        >
          {displayedActionKind === "continue"
            ? "Continue"
            : isSubmittingForReview
              ? "Processing..."
              : "Submit for review"}
        </Typography>
        <ArrowRightIcon className="size-4 shrink-0" />
      </span>
    </Button>
  );
};
