"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useParams } from "next/navigation";
import { MiniAppConfiguration } from "./MiniAppConfiguration";
import { DangerZoneSection } from "./Danger/DangerZoneSection";
import { FormSkeleton } from "./AppTopBar/FormSkeleton";
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
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";
import { ReviewRail } from "./ReviewRail";
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

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(420px,34%)] lg:grid-rows-[minmax(0,1fr)]">
      {/* Main column: the only scroll container on lg+ — the wheel moves the
          form while the preview pane stays put. */}
      <div className="grid min-w-0 content-start gap-y-6 pb-24 pt-8 lg:h-full lg:overflow-y-auto lg:pr-4">
        <MiniAppConfiguration
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata as AppMetadata}
        />

        <AppIconBox
          appId={appId}
          teamId={teamId}
          appMetadataId={appMetadata.id}
          logoFile={appMetadata.logo_img_url}
          isEditable={appMetadata.verification_status === "unverified"}
        />

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

        <DangerZoneSection
          appId={appId}
          teamId={teamId}
          appName={appMetadata.name}
        />
      </div>

      {/* Sticky right rail: live listing preview + submit + save status */}
      <ReviewRail
        appId={appId}
        teamId={teamId}
        teamName={teamName}
        appMetadata={appMetadata}
        basicInfoRef={basicInfoRef}
      />
    </div>
  );
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);

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
    if (viewMode === "verified") {
      return app?.verified_app_metadata[0];
    }

    return app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];
  }, [app, viewMode]);

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
