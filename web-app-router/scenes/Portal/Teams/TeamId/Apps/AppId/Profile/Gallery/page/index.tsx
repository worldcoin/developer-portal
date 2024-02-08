"use client";
import { useAtom } from "jotai";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import { unverifiedImageAtom, viewModeAtom } from "../../layout";
import { ImageForm } from "./ImageForm";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import Error from "next/error";
import { useMemo } from "react";

type AppProfileGalleryProps = {
  params: Record<string, string> | null | undefined;
};
export const AppProfileGalleryPage = ({ params }: AppProfileGalleryProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

  const { data, loading } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
  });

  const {} = useFetchImagesQuery({
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

  if (loading) return <div></div>;
  else if (!app) {
    <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div className="py-8 gap-y-4 grid pb-14">
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed " />
        <div className="grid grid-cols-1 max-w-[600px]">
          <ImageForm
            appId={appId}
            teamId={teamId}
            appMetadataId={appMetaData?.id ?? ""}
            appMetadata={appMetaData}
          />
        </div>
      </div>
    );
  }
};
