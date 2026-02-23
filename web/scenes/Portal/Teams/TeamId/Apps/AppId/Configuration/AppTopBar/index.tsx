"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Environment } from "@/components/Environment";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";

import { Button } from "@/components/Button";
import { EditIcon } from "@/components/Icons/EditIcon";
import { Auth0SessionUser } from "@/lib/types";
import { getCDNImageUrl, getDefaultLogoImgCDNUrl } from "@/lib/utils";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { useRemoveFromReview } from "@/scenes/Portal/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import { ErrorPage } from "@/components/ErrorPage";
import { urls } from "@/lib/urls";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { updateAppStoreMetadata } from "../AppStore/server/update-app-store";
import {
  getFirstFormError,
  MULTIPLE_ERRORS_TOAST_MESSAGE,
} from "../AppStore/utils/form-error-utils";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../graphql/client/fetch-app-metadata.generated";
import {
  useFetchImagesLazyQuery,
  useFetchImagesQuery,
} from "../graphql/client/fetch-images.generated";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";
import { SubmitAppModal } from "./SubmitAppModal";
import { VersionSwitcher } from "./VersionSwitcher";
import { useCreateEditableRowMutation } from "./graphql/client/create-editable-row.generated";

type AppTopBarProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  onResolve?: () => void;
};

export const AppTopBar = (props: AppTopBarProps) => {
  const { appId, teamId, app, onResolve } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;

  // Form context is optional - only available on pages with FormProvider
  let form: ReturnType<typeof useFormContext<AppStoreFormValues>> | null = null;
  try {
    form = useFormContext<AppStoreFormValues>();
  } catch (e) {
    // No form context available - that's okay for pages like Danger zone
  }

  const { data: unverifiedImagesData } = useFetchImagesQuery({
    variables: { id: appId, team_id: teamId },
  });
  const hasAutoSubmitted = useRef(false);

  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);
  const setUnverifiedImages = useSetAtom(unverifiedImageAtom);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const appMetadata = useMemo(() => {
    if (viewMode === "verified") {
      return app.verified_app_metadata[0] ?? [];
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app.app_metadata?.[0] ?? app.verified_app_metadata[0] ?? [];
    }
  }, [viewMode, app.app_metadata, app.verified_app_metadata]);

  const { removeFromReview, loading: removeLoading } = useRemoveFromReview({
    metadataId: appMetadata?.id,
  });

  useEffect(() => {
    if (app?.app_metadata.length === 0) {
      setViewMode("verified");
    } else if (
      app.verified_app_metadata.length === 0 &&
      viewMode === "verified"
    ) {
      setViewMode("unverified");
    }
  }, [
    app.app_metadata.length,
    app.verified_app_metadata.length,
    setViewMode,
    viewMode,
  ]);

  const isEditable = app?.app_metadata[0]?.verification_status === "unverified";
  const [createEditableRowMutation] = useCreateEditableRowMutation({});

  const hasRequiredImagesForAppStore = useMemo(() => {
    return Boolean(
      appMetadata?.showcase_img_urls &&
        appMetadata?.showcase_img_urls?.length > 0,
    );
  }, [appMetadata?.showcase_img_urls]);

  const submitForReview = useCallback(async () => {
    if (appMetadata?.verification_status !== "unverified") {
      toast.error("Only unverified apps can be submitted for review");
      return;
    }

    // Check if form context is available
    if (!form) {
      toast.error(
        "Unable to submit for review. Please refresh the page and try again.",
      );
      console.error("Form context not available");
      return;
    }

    setIsSubmittingForReview(true);
    try {
      // Form is guaranteed to exist at this point due to check above
      const formContext = form!;

      // autosave
      if (formContext.formState.isDirty) {
        await new Promise<void>((resolve, reject) => {
          formContext.handleSubmit(
            async (data) => {
              const result = await updateAppStoreMetadata({
                ...data,
                app_metadata_id: appMetadata.id,
              });

              if (!result.success) {
                reject(new Error(result.message));
              } else {
                toast.success("App information saved");
                resolve();
              }
            },
            (errors) => {
              const errorMessage = getFirstFormError(
                errors,
                formContext.getValues("localisations"),
              );
              reject(new Error(errorMessage ?? "Form validation failed"));
            },
          )();
        });
      }
      const formValues = formContext.getValues();
      const enLocalization = formValues.localisations.find(
        (l) => l.language === "en",
      );

      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...formValues,
          name: enLocalization?.name,
          short_name: enLocalization?.short_name,
          world_app_description: enLocalization?.world_app_description,
          description_overview: enLocalization?.description_overview,
          logo_img_url: appMetadata.logo_img_url,
          content_card_image_url: appMetadata.content_card_image_url,
        },
        {
          abortEarly: false,
          strict: true,
          stripUnknown: true,
        },
      );

      // if all validation passed, show submission modal
      setShowSubmitAppModal(true);
    } catch (error) {
      let errorMessage = "Error occurred while submitting app for review";

      if (error instanceof yup.ValidationError) {
        error.inner.forEach((yupError) => {
          const path = yupError.path;
          const yupErrorMessage = yupError.message;

          errorMessage = yupErrorMessage;

          // still set form errors for field highlighting
          if (path && form) {
            form.setError(path as keyof AppStoreFormValues, {
              message: yupErrorMessage,
            });
          }
        });

        // check for multiple errors after setting them on form
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
  }, [appMetadata, router, teamId, appId, form]);

  const shouldAutoSubmitForReview =
    searchParams.get("submitForReview") === "true";
  useEffect(() => {
    if (shouldAutoSubmitForReview && !hasAutoSubmitted.current) {
      submitForReview();
      hasAutoSubmitted.current = true;
    }
  }, [shouldAutoSubmitForReview, submitForReview]);

  const [fetchImagesQuery] = useFetchImagesLazyQuery();

  const createNewDraft = useCallback(async () => {
    try {
      if (!app || app?.app_metadata?.length > 0) {
        throw new Error("Your app must be already verified for this action");
      }

      await createEditableRowMutation({
        variables: {
          app_id: appId,
          team_id: teamId,
        },
        refetchQueries: [FetchAppMetadataDocument],
        awaitRefetchQueries: true,
      });

      await fetchImagesQuery({
        variables: {
          id: appId,
          team_id: teamId,
        },

        onCompleted: (data) => {
          setUnverifiedImages({
            logo_img_url: data?.unverified_images?.logo_img_url ?? "",
            showcase_image_urls: data?.unverified_images?.showcase_img_urls,
          });
        },
      });

      setViewMode("unverified");
      toast.success("New app draft created");
    } catch (error: any) {
      console.error("Failed to create a new draft: ", error.message);
      toast.error("Error creating a new draft");
    }
  }, [
    app,
    createEditableRowMutation,
    appId,
    fetchImagesQuery,
    teamId,
    setViewMode,
    setUnverifiedImages,
  ]);

  const logoImgUrl = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      return getCDNImageUrl(appId, appMetadata?.logo_img_url, true);
    } else {
      return (
        unverifiedImagesData?.unverified_images?.logo_img_url ||
        getDefaultLogoImgCDNUrl()
      );
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.logo_img_url,
    appId,
    unverifiedImagesData?.unverified_images?.logo_img_url,
  ]);

  if (!appMetadata) return <ErrorPage statusCode={404} title="App not found" />;

  const isRejected = appMetadata.verification_status === "changes_requested";
  const isInReview = appMetadata.verification_status === "pending";

  return (
    <div className="grid gap-y-5 rounded-2xl border border-grey-100 p-6 sm:rounded-none sm:border-none sm:p-0">
      <SubmitAppModal
        open={showSubmitAppModal}
        setOpen={setShowSubmitAppModal}
        appMetadataId={appMetadata.id}
        canSubmitAppStore={hasRequiredImagesForAppStore}
        teamId={teamId}
        appId={appId}
        isDeveloperAllowListing={appMetadata?.is_developer_allow_listing}
      />
      <ReviewMessageDialog appId={appId} />

      {/* New layout: Logo + Name/Status/Version on left, Actions on right */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side: Logo + Name + Status + Version */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Logo */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoImgUrl}
              alt="logo"
              className="size-20 rounded-2xl drop-shadow-lg"
            />
            <Button
              type="button"
              onClick={() => {
                router.replace(
                  `${urls.configuration({ team_id: teamId, app_id: appId })}?editLogo=true`,
                );
              }}
              className={clsx(
                "absolute -bottom-2 -right-2 z-10 rounded-full border-2 border-grey-200 bg-white p-2 text-grey-500 hover:bg-grey-50",
                { hidden: viewMode === "verified" },
              )}
            >
              <EditIcon className="size-3" />
            </Button>
          </div>

          {/* Name, Status, Environment, Version */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            {/* Name + Status */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Typography
                variant={TYPOGRAPHY.H6}
                className="max-w-[250px] truncate sm:max-w-[500px]"
                data-testid="title-app-name"
              >
                {appMetadata.name}
              </Typography>
              <AppStatus
                status={appMetadata.verification_status as StatusVariant}
              />
            </div>

            {/* Environment */}
            <Environment
              environment={app.is_staging ? "staging" : "production"}
              engine={app.engine}
              className="justify-self-center sm:justify-self-start"
            />
          </div>
        </div>

        {/* Right side: Version Switcher + Action Buttons */}
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          {/* Version Switcher */}
          {app.verified_app_metadata.length > 0 &&
            app.app_metadata.length > 0 && <VersionSwitcher app={app} />}

          {/* Action Buttons */}
          {isEnoughPermissions && (
            <div className="flex gap-3">
              {/* Resolve button for rejected apps */}
              {isRejected && onResolve && (
                <DecoratedButton
                  type="button"
                  className="h-12 px-6 py-3"
                  onClick={onResolve}
                >
                  <Typography variant={TYPOGRAPHY.M3}>Resolve</Typography>
                </DecoratedButton>
              )}

              {/* Submit / Un-submit / Create Draft button */}
              {isEditable ? (
                <DecoratedButton
                  type="submit"
                  className={clsx("h-12 px-6 py-3", {
                    hidden:
                      appMetadata.app_id?.includes("staging") &&
                      process.env.NEXT_PUBLIC_APP_ENV === "production",
                  })}
                  disabled={viewMode === "verified" || isSubmittingForReview}
                  onClick={submitForReview}
                >
                  <Typography
                    variant={TYPOGRAPHY.M3}
                    className="whitespace-nowrap"
                  >
                    {isSubmittingForReview
                      ? "Processing..."
                      : "Submit for review"}
                  </Typography>
                </DecoratedButton>
              ) : app?.app_metadata?.length === 0 ? (
                <DecoratedButton
                  type="button"
                  className="h-12 px-6 py-3"
                  onClick={createNewDraft}
                >
                  <Typography variant={TYPOGRAPHY.M3}>
                    Create new draft
                  </Typography>
                </DecoratedButton>
              ) : (
                <DecoratedButton
                  type="button"
                  className="h-12 px-6 py-3"
                  disabled={removeLoading}
                  onClick={removeFromReview}
                >
                  <Typography variant={TYPOGRAPHY.M3}>Un-submit</Typography>
                </DecoratedButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
