"use client";

import { AppStatus } from "@/components/AppStatus";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
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
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "./layout/ImagesProvider";
import { useFetchLocalisationsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { AppIconBox } from "./PageComponents/AppIconBox";
import { NumberedSection } from "./PageComponents/NumberedSection";
import { SectionToc } from "./PageComponents/SectionToc";
import { InReviewBanner } from "./InReviewBanner";
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";
import { ConfigurationActions, ReviewRail } from "./ReviewRail";
import { SaveStatusProvider } from "./SaveStatus";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
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

const VerifiedAppBanner = ({
  appId,
  teamId,
}: {
  appId: `app_${string}`;
  teamId: `team_${string}`;
}) => (
  <div className="border-system-success-200 flex flex-col gap-4 rounded-20 border bg-system-success-50 p-5 sm:flex-row sm:items-center">
    <div className="flex flex-1 items-center gap-3">
      <AppStatus status="verified" />
      <Typography variant={TYPOGRAPHY.R4} className="text-system-success-700">
        This approved version is read-only.
      </Typography>
    </div>

    <DecoratedButton
      href={urls.app({ team_id: teamId, app_id: appId })}
      variant="secondary"
      className="h-10 px-4 py-2"
    >
      <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
        Back to app
      </Typography>
    </DecoratedButton>
  </div>
);

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
        <div
          ref={scrollContainerRef}
          className="grid min-w-0 content-start gap-y-6 pb-28 pt-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-8 lg:pr-4"
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
  } = useFetchAppMetadataQuery({
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

  const { data: localisationsData, loading: isLocalisationsLoading } =
    useFetchLocalisationsQuery({
      variables: {
        app_metadata_id: appMetadata?.id || "",
      },
      skip: !appMetadata?.id,
    });

  const teamName = app?.team?.name ?? "";
  const isLoading = isMetadataLoading || isLocalisationsLoading;
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isRejected = appMetadata?.verification_status === "changes_requested";
  const isInReview = appMetadata?.verification_status === "awaiting_review";
  const isVerified = appMetadata?.verification_status === "verified";

  const { removeFromReview, loading: isRemovingFromReview } =
    useRemoveFromReview({
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

        {/* Locked-state strip: explains the disabled fields while the draft
            awaits review, and offers the only unlock path (un-submit). */}
        {isInReview && (
          <SizingWrapper variant="nav" gridClassName="order-1 pt-6">
            <InReviewBanner
              teamId={teamId}
              onUnsubmit={removeFromReview}
              loading={isRemovingFromReview}
            />
          </SizingWrapper>
        )}

        {isVerified && (
          <SizingWrapper variant="nav" gridClassName="order-1 pt-6">
            <VerifiedAppBanner appId={appId} teamId={teamId} />
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
