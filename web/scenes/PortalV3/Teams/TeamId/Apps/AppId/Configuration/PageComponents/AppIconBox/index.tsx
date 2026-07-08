"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, getCDNImageUrl } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { LogoImageUpload } from "../../AppTopBar/LogoImageUpload";
import { AppStoreFormValues } from "../../AppStore/FormSchema/types";
import { unverifiedImageAtom } from "../../layout/ImagesProvider";

type AppIconBoxProps = {
  appId: string;
  teamId: string;
  appMetadataId: string;
  logoFile?: string;
  isEditable: boolean;
  verificationStatus: string;
};

/**
 * Standalone app-icon upload box: shows the current icon (from the unverified
 * images atom, so it updates live after upload) and opens the existing logo
 * upload dialog.
 */
export const AppIconBox = ({
  appId,
  teamId,
  appMetadataId,
  logoFile,
  isEditable,
  verificationStatus,
}: AppIconBoxProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const unverifiedImages = useAtomValue(unverifiedImageAtom);
  const {
    clearErrors,
    formState: { errors },
  } = useFormContext<AppStoreFormValues>();
  const [showLogoDialog, setShowLogoDialog] = useState(false);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const canEdit = isEditable && isEnoughPermissions;
  const isVerified = verificationStatus === "verified";
  const atomLogoImgUrl =
    unverifiedImages.logo_img_url && unverifiedImages.logo_img_url !== "loading"
      ? unverifiedImages.logo_img_url
      : "";
  const metadataLogoImgUrl = logoFile
    ? logoFile.startsWith("http")
      ? logoFile
      : getCDNImageUrl(appId, logoFile, isVerified)
    : "";
  const logoImgUrl = isVerified
    ? metadataLogoImgUrl
    : atomLogoImgUrl || metadataLogoImgUrl;
  const logoError = (errors as Record<string, { message?: string }>)
    .logo_img_url?.message;
  const hasLogoError = Boolean(logoError) && !logoImgUrl;

  useEffect(() => {
    if (logoImgUrl) {
      clearErrors("logo_img_url" as keyof AppStoreFormValues);
    }
  }, [clearErrors, logoImgUrl]);

  return (
    <section className="flex items-center justify-center rounded-2xl border border-grey-200 bg-grey-25 p-6 shadow-button">
      <LogoImageUpload
        appId={appId}
        appMetadataId={appMetadataId}
        teamId={teamId}
        editable={isEditable}
        isError={false}
        logoFile={logoFile}
        open={showLogoDialog}
        onClose={() => setShowLogoDialog(false)}
        dialogOnly
      />

      <button
        type="button"
        onClick={() => {
          if (canEdit) setShowLogoDialog(true);
        }}
        aria-invalid={hasLogoError || undefined}
        className={
          "size-[125px] shrink-0 rounded-full" +
          (canEdit ? "" : " cursor-default")
        }
      >
        {logoImgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoImgUrl}
            alt="App icon"
            className="size-full rounded-full object-cover drop-shadow-lg"
          />
        ) : (
          <div
            className={clsx(
              "flex size-full flex-col items-center justify-center gap-1 rounded-full border border-dashed",
              hasLogoError
                ? "border-system-error-500 bg-system-error-50 px-3"
                : "border-grey-200 bg-grey-50",
            )}
          >
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
            {hasLogoError && (
              <Typography
                variant={TYPOGRAPHY.R5}
                className="text-center text-system-error-500"
              >
                {logoError}
              </Typography>
            )}
          </div>
        )}
      </button>
    </section>
  );
};
