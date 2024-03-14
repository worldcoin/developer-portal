"use client";
import { useAtom } from "jotai";
import Error from "next/error";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import { FormSkeleton } from "../../PageComponents/AppTopBar/FormSkeleton";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { ImageForm } from "./ImageForm";

type AppProfileGalleryProps = {
  params: Record<string, string> | null | undefined;
};
export const AppProfileGalleryPage = ({ params }: AppProfileGalleryProps) => {
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
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div className="grid gap-y-4 py-8 pb-14">
        {loading ? (
          <Skeleton count={2} height={50} />
        ) : (
          <AppTopBar appId={appId} teamId={teamId} app={app!} />
        )}
        <hr className="my-5 w-full border-dashed text-grey-200 " />
        <div className="grid max-w-[580px] grid-cols-1">
          {loading ? (
            <FormSkeleton count={2} />
          ) : (
            <ImageForm
              appId={appId}
              teamId={teamId}
              appMetadataId={appMetaData?.id ?? ""}
              appMetadata={appMetaData}
            />
          )}
        </div>
      </div>
    );
  }
};

