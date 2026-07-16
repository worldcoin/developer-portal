"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useParams } from "next/navigation";
import { MiniAppConfiguration } from "./MiniAppConfiguration";
import { FormSkeleton } from "./PageComponents/FormSkeleton";
import { AppStoreForm } from "./AppStore/app-store";
import { AppStoreFormProvider } from "./AppStore/app-store-form-provider";
import {
  AppMetadata,
  LocalisationData,
} from "./AppStore/types/AppStoreFormTypes";
import { BasicInformation, BasicInformationHandle } from "./BasicInformation";
import { useQuery } from "@apollo/client/react";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "./layout/ImagesProvider";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { AppIconBox } from "./PageComponents/AppIconBox";
import { NumberedSection } from "./PageComponents/NumberedSection";
import { SectionToc } from "./PageComponents/SectionToc";
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";
import { ConfigurationActions, ReviewRail } from "./ReviewRail";
import { SaveStatusProvider } from "./SaveStatus";
import { useCreateNewDraft } from "./hook/use-create-new-draft";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
};

type ConfigurationContentProps = {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  teamName: string;
};

/**
 * Version header above the form: names which metadata row is on screen and
 * carries that row's one action — switch to the draft (created on first use;
 * one draft max, useCreateNewDraft enforces it), switch back to the verified
 * copy, or un-submit while the draft awaits review. The page's bottom bar
 * shows no status: this header is the single source of state.
 */
const VersionBanner = ({
  app,
  appId,
  teamId,
}: {
  app: FetchAppMetadataQuery["app"][0];
  appId: `app_${string}`;
  teamId: `team_${string}`;
}) => {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const hasDraft = app.app_metadata.length > 0;
  const hasVerified = app.verified_app_metadata.length > 0;
  const draft = app.app_metadata[0];

  const { createNewDraft, isCreating } = useCreateNewDraft({
    appId,
    teamId,
    hasDraft,
    hasVerifiedVersion: hasVerified,
  });

  const { removeFromReview, loading: isUnsubmitting } = useRemoveFromReview({
    metadataId: draft?.id,
  });

  // Creating a draft and un-submitting both mutate review state — same
  // Owner/Admin bar the old AppTopBar actions had. Viewing an existing draft
  // is unrestricted (fields stay read-only via their own gates).
  const canManageDraft = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  if (viewMode === "verified" && hasVerified) {
    return (
      <div className="flex flex-col gap-4 border-b border-grey-100 pt-8 pb-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Icon name="check-circle" className="size-5 shrink-0" />
          <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
            Verified version
          </Typography>
          <span aria-hidden className="text-grey-300">
            ·
          </span>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="truncate text-grey-500"
          >
            This is the version currently approved for users.
          </Typography>
        </div>

        {hasDraft || canManageDraft ? (
          <DecoratedButton
            type="button"
            variant="secondary"
            className="h-10 shrink-0 px-4 py-2"
            loading={isCreating}
            onClick={() => {
              if (hasDraft) {
                setViewMode("unverified");
              } else {
                // Flips the view itself after the row lands.
                void createNewDraft();
              }
            }}
          >
            <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
              Open draft
            </Typography>
          </DecoratedButton>
        ) : null}
      </div>
    );
  }

  // Viewing the draft while it awaits review: locked fields, un-submit is
  // the only unlock path. Rejections keep their own RejectionBanner.
  if (draft?.verification_status === "awaiting_review") {
    return (
      <div className="flex flex-col gap-4 border-b border-grey-100 pt-8 pb-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-additional-blue-100">
            <Icon name="clock" className="size-4" />
          </span>
          <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
            Awaiting review
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="truncate text-grey-500"
          >
            In review — editing is locked until review completes.
          </Typography>
        </div>

        {canManageDraft ? (
          <DecoratedButton
            type="button"
            variant="secondary"
            className="h-10 shrink-0 px-4 py-2"
            loading={isUnsubmitting}
            onClick={removeFromReview}
          >
            <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
              Un-submit
            </Typography>
          </DecoratedButton>
        ) : null}
      </div>
    );
  }

  // Editable draft with a verified counterpart to switch back to.
  if (!hasVerified || draft?.verification_status !== "unverified") return null;

  return (
    <div className="flex flex-col gap-4 border-b border-grey-100 pt-8 pb-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Icon name="edit-pencil" className="size-4" />
        </span>
        <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
          Draft
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="truncate text-grey-500">
          Saved automatically. Changes remain here until approved.
        </Typography>
      </div>

      <DecoratedButton
        type="button"
        variant="secondary"
        className="h-10 shrink-0 px-4 py-2"
        onClick={() => setViewMode("verified")}
      >
        <div className="flex items-center gap-x-2">
          <Icon name="eye" className="size-4 shrink-0" />
          <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
            View verified version
          </Typography>
        </div>
      </DecoratedButton>
    </div>
  );
};

// Rendered inside AppStoreFormProvider so the review-readiness rail can watch
// the shared form context.
const ConfigurationContent = ({
  appId,
  teamId,
  app,
  appMetadata,
  teamName,
}: ConfigurationContentProps) => {
  const basicInfoRef = useRef<BasicInformationHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[11rem_minmax(0,1fr)_minmax(380px,30%)] lg:grid-rows-[minmax(0,1fr)]">
      {/* Section jump nav on desktop; on smaller screens it collapses to the
          separated Danger zone destination above the form. */}
      <div className="pt-2 lg:pt-8">
        <SectionToc
          appId={appId}
          teamId={teamId}
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      {/* The form and its action shelf share one column. Only the form body
          scrolls on desktop, keeping the shelf visibly beneath it. */}
      <div className="flex min-h-0 min-w-0 flex-col">
        <VersionBanner app={app} appId={appId} teamId={teamId} />
        <div
          ref={scrollContainerRef}
          className="grid min-w-0 content-start gap-y-6 pt-8 pb-28 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-4 lg:pb-8"
        >
          {/* Identity band: app icon beside the reach-mode chooser, one row on
              lg+ so the lone icon circle doesn't occupy a full-width box. */}
          <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
            <AppIconBox
              appId={appId}
              teamId={teamId}
              appMetadataId={appMetadata.id}
              logoFile={appMetadata.logo_img_url}
              isEditable={appMetadata.verification_status === "unverified"}
              verificationStatus={appMetadata.verification_status}
            />

            <MiniAppConfiguration
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata as AppMetadata}
            />
          </div>

          <NumberedSection number="01" title="Basic information">
            <BasicInformation
              ref={basicInfoRef}
              appId={appId}
              teamId={teamId}
              app={app}
              teamName={teamName}
            />
          </NumberedSection>

          <AppStoreForm
            appId={appId}
            teamId={teamId}
            appMetadata={appMetadata as AppMetadata}
          />
        </div>

        <ConfigurationActions
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata}
          basicInfoRef={basicInfoRef}
        />
      </div>

      {/* The preview is a read-only visual aid; page actions live with the
          form in the neighboring column. */}
      <ReviewRail appId={appId} teamName={teamName} appMetadata={appMetadata} />
    </div>
  );
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  const {
    data,
    loading: isMetadataLoading,
    error,
  } = useQuery(FetchAppMetadataDocument, {
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];

  const appMetadata = useMemo(() => {
    const draftMetadata = app?.app_metadata?.[0];
    const verifiedMetadata = app?.verified_app_metadata?.[0];

    if (viewMode === "verified") {
      return verifiedMetadata ?? draftMetadata;
    }

    return draftMetadata ?? verifiedMetadata;
  }, [app, viewMode]);

  useEffect(() => {
    if (!app) return;

    const hasDraft = app.app_metadata.length > 0;
    const hasVerified = app.verified_app_metadata.length > 0;

    if (!hasDraft && hasVerified && viewMode !== "verified") {
      setViewMode("verified");
    } else if (!hasVerified && hasDraft && viewMode !== "unverified") {
      setViewMode("unverified");
    }
  }, [app, setViewMode, viewMode]);

  const { data: localisationsData, loading: isLocalisationsLoading } = useQuery(
    FetchLocalisationsDocument,
    {
      variables: {
        app_metadata_id: appMetadata?.id || "",
      },
      skip: !appMetadata?.id,
    },
  );

  const teamName = app?.team?.name ?? "";
  const isLoading = isMetadataLoading || isLocalisationsLoading;
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isRejected = appMetadata?.verification_status === "changes_requested";

  const { removeFromReview } = useRemoveFromReview({
    metadataId: appMetadata?.id,
  });

  if (!isMetadataLoading && (error || !app)) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  if (isLoading || !app || !appMetadata) {
    return (
      <>
        <SizingWrapper variant="nav" gridClassName="order-1 pt-8">
          <Skeleton count={2} height={50} />
          <hr className="my-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper variant="nav" gridClassName="order-2 pb-8 pt-4">
          <FormSkeleton count={4} />
        </SizingWrapper>
      </>
    );
  }

  return (
    <AppStoreFormProvider
      key={`${appMetadata.id}-${viewMode}`}
      appMetadata={appMetadata as AppMetadata}
      localisationsData={
        (localisationsData?.localisations || []) as LocalisationData
      }
    >
      <SaveStatusProvider>
        {/* Resolve Modal */}
        <ResolveModal
          open={showResolveModal}
          setOpen={setShowResolveModal}
          reviewMessage={appMetadata?.review_message}
          onResolve={removeFromReview}
        />

        {/* Rejection Warning Banner */}
        {isRejected && (
          <SizingWrapper variant="nav" gridClassName="order-1 pt-6">
            <RejectionBanner
              message={appMetadata?.review_message}
              onResolve={() => {
                setShowResolveModal(true);
              }}
            />
          </SizingWrapper>
        )}

        {/* Left-aligned full-width app frame (overrides SizingWrapper's
            centered column): fills the viewport below the shell's h-14
            header, so the window never scrolls — the form column scrolls
            internally and the preview pane stays fixed in place. */}
        <SizingWrapper
          className="min-w-0 lg:h-full"
          gridClassName={clsx(
            "order-2 grid-cols-[40px_minmax(0,1fr)_40px]",
            // Cap the single implicit row at the container height — without
            // this the row auto-sizes to the tall form and overflow-hidden
            // just clips it, leaving nothing scrollable.
            "lg:h-[calc(100dvh-3.5rem)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden",
          )}
        >
          <ConfigurationContent
            appId={appId}
            teamId={teamId}
            app={app}
            appMetadata={appMetadata}
            teamName={teamName}
          />
        </SizingWrapper>
      </SaveStatusProvider>
    </AppStoreFormProvider>
  );
};
