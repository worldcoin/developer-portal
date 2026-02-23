"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useParams } from "next/navigation";
import { SetupForm } from "./Advanced/page/SetupForm";
import { AppTopBar } from "./AppTopBar";
import { FormSkeleton } from "./AppTopBar/FormSkeleton";
import { AppStoreForm } from "./AppStore/app-store";
import { AppStoreFormProvider } from "./AppStore/app-store-form-provider";
import {
  AppMetadata,
  LocalisationData,
} from "./AppStore/types/AppStoreFormTypes";
import { BasicInformation } from "./BasicInformation";
import {
  FetchAppMetadataQuery,
  useFetchAppMetadataQuery,
} from "./graphql/client/fetch-app-metadata.generated";
import { useFetchTeamNameQuery } from "./graphql/client/fetch-team-name.generated";
import { viewModeAtom } from "./layout/ImagesProvider";
import { useFetchLocalisationsQuery } from "./AppStore/graphql/client/fetch-localisations.generated";
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
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

  const { data: teamData } = useFetchTeamNameQuery({
    variables: {
      id: teamId,
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

  const teamName = teamData?.team[0]?.name;
  const isLoading = isMetadataLoading || isLocalisationsLoading;
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isRejected = appMetadata?.verification_status === "changes_requested";

  if (!isMetadataLoading && (error || !app)) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  if (isLoading || !app || !appMetadata) {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-8">
          <Skeleton count={2} height={50} />
          <hr className="my-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pb-8 pt-4">
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
      {/* Resolve Modal */}
      <ResolveModal
        open={showResolveModal}
        setOpen={setShowResolveModal}
        reviewMessage={appMetadata?.review_message}
        onResolve={() => {
          // Close modal after resolving - user can now edit and resubmit
          setShowResolveModal(false);
        }}
      />

      {/* Rejection Warning Banner */}
      {isRejected && (
        <SizingWrapper gridClassName="order-0 pt-8">
          <RejectionBanner
            message={appMetadata?.review_message}
            onResolve={() => {
              setShowResolveModal(true);
            }}
          />
        </SizingWrapper>
      )}

      <SizingWrapper gridClassName="order-1 pt-8 pb-6">
        <AppTopBar
          appId={appId}
          teamId={teamId}
          app={app}
          onResolve={() => setShowResolveModal(true)}
        />
      </SizingWrapper>

      {/* Subtle divider */}
      <SizingWrapper gridClassName="order-2">
        <div className="border-t border-grey-100" />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-3 pt-8 pb-6">
        <BasicInformation
          appId={appId}
          teamId={teamId}
          app={app}
          teamName={teamName ?? ""}
        />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-4 pt-6 pb-6">
        <div className="grid max-w-[580px] grid-cols-1">
          <SetupForm
            appId={appId}
            teamId={teamId}
            appMetadata={
              appMetadata as FetchAppMetadataQuery["app"][0]["app_metadata"][0]
            }
          />
        </div>
      </SizingWrapper>

      <SizingWrapper gridClassName="order-5 pt-6 pb-8">
        <AppStoreForm
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata as AppMetadata}
        />
      </SizingWrapper>
    </AppStoreFormProvider>
  );
};
