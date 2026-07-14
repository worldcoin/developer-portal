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
import { useSaveStatus } from "../SaveStatus";
import { LivePreview } from "./LivePreview";
import { ReviewSubmissionButton } from "./ReviewSubmissionButton";

// The full generated metadata row — review validation reads fields the
// narrowed AppMetadata pick omits.
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

type SubmitForReviewProps = {
  appId: string;
  teamId: string;
  appMetadata: FullAppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

// Always-active submit button: clicking with missing required fields surfaces
// the validation errors (field errors + toast) from the review-schema check
// rather than being locked behind a completion gate.
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
      <ReviewSubmissionButton
        appMetadata={appMetadata}
        appId={appId}
        teamId={teamId}
        viewMode={viewMode}
        onSubmitSuccess={() => setShowSubmitAppModal(true)}
        basicInfoRef={basicInfoRef}
        className="shrink-0"
      />
    </>
  );
};

type ConfigurationActionsProps = {
  appId: string;
  teamId: string;
  appMetadata: FullAppMetadata;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
};

/**
 * Persistent action shelf owned by the form column. On desktop it sits below
 * the independently scrolling form; on smaller screens it becomes a compact
 * floating dock so save state and review submission never disappear.
 */
export const ConfigurationActions = ({
  appId,
  teamId,
  appMetadata,
  basicInfoRef,
}: ConfigurationActionsProps) => {
  const isEditable = appMetadata.verification_status === "unverified";

  // Read-only states carry their status in the page's version header — a bar
  // holding only a status line would duplicate it.
  if (!isEditable) return null;

  return (
    <section
      aria-label="Configuration actions"
      className="fixed inset-x-4 bottom-4 z-30 rounded-2xl border border-grey-200 bg-grey-0/95 p-3 shadow-xl backdrop-blur-md lg:static lg:z-auto lg:mr-4 lg:mb-8 lg:shrink-0 lg:p-4 lg:shadow-lg"
    >
      <div className="flex items-center justify-between gap-x-4">
        <div className="min-w-0">
          <DraftSavedLine />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SubmitForReview
            appId={appId}
            teamId={teamId}
            appMetadata={appMetadata}
            basicInfoRef={basicInfoRef}
          />
        </div>
      </div>
    </section>
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
