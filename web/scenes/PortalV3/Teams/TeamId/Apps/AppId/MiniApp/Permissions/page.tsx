"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { useAtom } from "jotai";
import { useMemo, use } from "react";
import { FormSkeleton } from "../../Configuration/AppTopBar/FormSkeleton";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../Configuration/layout/ImagesProvider";
import { SaveStatusProvider } from "../../Configuration/SaveStatus";
import { SetupForm } from "../../MiniApp/PermissionsForm";
import { MiniAppSubTabs } from "../SubTabs";

type AppPermissionsPageProps = {
  params: Promise<Record<string, string>>;
};

export const AppPermissionsPage = (props: AppPermissionsPageProps) => {
  const params = use(props.params);
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];
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
    <SaveStatusProvider>
      <div className="md:hidden">
        <MiniAppSubTabs />
      </div>

      <div className="pb-24 pt-8">
        <div className="grid grid-cols-1">
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
    </SaveStatusProvider>
  );
};
