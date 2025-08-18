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
import {
  ReviewMessageDialog,
  reviewMessageDialogOpenedAtom,
} from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { ReviewStatus } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewStatus";
import { useRemoveFromReview } from "@/scenes/Portal/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import ErrorComponent from "next/error";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
};

export const AppTopBarRefactored = (props: AppTopBarProps) => {
  const { appId, teamId, app } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const form = useFormContext<AppStoreFormValues>();
  const { data: unverifiedImagesData } = useFetchImagesQuery({
    variables: { id: appId, team_id: teamId },
  });
  const hasAutoSubmitted = useRef(false);

  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);
  const [_showReviewMessage] = useAtom(reviewMessageDialogOpenedAtom);
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

    // only this route has the form context with up to date form data
    if (!pathname.includes("configuration/app-store-refactored")) {
      router.push(
        `/teams/${teamId}/apps/${appId}/configuration/app-store-refactored?submitForReview=true`,
      );
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
      // autosave
      if (form.formState.isDirty) {
        await new Promise<void>((resolve, reject) => {
          form.handleSubmit(
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
                form.getValues("localisations"),
              );
              reject(new Error(errorMessage ?? "Form validation failed"));
            },
          )();
        });
      }
      const formValues = form.getValues();
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
          if (path) {
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
  }, [appMetadata, pathname, router, teamId, appId, form]);

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

  if (!appMetadata) return <ErrorComponent statusCode={404}></ErrorComponent>;
  return (
    <div className="grid gap-y-5 rounded-3xl border p-8 pt-7 sm:rounded-none sm:border-none sm:p-0">
      {["changes_requested", "verified"].includes(
        appMetadata.verification_status,
      ) && (
        <ReviewStatus
          status={
            appMetadata.verification_status as "changes_requested" | "verified"
          }
          message={appMetadata.review_message}
        />
      )}
      <SubmitAppModal
        open={showSubmitAppModal}
        setOpen={setShowSubmitAppModal}
        appMetadataId={appMetadata.id}
        canSubmitAppStore={hasRequiredImagesForAppStore}
        teamId={teamId}
        appId={appId}
        isDeveloperAllowListing={appMetadata?.is_developer_allow_listing}
      />
      <div className="grid items-center justify-items-center gap-y-4 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-8">
        <ReviewMessageDialog appId={appId} />
        <div className="flex w-full justify-end sm:hidden">
          <AppStatus
            className=""
            status={appMetadata.verification_status as StatusVariant}
          />
        </div>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoImgUrl}
            alt="logo"
            className="size-20 rounded-2xl drop-shadow-lg"
          />
          {!pathname.includes("configuration/app-store-refactored") && (
            <Button
              type="button"
              onClick={() => {
                router.push(
                  `/teams/${teamId}/apps/${appId}/configuration/app-store-refactored?editLogo=true`,
                );
              }}
              className={clsx(
                "absolute -bottom-2 -right-2 z-10 rounded-full border-2 border-grey-200 bg-white p-2 text-grey-500 hover:bg-grey-50",
                { hidden: viewMode === "verified" },
              )}
            >
              <EditIcon className="size-3" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-y-1">
          <div className="flex flex-col items-center gap-x-3 sm:flex-row">
            <Typography
              variant={TYPOGRAPHY.H6}
              className=" max-w-[250px] truncate sm:max-w-[500px]"
              data-testid="title-app-name"
            >
              {appMetadata.name}
            </Typography>
            <AppStatus
              className="hidden sm:flex"
              status={appMetadata.verification_status as StatusVariant}
            />
          </div>
          <Environment
            environment={app.is_staging ? "staging" : "production"}
            engine={app.engine}
            className="justify-self-center sm:justify-self-start"
          />
        </div>

        <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-auto/1fr">
          {app.verified_app_metadata.length > 0 &&
            app.app_metadata.length > 0 && <VersionSwitcher app={app} />}
          {isEnoughPermissions &&
            (isEditable ? (
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
                  className={clsx("whitespace-nowrap")}
                >
                  {isSubmittingForReview
                    ? "Processing..."
                    : "Submit for review"}
                </Typography>
              </DecoratedButton>
            ) : app?.app_metadata?.length === 0 ? (
              <DecoratedButton
                type="submit"
                className="h-12 px-6 py-3"
                onClick={createNewDraft}
              >
                <Typography variant={TYPOGRAPHY.M3}>
                  Create new draft
                </Typography>
              </DecoratedButton>
            ) : (
              <DecoratedButton
                type="submit"
                className="h-12 px-6 py-3"
                disabled={removeLoading}
                onClick={removeFromReview}
              >
                <Typography variant={TYPOGRAPHY.M3}>
                  Remove from review
                </Typography>
              </DecoratedButton>
            ))}
        </div>
      </div>
    </div>
  );
};
