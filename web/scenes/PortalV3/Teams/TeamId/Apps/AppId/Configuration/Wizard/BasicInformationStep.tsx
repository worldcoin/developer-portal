"use client";

import { inferHttps } from "@/lib/schema";
import { getCDNImageUrl } from "@/lib/utils";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useAtomValue } from "jotai";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { ImageCropDialog } from "../AppStore/ImageForm/ImageCropDialog";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { useLogoUpload } from "../AppTopBar/LogoImageUpload";
import {
  BasicInformationHandle,
  useBasicInformationForm,
} from "../BasicInformation";
import { unverifiedImageAtom } from "../layout/ImagesProvider";
import { useAppModeToggle } from "../MiniAppConfiguration";
import { AppModeCards } from "./AppModeCards";
import { LogoDropZone } from "./LogoDropZone";
import { TextField } from "./TextField";

const CopyAppIdButton = (props: { appId: string }) => (
  <button
    type="button"
    aria-label="Copy app ID"
    className="shrink-0"
    onClick={() => {
      navigator.clipboard.writeText(props.appId);
      toast.success("App ID copied to clipboard");
    }}
  >
    <CopyIcon className="size-5" />
  </button>
);

/**
 * Resolves the logo shown in the wizard the way AppIconBox does: while the
 * row is unverified, the unverified-image atom wins (it updates live after an
 * upload); otherwise fall back to the CDN URL from metadata.
 */
export const useResolvedLogoUrl = (appId: string, appMetadata: AppMetadata) => {
  const unverifiedImages = useAtomValue(unverifiedImageAtom);
  const isVerified = appMetadata.verification_status === "verified";
  const atomLogoImgUrl =
    unverifiedImages.logo_img_url && unverifiedImages.logo_img_url !== "loading"
      ? unverifiedImages.logo_img_url
      : "";
  const metadataLogoImgUrl = appMetadata.logo_img_url
    ? appMetadata.logo_img_url.startsWith("http")
      ? appMetadata.logo_img_url
      : getCDNImageUrl(appId, appMetadata.logo_img_url, isVerified)
    : "";
  return isVerified ? metadataLogoImgUrl : atomLogoImgUrl || metadataLogoImgUrl;
};

/**
 * The wizard's circular logo drop target, wired to the shared logo pipeline
 * (presigned upload → unverified-image atom → UpdateLogo mutation, square
 * crop gate). Displays like AppIconBox: the atom wins while unverified so the
 * image updates live after upload; verified metadata is read-only.
 */
export const WizardLogoUpload = (props: {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  canEdit: boolean;
}) => {
  const { appId, teamId, appMetadata, canEdit } = props;
  const {
    clearErrors,
    formState: { errors },
  } = useFormContext<AppStoreFormValues>();

  const {
    isUploading,
    uploadLogo,
    cropCandidate,
    clearCropCandidate,
    handleFileSelected,
  } = useLogoUpload({ appId, appMetadataId: appMetadata.id, teamId });

  const logoImgUrl = useResolvedLogoUrl(appId, appMetadata);

  const logoError = (errors as Record<string, { message?: string }>)
    .logo_img_url?.message;

  useEffect(() => {
    if (logoImgUrl) {
      clearErrors("logo_img_url" as keyof AppStoreFormValues);
    }
  }, [clearErrors, logoImgUrl]);

  return (
    <>
      <LogoDropZone
        imageUrl={logoImgUrl || undefined}
        onFileSelected={(file) => void handleFileSelected(file)}
        disabled={!canEdit}
        isUploading={isUploading}
        error={!logoImgUrl ? logoError : undefined}
      />
      <ImageCropDialog
        file={cropCandidate}
        title="Crop app image"
        targetWidth={512}
        targetHeight={512}
        isApplying={isUploading}
        onApply={uploadLogo}
        onClosed={clearCropCandidate}
        previewAlt="Logo crop preview"
      />
    </>
  );
};

/**
 * Skeleton twin of BasicInformationStep below — same containers and labels,
 * shimmer in every value slot (via the fields' `loading` mode). Keep the two
 * in sync when fields change.
 */
export const BasicInformationStepSkeleton = () => (
  <div className="flex w-full flex-col gap-14">
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-start gap-4">
        <TextField label="App name" required value="" loading />
        <TextField label="Publisher" readOnly value="" loading />
      </div>
      <TextField label="App URL" required value="" loading />
      <TextField label="App Official Website" required value="" loading />
      <TextField
        label="App ID"
        readOnly
        muted
        value=""
        loading
        trailing={<CopyIcon aria-hidden className="size-5 shrink-0" />}
      />
    </div>

    <div className="flex w-full flex-col gap-5">
      <h2 className="text-15 leading-[1.2] font-medium text-portal-ink">
        Advanced settings
      </h2>
      <AppModeCards loading />
    </div>
  </div>
);

/**
 * Step 1 of the configuration wizard: identity fields plus the Mini App /
 * External mode choice. Persists through the same paths as the previous
 * page: the basic-information autosave form (name/URLs) and the app-mode
 * server action with optimistic atom flip.
 */
export const BasicInformationStep = forwardRef<
  BasicInformationHandle,
  {
    appId: string;
    teamId: string;
    app: FetchAppMetadataQuery["app"][0];
    appMetadata: AppMetadata;
    publisher: string;
  }
>(({ appId, teamId, app, appMetadata, publisher }, ref) => {
  const { form, errors, isEditable, isEnoughPermissions, submit } =
    useBasicInformationForm({ appId, teamId, app });
  const { control, setValue } = form;

  useImperativeHandle(ref, () => ({ submit }), [submit]);

  const {
    isMiniApp,
    isDisabled: isModeDisabled,
    handleAppModeToggle,
  } = useAppModeToggle({ teamId, appMetadata });

  const disabled = !isEditable || !isEnoughPermissions;

  const makeUrlBlur =
    (fieldName: "integration_url" | "app_website_url", value: string) => () => {
      const inferred = inferHttps(value);
      if (inferred !== value) {
        setValue(fieldName, inferred, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    };

  return (
    <div className="flex w-full flex-col gap-14">
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full items-start gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                label="App name"
                name="name"
                required
                maxLength={50}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                error={errors.name?.message}
              />
            )}
          />
          {/* Publisher mirrors the team name; the design shows it as a plain
              field, so it stays read-only until it has a real backing field. */}
          <TextField label="Publisher" value={publisher} readOnly />
        </div>

        <Controller
          control={control}
          name="integration_url"
          render={({ field }) => (
            <TextField
              label="App URL"
              name="integration_url"
              type="url"
              required
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={() => {
                field.onBlur();
                makeUrlBlur("integration_url", field.value ?? "")();
              }}
              disabled={disabled}
              error={errors.integration_url?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="app_website_url"
          render={({ field }) => (
            <TextField
              label="App Official Website"
              name="app_website_url"
              type="url"
              required
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={() => {
                field.onBlur();
                makeUrlBlur("app_website_url", field.value ?? "")();
              }}
              disabled={disabled}
              error={errors.app_website_url?.message}
            />
          )}
        />

        <TextField
          label="App ID"
          value={appId}
          readOnly
          muted
          trailing={<CopyAppIdButton appId={appId} />}
        />
      </div>

      <div className="flex w-full flex-col gap-5">
        <h2 className="text-15 leading-[1.2] font-medium text-portal-ink">
          App type
        </h2>
        <AppModeCards
          value={isMiniApp ? "mini-app" : "external"}
          disabled={isModeDisabled}
          onChange={(appMode) => {
            const wantsMiniApp = appMode === "mini-app";
            if (wantsMiniApp !== isMiniApp) {
              void handleAppModeToggle(wantsMiniApp);
            }
          }}
        />
      </div>
    </div>
  );
});

BasicInformationStep.displayName = "BasicInformationStep";
