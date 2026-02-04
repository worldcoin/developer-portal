"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtom } from "jotai";
import { ErrorPage } from "@/components/ErrorPage";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { AppTopBar } from "../../AppTopBar";
import { FormSkeleton } from "../../AppTopBar/FormSkeleton";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { SetupForm } from "./SetupForm";

type AppProfileSetupPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileSetupPage = ({ params }: AppProfileSetupPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];
  const appMetaData = useMemo(() => {
    if (viewMode === "verified") {
      return app?.verified_app_metadata[0];
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];
    }
  }, [app, viewMode]);

  if (!loading && (error || !app)) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-8">
          {loading ? (
            <Skeleton count={2} height={50} />
          ) : (
            <AppTopBar appId={appId} teamId={teamId} app={app!} />
          )}

          <hr className="my-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pb-8 pt-4">
          <div className="grid max-w-[580px] grid-cols-1">
            {loading ? (
              <FormSkeleton count={3} />
            ) : (
              <SetupForm
                appId={appId}
                teamId={teamId}
                appMetadata={appMetaData}
              />
            )}
          </div>
        </SizingWrapper>
      </>
    );
  }
};
