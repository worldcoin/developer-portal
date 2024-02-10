"use client";
import { useAtom } from "jotai";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { unverifiedImageAtom, viewModeAtom } from "../../layout";
import Error from "next/error";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import clsx from "clsx";
import { LinksForm } from "./LinksForm";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { FormSkeleton } from "../../PageComponents/AppTopBar/FormSkeleton";

type AppProfileLinksProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileLinksPage = ({ params }: AppProfileLinksProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
  });

  const { loading: loadingImages } = useFetchImagesQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
    onCompleted: (data) => {
      setUnverifiedImages({
        logo_img_url: data?.unverified_images?.logo_img_url ?? "",
        hero_image_url: data?.unverified_images?.hero_image_url ?? "",
        showcase_image_urls: data?.unverified_images?.showcase_img_urls,
      });
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
      <div className={clsx("py-8 gap-y-4 grid")}>
        {loading || loadingImages ? (
          <Skeleton count={2} height={50} />
        ) : (
          <AppTopBar appId={appId} teamId={teamId} app={app!} />
        )}
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <div className="grid grid-cols-1 max-w-[580px]">
          {loading ? (
            <FormSkeleton count={3} />
          ) : (
            <LinksForm
              appId={appId}
              teamId={teamId}
              appMetadata={appMetaData}
            />
          )}
        </div>
      </div>
    );
  }
};
