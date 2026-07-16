"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { MutableRefObject, useMemo, useState } from "react";
import { SubmitAppModal } from "../AppTopBar/SubmitAppModal";
import { BasicInformationHandle } from "../BasicInformation";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";
import { LivePreview } from "./LivePreview";
import { ReviewSubmissionButton } from "./ReviewSubmissionButton";

// The full generated metadata row — review validation reads fields the
// narrowed AppMetadata pick omits.
export type FullAppMetadata =
  FetchAppMetadataQuery["app"][0]["app_metadata"][0];

type SubmitForReviewProps = {
  appId: string;
  teamId: string;
  appMetadata: FullAppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onValidationError?: (fieldPath?: string) => void;
  className: string;
};

// Always-active submit button: clicking with missing required fields surfaces
// the validation errors (field errors + toast) from the review-schema check
// rather than being locked behind a completion gate.
export const SubmitForReview = ({
  appId,
  teamId,
  appMetadata,
  basicInfoRef,
  onValidationError,
  className,
}: SubmitForReviewProps) => {
  const viewMode = useAtomValue(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isEditable = appMetadata.verification_status === "unverified";

  // Freshly uploaded showcase images land in the atom before the metadata
  // refetch — read it first so the modal gating never lags an upload.
  const unverifiedImages = useAtomValue(unverifiedImageAtom);
  const showcaseImages =
    unverifiedImages.showcase_image_urls ?? appMetadata?.showcase_img_urls;
  const hasRequiredImagesForAppStore = (showcaseImages?.length ?? 0) >= 1;

  if (!isEditable || !isEnoughPermissions) return null;

  return (
    <>
      <SubmitAppModal
        open={showSubmitAppModal}
        setOpen={setShowSubmitAppModal}
        appMetadataId={appMetadata.id}
        canSubmitAppStore={hasRequiredImagesForAppStore}
        teamId={teamId}
        appId={appId}
        isDeveloperAllowListing={appMetadata?.is_developer_allow_listing}
      />
      <ReviewSubmissionButton
        appMetadata={appMetadata}
        appId={appId}
        teamId={teamId}
        viewMode={viewMode}
        onSubmitSuccess={() => setShowSubmitAppModal(true)}
        basicInfoRef={basicInfoRef}
        onValidationError={onValidationError}
        className={clsx("shrink-0", className)}
      />
    </>
  );
};

type ReviewRailProps = {
  appId: string;
  teamName: string;
  appMetadata: FullAppMetadata;
};

/** Live listing preview, intentionally isolated from page-level actions. */
export const ReviewRail = ({
  appId,
  teamName,
  appMetadata,
}: ReviewRailProps) => {
  return (
    <aside
      aria-label="Live preview"
      className="order-first h-full lg:order-0 lg:border-l lg:border-grey-200 lg:pl-10"
    >
      <div className="flex flex-col gap-y-5 py-8 lg:h-full">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <LivePreview
            appId={appId}
            teamName={teamName}
            appMetadata={appMetadata}
          />
        </div>
      </div>
    </aside>
  );
};
