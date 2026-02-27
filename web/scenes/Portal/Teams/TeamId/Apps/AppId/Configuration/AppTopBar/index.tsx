"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";

import { Button } from "@/components/Button";
import { Auth0SessionUser } from "@/lib/types";
import { getCDNImageUrl, getDefaultLogoImgCDNUrl } from "@/lib/utils";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { useRemoveFromReview } from "@/scenes/Portal/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import { ErrorPage } from "@/components/ErrorPage";
import { urls } from "@/lib/urls";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { BasicInformationHandle } from "../BasicInformation";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { updateAppStoreMetadata } from "../AppStore/server/update-app-store";
import {
  getFirstFormError,
  MULTIPLE_ERRORS_TOAST_MESSAGE,
} from "../AppStore/utils/form-error-utils";
import { useApolloClient } from "@apollo/client";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../graphql/client/fetch-app-metadata.generated";
import {
  useFetchImagesLazyQuery,
  useFetchImagesQuery,
} from "../graphql/client/fetch-images.generated";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";
import { LogoImageUpload } from "./LogoImageUpload";
import { SubmitAppModal } from "./SubmitAppModal";
import { VersionSwitcher } from "./VersionSwitcher";
import { useCreateEditableRowMutation } from "./graphql/client/create-editable-row.generated";

type AppTopBarSubmitProps = {
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  appId: string;
  teamId: string;
  viewMode: "unverified" | "verified";
  onSubmitSuccess: () => void;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

const AppTopBarSubmit = ({
  appMetadata,
  appId,
  teamId,
  viewMode,
  onSubmitSuccess,
  basicInfoRef,
}: AppTopBarSubmitProps) => {
  const form = useFormContext<AppStoreFormValues>();
  const searchParams = useSearchParams();
  const client = useApolloClient();
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const hasAutoSubmitted = useRef(false);

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
      // Read fresh metadata from the Apollo cache — BasicInformation's save
      // already awaited refetchAppMetadata(), so the cache is up to date.
      const freshData = client.readQuery<FetchAppMetadataQuery>({
        query: FetchAppMetadataDocument,
        variables: { id: appId },
      });
      const freshAppMetadata =
        freshData?.app?.[0]?.app_metadata?.[0] ?? appMetadata;
      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...formValues,
          name: enLocalization?.name,
          short_name: enLocalization?.short_name,
          world_app_description: enLocalization?.world_app_description,
          description_overview: enLocalization?.description_overview,
          logo_img_url: freshAppMetadata.logo_img_url,
          content_card_image_url: freshAppMetadata.content_card_image_url,
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
  }, [appId, appMetadata, basicInfoRef, client, form, onSubmitSuccess]);

  const shouldAutoSubmitForReview =
    searchParams.get("submitForReview") === "true";
  useEffect(() => {
    if (shouldAutoSubmitForReview && !hasAutoSubmitted.current) {
      submitForReview();
      hasAutoSubmitted.current = true;
    }
  }, [shouldAutoSubmitForReview, submitForReview]);

  return (
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
      <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
        {isSubmittingForReview ? "Processing..." : "Submit for review"}
      </Typography>
    </DecoratedButton>
  );
};

type AppTopBarProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  onResolve?: () => void;
  hasFormContext?: boolean;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

export const AppTopBar = (props: AppTopBarProps) => {
  const { appId, teamId, app, onResolve, hasFormContext, basicInfoRef } = props;
  const router = useRouter();
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;

  const { data: unverifiedImagesData } = useFetchImagesQuery({
    variables: { id: appId, team_id: teamId },
  });

  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);
  const handleSubmitSuccess = useCallback(
    () => setShowSubmitAppModal(true),
    [],
  );
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [localUnverifiedLogoOverride, setLocalUnverifiedLogoOverride] =
    useState<string | null>(null);

  useEffect(() => {
    setLocalUnverifiedLogoOverride(null);
  }, [appId]);

  useEffect(() => {
    if (unverifiedImagesData === undefined) return;

    const atomUrl = unverifiedImages?.logo_img_url;
    if (atomUrl === undefined || atomUrl === "loading") return;

    const queryUrl =
      unverifiedImagesData?.unverified_images?.logo_img_url ?? "";
    if (atomUrl !== queryUrl) {
      setLocalUnverifiedLogoOverride(atomUrl);
    } else {
      setLocalUnverifiedLogoOverride(null);
    }
  }, [unverifiedImages?.logo_img_url, unverifiedImagesData]);

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
      const queryUrl =
        unverifiedImagesData?.unverified_images?.logo_img_url ?? "";
      const unverifiedLogoImgUrl = localUnverifiedLogoOverride ?? queryUrl;
      return unverifiedLogoImgUrl || getDefaultLogoImgCDNUrl();
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.logo_img_url,
    appId,
    localUnverifiedLogoOverride,
    unverifiedImagesData?.unverified_images?.logo_img_url,
  ]);

  const hasLogo = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      return Boolean(appMetadata?.logo_img_url);
    }
    const queryUrl =
      unverifiedImagesData?.unverified_images?.logo_img_url ?? "";
    const unverifiedLogoImgUrl = localUnverifiedLogoOverride ?? queryUrl;
    return Boolean(unverifiedLogoImgUrl);
  }, [
    appMetadata?.verification_status,
    appMetadata?.logo_img_url,
    localUnverifiedLogoOverride,
    unverifiedImagesData?.unverified_images?.logo_img_url,
  ]);

  if (!appMetadata) return <ErrorPage statusCode={404} title="App not found" />;

  const isRejected = appMetadata.verification_status === "changes_requested";
  const isInReview = appMetadata.verification_status === "awaiting_review";

  return (
    <div className="grid gap-y-5 rounded-2xl border border-grey-100 p-6 sm:rounded-none sm:border-none sm:p-0">
      <LogoImageUpload
        appId={appId}
        appMetadataId={appMetadata.id}
        teamId={teamId}
        editable={isEditable}
        isError={false}
        logoFile={appMetadata.logo_img_url}
        open={showLogoDialog}
        onClose={() => setShowLogoDialog(false)}
        dialogOnly
      />
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
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Logo + Name + Status + Version */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              if (viewMode !== "verified") {
                setShowLogoDialog(true);
              }
            }}
            className={clsx(
              "group relative size-[125px] shrink-0 rounded-full",
              {
                "cursor-default": viewMode === "verified",
              },
            )}
          >
            {hasLogo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoImgUrl}
                  alt="logo"
                  className="size-full rounded-full object-cover drop-shadow-lg"
                />
                {viewMode !== "verified" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-grey-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6 text-white"
                    >
                      <path
                        fillRule="evenodd"
                        d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.83.83a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Typography variant={TYPOGRAPHY.R5} className="text-white">
                      Update icon
                    </Typography>
                  </div>
                )}
              </>
            ) : viewMode !== "verified" ? (
              <>
                {/* Empty state: dashed circle placeholder */}
                <div className="flex size-full flex-col items-center justify-center gap-1 rounded-full border border-dashed border-grey-200 bg-grey-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6 text-grey-900"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.83.83a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Typography variant={TYPOGRAPHY.R5} className="text-grey-900">
                    App icon <span className="text-system-error-500">*</span>
                  </Typography>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-grey-900/50 opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            ) : null}
          </button>

          {/* Name, Status, Environment, Version */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            {/* Name + Status */}
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <Typography
                variant={TYPOGRAPHY.H6}
                className="max-w-[250px] truncate font-normal sm:max-w-[500px]"
                data-testid="title-app-name"
              >
                {appMetadata.name}
              </Typography>
              <AppStatus
                status={appMetadata.verification_status as StatusVariant}
              />
            </div>
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
                hasFormContext ? (
                  <AppTopBarSubmit
                    appMetadata={appMetadata}
                    appId={appId}
                    teamId={teamId}
                    viewMode={viewMode}
                    onSubmitSuccess={handleSubmitSuccess}
                    basicInfoRef={basicInfoRef}
                  />
                ) : (
                  <DecoratedButton
                    type="button"
                    className={clsx("h-12 px-6 py-3", {
                      hidden:
                        appMetadata.app_id?.includes("staging") &&
                        process.env.NEXT_PUBLIC_APP_ENV === "production",
                    })}
                    onClick={() =>
                      router.push(
                        `${urls.configuration({ team_id: teamId, app_id: appId })}?submitForReview=true`,
                      )
                    }
                  >
                    <Typography
                      variant={TYPOGRAPHY.M3}
                      className="whitespace-nowrap"
                    >
                      Submit for review
                    </Typography>
                  </DecoratedButton>
                )
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
              ) : isInReview ? (
                <DecoratedButton
                  type="button"
                  variant="secondary"
                  className="h-14 px-6"
                  disabled={removeLoading}
                  onClick={removeFromReview}
                >
                  <Typography variant={TYPOGRAPHY.M3}>Un-submit</Typography>
                </DecoratedButton>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
