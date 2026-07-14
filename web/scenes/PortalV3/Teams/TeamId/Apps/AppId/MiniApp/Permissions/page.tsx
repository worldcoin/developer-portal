"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { use } from "react";
import { FormSkeleton } from "../../Configuration/PageComponents/FormSkeleton";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { SaveStatusProvider } from "../../Configuration/SaveStatus";
import { SetupForm } from "../../MiniApp/PermissionsForm";

type AppPermissionsPageProps = {
  params: Promise<Record<string, string>>;
};

export const AppPermissionsPage = (props: AppPermissionsPageProps) => {
  const params = use(props.params);
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];
  // Permissions always target the active draft. Approved metadata is the
  // read-only fallback for apps that do not currently have a draft.
  const appMetadata = app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];

  if (!loading && (error || !app)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  return (
    <SaveStatusProvider>
      <div className="pt-8 pb-12">
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
