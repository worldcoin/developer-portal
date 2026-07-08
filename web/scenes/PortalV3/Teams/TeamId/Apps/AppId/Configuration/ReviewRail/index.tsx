"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { MutableRefObject, useMemo, useState } from "react";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { AppTopBarSubmit } from "../AppTopBar";
import { SubmitAppModal } from "../AppTopBar/SubmitAppModal";
import { selectedLanguageAtom } from "../AppStore/components/FormSections/LocalisationsSection/hooks/useLanguageSelection";
import { BasicInformationHandle } from "../BasicInformation";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";
import { useSaveStatus } from "../SaveStatus";
import { LivePreview } from "./LivePreview";

// The full generated metadata row — AppTopBarSubmit's review validation reads
// fields the narrowed AppMetadata pick omits.
export type FullAppMetadata =
  FetchAppMetadataQuery["app"][0]["app_metadata"][0];

const DraftSavedLine = () => {
  const { displayStatus } = useSaveStatus();

  if (displayStatus.state === "error") {
    return (
      <div className="flex items-center gap-x-2">
        <span
          className="size-2 shrink-0 rounded-full bg-system-error-500"
          aria-hidden
        />
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Couldn&apos;t save
        </Typography>
        <button
          type="button"
          onClick={displayStatus.retry}
          className="text-grey-700 underline underline-offset-2"
        >
          <Typography variant={TYPOGRAPHY.R4}>Retry</Typography>
        </button>
      </div>
    );
  }

  const isSaving = displayStatus.state === "saving";

  return (
    <div className="flex items-center gap-x-2">
      <span
        className={clsx(
          "size-2 shrink-0 rounded-full",
          isSaving ? "animate-pulse bg-grey-300" : "bg-system-success-500",
        )}
        aria-hidden
      />
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        {isSaving
          ? "Saving draft…"
          : displayStatus.state === "saved"
            ? "Draft saved · just now"
            : "Draft saved"}
      </Typography>
    </div>
  );
};

const MetadataStatusLine = ({ status }: { status: StatusVariant }) => (
  <div className="flex items-center gap-x-2">
    <AppStatus status={status} />
    <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
      Read-only
    </Typography>
  </div>
);

type SubmitForReviewProps = {
  appId: string;
  teamId: string;
  appMetadata: FullAppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

// Always-active submit button: clicking with missing required fields surfaces
// the validation errors (field errors + toast) from AppTopBarSubmit's
// review-schema check rather than being locked behind a completion gate.
const SubmitForReview = ({
  appId,
  teamId,
  appMetadata,
  basicInfoRef,
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
      <AppTopBarSubmit
        appMetadata={appMetadata}
        appId={appId}
        teamId={teamId}
        viewMode={viewMode}
        onSubmitSuccess={() => setShowSubmitAppModal(true)}
        basicInfoRef={basicInfoRef}
        className="w-full"
      />
    </>
  );
};

type ReviewRailProps = {
  appId: string;
  teamId: string;
  teamName: string;
  appMetadata: FullAppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

/**
 * Sticky right rail for the Configuration page: live listing preview, submit
 * for review, and autosave status. Follows the viewport as the (much taller)
 * form column scrolls.
 */
export const ReviewRail = ({
  appId,
  teamId,
  teamName,
  appMetadata,
  basicInfoRef,
}: ReviewRailProps) => {
  const previewLanguage = useAtomValue(selectedLanguageAtom);
  const isEditable = appMetadata.verification_status === "unverified";

  return (
    // The page frame is viewport-height with the form column scrolling
    // internally, so the pane is simply static: it never moves and is never
    // cut off — the Submit button and save status always sit within view.
    // Below lg the grid is one column and the rail renders first, so the
    // submit button never sits below the danger zone on small screens.
    <aside className="order-first h-full lg:order-none lg:border-l lg:border-grey-200 lg:pl-10">
      <div className="flex flex-col gap-y-4 py-8 lg:h-full">
        <Typography
          variant={TYPOGRAPHY.R5}
          className="uppercase tracking-[0.2em] text-grey-400"
        >
          Live preview
          {previewLanguage !== "en" && ` · ${previewLanguage.toUpperCase()}`}
        </Typography>

        <div className="min-h-0 flex-1 overflow-hidden">
          <LivePreview
            appId={appId}
            teamName={teamName}
            appMetadata={appMetadata}
          />
        </div>

        <SubmitForReview
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata}
          basicInfoRef={basicInfoRef}
        />

        {isEditable ? (
          <DraftSavedLine />
        ) : (
          <MetadataStatusLine
            status={appMetadata.verification_status as StatusVariant}
          />
        )}
      </div>
    </aside>
  );
};
