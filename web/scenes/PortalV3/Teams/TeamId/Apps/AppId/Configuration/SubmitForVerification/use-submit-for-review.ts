"use client";

import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useApolloClient } from "@apollo/client";
import { MutableRefObject, useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { MULTIPLE_ERRORS_TOAST_MESSAGE } from "../AppStore/utils/form-error-utils";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { BasicInformationHandle } from "../BasicInformation";
import { useSaveStatusActions } from "../SaveStatus";

type UseSubmitForReviewArgs = {
  appId: string;
  appMetadata: AppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onSubmitSuccess: () => void;
};

/**
 * Duplicate of the submit pipeline that lives in <AppTopBarSubmit>, wired only
 * into the V3 "Submit for Verification" wizard so the classic configuration
 * flow stays untouched. Performs the same sequence: save BasicInformation in
 * silent/review mode, flush the autosave queue, re-read fresh metadata from the
 * Apollo cache, validate against the review schema, and surface yup errors back
 * onto the shared form. On success it calls `onSubmitSuccess` (the wizard opens
 * <SubmitAppModal>); there is no `?submitForReview=true` URL side-channel here.
 */
export const useSubmitForReview = ({
  appId,
  appMetadata,
  basicInfoRef,
  onSubmitSuccess,
}: UseSubmitForReviewArgs) => {
  const form = useFormContext<AppStoreFormValues>();
  const client = useApolloClient();
  const saveStatus = useSaveStatusActions();
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);

  const submitForReview = useCallback(async () => {
    if (appMetadata?.verification_status !== "unverified") {
      toast.error("Only unverified apps can be submitted for review");
      return;
    }
    setIsSubmittingForReview(true);
    try {
      if (basicInfoRef?.current) {
        const ok = await basicInfoRef.current.submit({
          silent: true,
          forReview: true,
        });
        if (!ok) {
          toast.error(
            "Please fix basic information errors before submitting for review",
          );
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
          toast.error(
            "Some changes could not be saved. Fix any errors and try again.",
          );
          return;
        }
      }
      const formValues = form.getValues();
      const enLocalization = formValues.localisations.find(
        (l) => l.language === "en",
      );
      // Read fresh metadata from the Apollo cache — BasicInformation's save
      // already awaited refetchAppMetadata(), so the cache is up to date.
      const freshData = client.readQuery<FetchAppMetadataQuery>({
        query: FetchAppMetadataDocument,
        variables: { id: appId },
      });
      const freshAppMetadata = freshData?.app?.[0]?.app_metadata?.[0];
      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...formValues,
          name: enLocalization?.name,
          short_name: enLocalization?.short_name,
          world_app_description: enLocalization?.world_app_description,
          description_overview: enLocalization?.description_overview,
          logo_img_url:
            freshAppMetadata?.logo_img_url ?? appMetadata.logo_img_url,
          content_card_image_url:
            freshAppMetadata?.content_card_image_url ??
            appMetadata.content_card_image_url,
          app_website_url: freshAppMetadata?.app_website_url ?? "",
        },
        {
          abortEarly: false,
          strict: true,
          stripUnknown: true,
          context: { isMiniApp },
        },
      );
      onSubmitSuccess();
    } catch (error) {
      let errorMessage = "Error occurred while submitting app for review";
      if (error instanceof yup.ValidationError) {
        error.inner.forEach((yupError) => {
          const path = yupError.path;
          const yupErrorMessage = yupError.message;
          errorMessage = yupErrorMessage;
          if (path) {
            form.setError(path as keyof AppStoreFormValues, {
              message: yupErrorMessage,
            });
          }
        });
        if (error.inner.length > 1) {
          errorMessage = MULTIPLE_ERRORS_TOAST_MESSAGE;
        }
        toast.error(errorMessage);
        return;
      }
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
  ]);

  return { submitForReview, isSubmittingForReview };
};
