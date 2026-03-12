"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { AppTopBar } from "../../Configuration/AppTopBar";
import { FormSkeleton } from "../../Configuration/AppTopBar/FormSkeleton";
import { useFetchAppMetadataQuery } from "../../Configuration/graphql/client/fetch-app-metadata.generated";
import { SetupForm } from "../../MiniApp/PermissionsForm";
import { MiniAppSubTabs } from "../SubTabs";
import { useAppVersionMode } from "../../useAppVersionMode";

type AppPermissionsPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppPermissionsPage = ({ params }: AppPermissionsPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];
  const { viewMode } = useAppVersionMode({
    hasDraft: (app?.app_metadata.length ?? 0) > 0,
    hasVerified: (app?.verified_app_metadata.length ?? 0) > 0,
  });
  const appMetadata = useMemo(() => {
    if (viewMode === "verified") {
      return app?.verified_app_metadata[0];
    }
    // Null check in case app got verified and has no unverified metadata
    return app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];
  }, [app, viewMode]);

  if (!loading && (error || !app)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  return (
    <>
      <div className="py-10">
        {loading ? (
          <Skeleton count={2} height={50} />
        ) : (
          <AppTopBar appId={appId} teamId={teamId} app={app!} />
        )}
      </div>

      <div className="md:hidden">
        <MiniAppSubTabs />
      </div>

      <div className="border-t border-grey-100" />

      <div className="pb-6 pt-8">
        <div className="grid max-w-[580px] grid-cols-1">
          {loading ? (
            <FormSkeleton count={3} />
          ) : (
            <SetupForm
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
            />
          )}
        </div>
      </div>
    </>
  );
};
