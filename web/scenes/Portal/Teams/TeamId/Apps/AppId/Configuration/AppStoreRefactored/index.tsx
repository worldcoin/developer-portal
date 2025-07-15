"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtom } from "jotai";
import Error from "next/error";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { AppTopBar as AppTopBarOld } from "../AppTopBar";
import { AppTopBarRefactored } from "../AppTopBarRefactored";
import { useFetchAppMetadataQuery } from "../graphql/client/fetch-app-metadata.generated";
import { INTERNAL_TEAM_IDS } from "../layout/constants-temp";
import { viewModeAtom } from "../layout/ImagesProvider";
import { AppStoreFormProvider } from "./app-store-form-provider";
import { AppStoreFormRefactored } from "./app-store-refactored";
import { useFetchLocalisationsQuery } from "./graphql/client/fetch-localisations.generated";

type AppProfileGalleryProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileGalleryPage = ({ params }: AppProfileGalleryProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
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
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];
    }
  }, [app, viewMode]);

  const { data: localisationsData, loading: isLocalisationsLoading } =
    useFetchLocalisationsQuery({
      variables: {
        app_metadata_id: appMetadata?.id || "",
      },
      skip: !appMetadata?.id,
    });

  const isLoading = isMetadataLoading || isLocalisationsLoading;

  // temp
  const isInternalTeam = INTERNAL_TEAM_IDS.includes(teamId);
  const AppTopBar = isInternalTeam ? AppTopBarRefactored : AppTopBarOld;

  if (isLoading) {
    return (
      <SizingWrapper gridClassName="order-1 pt-8">
        <div className="grid gap-y-10">
          <Skeleton count={2} height={50} />
          <Skeleton count={3} height={80} />
        </div>
      </SizingWrapper>
    );
  }

  if (error || !app || !appMetadata) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <AppStoreFormProvider
        appMetadata={appMetadata}
        localisationsData={localisationsData?.localisations || []}
      >
        <SizingWrapper gridClassName="order-1 pt-8">
          <AppTopBar appId={appId} teamId={teamId} app={app!} />
          <hr className="my-5 w-full border-dashed text-grey-200 " />
        </SizingWrapper>
        <SizingWrapper gridClassName="order-2 pb-8 pt-4">
          <div className="grid max-w-[580px] grid-cols-1">
            <AppStoreFormRefactored
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
            />
          </div>
        </SizingWrapper>
      </AppStoreFormProvider>
    );
  }
};
